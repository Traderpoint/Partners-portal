<?php
/**
 * HostBill Affiliate Conversion Tracking
 * Umístění: /includes/affiliate/conversion.php
 * Verze: 1.0.0
 * 
 * Tento soubor nahrajte na váš HostBill server do složky:
 * /path/to/hostbill/includes/affiliate/conversion.php
 * 
 * DŮLEŽITÉ: Nastavte správná oprávnění: chmod 644
 */

// Zabránění přímému přístupu
if (!defined('HOSTBILL_AFFILIATE_CONVERSION')) {
    define('HOSTBILL_AFFILIATE_CONVERSION', true);
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
    error_log("HostBill Affiliate Conversion - Database connection failed: " . $e->getMessage());
    http_response_code(500);
    die(json_encode(['error' => 'Database connection failed']));
}

// Headers
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

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

// Validate required fields
$required = ['affiliate_id', 'order_id', 'amount'];
foreach ($required as $field) {
    if (!isset($input[$field]) || $input[$field] === '') {
        http_response_code(400);
        die(json_encode(['error' => "Missing required field: $field"]));
    }
}

try {
    // Validate affiliate exists and is active
    $stmt = $pdo->prepare("SELECT id, commission_rate FROM tblaffiliates WHERE id = ? AND status = 'active'");
    $stmt->execute([(int)$input['affiliate_id']]);
    $affiliate = $stmt->fetch();
    
    if (!$affiliate) {
        http_response_code(400);
        die(json_encode(['error' => 'Invalid or inactive affiliate ID']));
    }
    
    // Check for duplicate conversion
    $stmt = $pdo->prepare("SELECT id FROM tblaffiliateconversions WHERE order_id = ?");
    $stmt->execute([$input['order_id']]);
    
    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => false, 'message' => 'Conversion already exists']);
        exit;
    }
    
    // Calculate commission
    $commission_rate = calculateCommissionRate($pdo, $input['affiliate_id'], $input['products'] ?? []);
    $commission_amount = $input['amount'] * ($commission_rate / 100);
    
    // Insert conversion
    $stmt = $pdo->prepare("
        INSERT INTO tblaffiliateconversions 
        (affiliate_id, order_id, amount, commission_rate, commission_amount, currency, products, conversion_date, status, ip_address, user_agent) 
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 'pending', ?, ?)
    ");
    
    $result = $stmt->execute([
        (int)$input['affiliate_id'],
        $input['order_id'],
        (float)$input['amount'],
        $commission_rate,
        $commission_amount,
        $input['currency'] ?? 'CZK',
        json_encode($input['products'] ?? []),
        $_SERVER['REMOTE_ADDR'] ?? '',
        $_SERVER['HTTP_USER_AGENT'] ?? ''
    ]);
    
    if ($result) {
        // Update affiliate statistics
        updateAffiliateStatistics($pdo, $input['affiliate_id'], $commission_amount);
        
        // Send notification email (optional)
        if (isset($input['send_notification']) && $input['send_notification']) {
            sendAffiliateNotification($pdo, $input['affiliate_id'], $commission_amount, $input['order_id']);
        }
        
        // Log successful conversion
        error_log("Affiliate conversion tracked: Affiliate {$input['affiliate_id']}, Order {$input['order_id']}, Commission {$commission_amount} CZK");
        
        echo json_encode([
            'success' => true,
            'conversion_id' => $pdo->lastInsertId(),
            'commission_amount' => $commission_amount,
            'commission_rate' => $commission_rate,
            'message' => 'Conversion tracked successfully'
        ]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to insert conversion']);
    }
    
} catch (Exception $e) {
    error_log("Conversion tracking error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Internal server error']);
}

/**
 * Calculate commission rate based on affiliate and products
 */
function calculateCommissionRate($pdo, $affiliate_id, $products) {
    try {
        // Get base commission rate from affiliate
        $stmt = $pdo->prepare("SELECT commission_rate FROM tblaffiliates WHERE id = ?");
        $stmt->execute([$affiliate_id]);
        $affiliate = $stmt->fetch();
        
        $base_rate = $affiliate['commission_rate'] ?? 10;
        
        // Check for product-specific rates (if table exists)
        if (!empty($products)) {
            try {
                $placeholders = str_repeat('?,', count($products) - 1) . '?';
                $stmt = $pdo->prepare("
                    SELECT AVG(commission_rate) as avg_rate 
                    FROM tblaffiliateproductcommissions 
                    WHERE affiliate_id = ? AND product_name IN ($placeholders)
                ");
                $params = array_merge([$affiliate_id], $products);
                $stmt->execute($params);
                $product_rate = $stmt->fetch();
                
                if ($product_rate && $product_rate['avg_rate']) {
                    return $product_rate['avg_rate'];
                }
            } catch (Exception $e) {
                // Table might not exist, use base rate
            }
        }
        
        return $base_rate;
        
    } catch (Exception $e) {
        error_log("Commission rate calculation error: " . $e->getMessage());
        return 10; // Default fallback rate
    }
}

/**
 * Update affiliate statistics
 */
function updateAffiliateStatistics($pdo, $affiliate_id, $commission_amount) {
    try {
        $today = date('Y-m-d');
        
        // Update daily statistics
        $stmt = $pdo->prepare("
            INSERT INTO tblaffiliatestats (affiliate_id, date, conversions, earnings) 
            VALUES (?, ?, 1, ?)
            ON DUPLICATE KEY UPDATE 
                conversions = conversions + 1,
                earnings = earnings + ?
        ");
        $stmt->execute([$affiliate_id, $today, $commission_amount, $commission_amount]);
        
        // Update affiliate totals
        $stmt = $pdo->prepare("
            UPDATE tblaffiliates SET 
                total_conversions = total_conversions + 1,
                total_earnings = total_earnings + ?,
                last_activity = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$commission_amount, $affiliate_id]);
        
    } catch (Exception $e) {
        error_log("Update affiliate statistics error: " . $e->getMessage());
    }
}

/**
 * Send notification email to affiliate
 */
function sendAffiliateNotification($pdo, $affiliate_id, $commission_amount, $order_id) {
    try {
        // Get affiliate details
        $stmt = $pdo->prepare("SELECT email, firstname, lastname FROM tblaffiliates WHERE id = ?");
        $stmt->execute([$affiliate_id]);
        $affiliate = $stmt->fetch();
        
        if (!$affiliate || !$affiliate['email']) {
            return false;
        }
        
        $to = $affiliate['email'];
        $name = trim($affiliate['firstname'] . ' ' . $affiliate['lastname']);
        $subject = "Nová provize - Objednávka #$order_id";
        
        $message = "
Dobrý den " . ($name ?: 'partnere') . ",

máme pro vás skvělou zprávu! Právě jste získali novou provizi z affiliate programu.

Detaily provize:
- Objednávka: #$order_id
- Výše provize: " . number_format($commission_amount, 2) . " Kč
- Datum: " . date('d.m.Y H:i') . "

Provize bude připsána na váš účet po schválení objednávky.

Děkujeme za vaši spolupráci!

S pozdravem,
Tým Systrix
        ";
        
        $headers = [
            'From: noreply@systrix.cz',
            'Reply-To: podpora@systrix.cz',
            'Content-Type: text/plain; charset=UTF-8',
            'X-Mailer: HostBill Affiliate System'
        ];
        
        // Send email (uncomment to enable)
        // mail($to, $subject, $message, implode("\r\n", $headers));
        
        // Log notification
        error_log("Affiliate notification sent to: $to, Commission: $commission_amount CZK");
        
        return true;
        
    } catch (Exception $e) {
        error_log("Failed to send affiliate notification: " . $e->getMessage());
        return false;
    }
}

/**
 * Validate order data
 */
function validateOrderData($order_data) {
    $errors = [];
    
    if (!isset($order_data['order_id']) || empty($order_data['order_id'])) {
        $errors[] = 'Order ID is required';
    }
    
    if (!isset($order_data['amount']) || !is_numeric($order_data['amount']) || $order_data['amount'] <= 0) {
        $errors[] = 'Valid amount is required';
    }
    
    if (!isset($order_data['affiliate_id']) || !is_numeric($order_data['affiliate_id']) || $order_data['affiliate_id'] <= 0) {
        $errors[] = 'Valid affiliate ID is required';
    }
    
    return $errors;
}
?>
