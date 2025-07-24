<?php
/**
 * HostBill Affiliate Tracking API
 * Umístění: /includes/affiliate/api.php
 * Verze: 1.0.0
 * 
 * Tento soubor nahrajte na váš HostBill server do složky:
 * /path/to/hostbill/includes/affiliate/api.php
 * 
 * DŮLEŽITÉ: Nastavte správná oprávnění: chmod 644
 */

// Zabránění přímému přístupu
if (!defined('HOSTBILL_AFFILIATE_API')) {
    define('HOSTBILL_AFFILIATE_API', true);
}

// Načtení HostBill konfigurace
$hostbill_root = dirname(dirname(__DIR__));
$config_file = $hostbill_root . '/configuration.php';

if (!file_exists($config_file)) {
    http_response_code(500);
    die(json_encode(['error' => 'HostBill configuration not found']));
}

require_once $config_file;

// Database connection
try {
    $pdo = new PDO(
        "mysql:host=" . $db_host . ";dbname=" . $db_name . ";charset=utf8mb4",
        $db_username,
        $db_password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
} catch (PDOException $e) {
    error_log("HostBill Affiliate API - Database connection failed: " . $e->getMessage());
    http_response_code(500);
    die(json_encode(['error' => 'Database connection failed']));
}

// CORS headers
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(['error' => 'Method not allowed']));
}

// Parse input
$input = json_decode(file_get_contents('php://input'), true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    die(json_encode(['error' => 'Invalid JSON input']));
}

$action = $input['action'] ?? '';
$data = $input['data'] ?? [];

// Validate action
if (empty($action)) {
    http_response_code(400);
    die(json_encode(['error' => 'Action is required']));
}

// Route actions
try {
    switch ($action) {
        case 'track_visit':
            trackAffiliateVisit($pdo, $data);
            break;
        case 'track_conversion':
            trackAffiliateConversion($pdo, $data);
            break;
        case 'track_pageview':
            trackPageView($pdo, $data);
            break;
        case 'get_stats':
            getAffiliateStats($pdo, $data);
            break;
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action: ' . $action]);
            exit;
    }
} catch (Exception $e) {
    error_log("HostBill Affiliate API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

/**
 * Track affiliate visit
 */
function trackAffiliateVisit($pdo, $data) {
    // Validate required fields
    if (empty($data['affiliate_id'])) {
        http_response_code(400);
        die(json_encode(['error' => 'Affiliate ID is required']));
    }
    
    try {
        // Check if affiliate exists and is active
        $stmt = $pdo->prepare("SELECT id FROM tblaffiliates WHERE id = ? AND status = 'active'");
        $stmt->execute([(int)$data['affiliate_id']]);
        
        if ($stmt->rowCount() === 0) {
            echo json_encode(['success' => false, 'error' => 'Invalid affiliate ID']);
            return;
        }
        
        // Insert visit record
        $stmt = $pdo->prepare("
            INSERT INTO tblaffiliatevisits 
            (affiliate_id, page, referrer, ip_address, user_agent, visit_date, session_id) 
            VALUES (?, ?, ?, ?, ?, NOW(), ?)
        ");
        
        $session_id = session_id() ?: uniqid('sess_', true);
        
        $result = $stmt->execute([
            (int)$data['affiliate_id'],
            $data['page'] ?? '',
            $data['referrer'] ?? '',
            $_SERVER['REMOTE_ADDR'] ?? '',
            $_SERVER['HTTP_USER_AGENT'] ?? '',
            $session_id
        ]);
        
        // Update affiliate stats
        updateAffiliateStats($pdo, $data['affiliate_id'], 'visit');
        
        echo json_encode(['success' => $result]);
        
    } catch (Exception $e) {
        error_log("Affiliate visit tracking error: " . $e->getMessage());
        echo json_encode(['success' => false, 'error' => 'Failed to track visit']);
    }
}

/**
 * Track affiliate conversion
 */
function trackAffiliateConversion($pdo, $data) {
    // Validate required fields
    $required = ['affiliate_id', 'order_id', 'amount'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            http_response_code(400);
            die(json_encode(['error' => "Field '$field' is required"]));
        }
    }
    
    try {
        // Check for duplicate conversion
        $stmt = $pdo->prepare("SELECT id FROM tblaffiliateconversions WHERE order_id = ?");
        $stmt->execute([$data['order_id']]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => false, 'message' => 'Conversion already tracked']);
            return;
        }
        
        // Get affiliate commission rate
        $commission_rate = getCommissionRate($pdo, $data['affiliate_id'], $data['products'] ?? []);
        $commission_amount = $data['amount'] * ($commission_rate / 100);
        
        // Insert conversion
        $stmt = $pdo->prepare("
            INSERT INTO tblaffiliateconversions 
            (affiliate_id, order_id, amount, commission_rate, commission_amount, currency, products, conversion_date, status, ip_address) 
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 'pending', ?)
        ");
        
        $result = $stmt->execute([
            (int)$data['affiliate_id'],
            $data['order_id'],
            (float)$data['amount'],
            $commission_rate,
            $commission_amount,
            $data['currency'] ?? 'CZK',
            json_encode($data['products'] ?? []),
            $_SERVER['REMOTE_ADDR'] ?? ''
        ]);
        
        if ($result) {
            // Update affiliate stats
            updateAffiliateStats($pdo, $data['affiliate_id'], 'conversion', $commission_amount);
            
            echo json_encode([
                'success' => true,
                'commission_amount' => $commission_amount,
                'commission_rate' => $commission_rate
            ]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to track conversion']);
        }
        
    } catch (Exception $e) {
        error_log("Affiliate conversion tracking error: " . $e->getMessage());
        echo json_encode(['success' => false, 'error' => 'Failed to track conversion']);
    }
}

/**
 * Track page view
 */
function trackPageView($pdo, $data) {
    if (empty($data['affiliate_id'])) {
        http_response_code(400);
        die(json_encode(['error' => 'Affiliate ID is required']));
    }
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO tblaffiliatepageviews 
            (affiliate_id, page, referrer, ip_address, user_agent, timestamp, session_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        
        $session_id = session_id() ?: uniqid('sess_', true);
        
        $result = $stmt->execute([
            (int)$data['affiliate_id'],
            $data['page'] ?? '',
            $data['referrer'] ?? '',
            $_SERVER['REMOTE_ADDR'] ?? '',
            $_SERVER['HTTP_USER_AGENT'] ?? '',
            $data['timestamp'] ?? time(),
            $session_id
        ]);
        
        echo json_encode(['success' => $result]);
        
    } catch (Exception $e) {
        error_log("Page view tracking error: " . $e->getMessage());
        echo json_encode(['success' => false, 'error' => 'Failed to track page view']);
    }
}

/**
 * Get affiliate statistics
 */
function getAffiliateStats($pdo, $data) {
    if (empty($data['affiliate_id'])) {
        http_response_code(400);
        die(json_encode(['error' => 'Affiliate ID is required']));
    }
    
    try {
        $affiliate_id = (int)$data['affiliate_id'];
        
        // Get basic stats
        $stmt = $pdo->prepare("
            SELECT 
                (SELECT COUNT(*) FROM tblaffiliatevisits WHERE affiliate_id = ?) as visits,
                (SELECT COUNT(*) FROM tblaffiliateconversions WHERE affiliate_id = ?) as conversions,
                (SELECT COALESCE(SUM(commission_amount), 0) FROM tblaffiliateconversions WHERE affiliate_id = ? AND status = 'approved') as earnings
        ");
        $stmt->execute([$affiliate_id, $affiliate_id, $affiliate_id]);
        $stats = $stmt->fetch();
        
        echo json_encode([
            'success' => true,
            'stats' => $stats
        ]);
        
    } catch (Exception $e) {
        error_log("Get affiliate stats error: " . $e->getMessage());
        echo json_encode(['success' => false, 'error' => 'Failed to get stats']);
    }
}

/**
 * Get commission rate for affiliate
 */
function getCommissionRate($pdo, $affiliate_id, $products) {
    try {
        $stmt = $pdo->prepare("
            SELECT commission_rate 
            FROM tblaffiliates 
            WHERE id = ? AND status = 'active'
        ");
        $stmt->execute([$affiliate_id]);
        $affiliate = $stmt->fetch();
        
        if (!$affiliate) {
            return 10; // Default rate
        }
        
        return $affiliate['commission_rate'] ?? 10;
    } catch (Exception $e) {
        return 10; // Fallback rate
    }
}

/**
 * Update affiliate statistics
 */
function updateAffiliateStats($pdo, $affiliate_id, $type, $amount = 0) {
    try {
        $today = date('Y-m-d');
        
        // Insert or update daily stats
        $stmt = $pdo->prepare("
            INSERT INTO tblaffiliatestats (affiliate_id, date, visits, conversions, earnings) 
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                visits = visits + ?,
                conversions = conversions + ?,
                earnings = earnings + ?
        ");
        
        $visits = ($type === 'visit') ? 1 : 0;
        $conversions = ($type === 'conversion') ? 1 : 0;
        
        $stmt->execute([
            $affiliate_id, $today, $visits, $conversions, $amount,
            $visits, $conversions, $amount
        ]);
        
        // Update affiliate totals
        $stmt = $pdo->prepare("
            UPDATE tblaffiliates SET 
                total_visits = total_visits + ?,
                total_conversions = total_conversions + ?,
                total_earnings = total_earnings + ?,
                last_activity = NOW()
            WHERE id = ?
        ");
        
        $stmt->execute([$visits, $conversions, $amount, $affiliate_id]);
        
    } catch (Exception $e) {
        error_log("Update affiliate stats error: " . $e->getMessage());
    }
}
?>
