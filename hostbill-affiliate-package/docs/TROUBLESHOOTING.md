# 🔧 HostBill Affiliate System - Troubleshooting Guide

## 🚨 **Nejčastější problémy a řešení**

### **1. API vrací chybu 500**

**Příznaky:**
- API endpoint neodpovídá
- JavaScript console zobrazuje 500 chyby
- Tracking nefunguje

**Možné příčiny a řešení:**

#### **A) Chyba v databázovém připojení**
```bash
# Zkontrolujte error log
tail -f /var/log/apache2/error.log
# nebo
tail -f /var/log/nginx/error.log

# Hledejte chyby typu:
# "Database connection failed"
# "Access denied for user"
```

**Řešení:**
1. Ověřte databázové údaje v `configuration.php`
2. Zkontrolujte, že databázový uživatel má správná oprávnění
3. Otestujte připojení:
```php
<?php
// test_db.php
require_once 'configuration.php';
try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name", $db_username, $db_password);
    echo "Database connection OK";
} catch (Exception $e) {
    echo "Database error: " . $e->getMessage();
}
?>
```

#### **B) Chybějící tabulky**
```sql
-- Zkontrolujte, že všechny tabulky existují
SHOW TABLES LIKE 'tblaffiliate%';

-- Měli byste vidět:
-- tblaffiliatevisits
-- tblaffiliateconversions
-- tblaffiliatepageviews
-- tblaffiliatestats
```

**Řešení:**
Spusťte znovu SQL skript `sql/01_create_tables.sql`

#### **C) Špatná oprávnění souborů**
```bash
# Zkontrolujte oprávnění
ls -la includes/affiliate/

# Nastavte správná oprávnění
chmod 644 includes/affiliate/*.php
chmod 755 includes/affiliate/
```

---

### **2. Tracking nefunguje**

**Příznaky:**
- Affiliate cookie se nenastavuje
- Návštěvy se nezaznamenávají
- JavaScript chyby v konzoli

**Diagnostika:**

#### **A) Zkontrolujte JavaScript konzoli**
```javascript
// Otevřete Developer Tools → Console
// Zkontrolujte chyby a varování

// Testovací příkazy:
console.log(window.HostBillTracking);
console.log(window.hostbillAffiliate);

// Test manuálního trackingu
window.HostBillTracking.trackPageView('/test');
```

#### **B) Zkontrolujte Network tab**
1. Otevřete Developer Tools → Network
2. Obnovte stránku s `?aff=1`
3. Hledejte požadavky na `/includes/affiliate/api.php`
4. Zkontrolujte response

**Možná řešení:**

#### **A) CORS problémy**
```php
// V api.php zkontrolujte CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
```

#### **B) JavaScript se nenačítá**
```html
<!-- Zkontrolujte, že tracking.js je dostupný -->
<script src="/includes/affiliate/tracking.js"></script>

<!-- Nebo testujte přímo -->
https://your-domain.com/includes/affiliate/tracking.js
```

#### **C) Cookie problémy**
```javascript
// Zkontrolujte cookie nastavení
document.cookie = "test=1; path=/; SameSite=Lax";

// Zkontrolujte, že cookie se nastavuje
console.log(document.cookie);
```

---

### **3. Conversion tracking nefunguje**

**Příznaky:**
- Konverze se nezaznamenávají
- API vrací chyby při conversion trackingu
- Provize se nepočítají

**Diagnostika:**

#### **A) Zkontrolujte API volání**
```javascript
// V Developer Tools → Network
// Hledejte POST požadavky na conversion.php
// Zkontrolujte payload a response
```

#### **B) Zkontrolujte databázi**
```sql
-- Zkontrolujte, že se data ukládají
SELECT * FROM tblaffiliateconversions ORDER BY id DESC LIMIT 5;

-- Zkontrolujte affiliate existenci
SELECT * FROM tblaffiliates WHERE status = 'active';
```

**Možná řešení:**

#### **A) Chybějící affiliate ID**
```javascript
// Zkontrolujte, že affiliate ID existuje
var affiliateId = window.HostBillTracking.getAffiliateId();
console.log('Affiliate ID:', affiliateId);

// Pokud je null, zkontrolujte cookie
console.log('Cookies:', document.cookie);
```

#### **B) Neplatná data**
```javascript
// Zkontrolujte formát conversion dat
var orderData = {
    orderId: 'ORDER-123',        // Povinné
    amount: 249.00,              // Povinné, číslo
    currency: 'CZK',             // Volitelné
    products: ['VPS Start']      // Volitelné
};
```

---

### **4. Databázové problémy**

#### **A) Pomalé dotazy**
```sql
-- Zkontrolujte pomalé dotazy
SHOW PROCESSLIST;

-- Přidejte indexy pro optimalizaci
ALTER TABLE tblaffiliatevisits ADD INDEX idx_affiliate_date (affiliate_id, visit_date);
ALTER TABLE tblaffiliateconversions ADD INDEX idx_status_date (status, conversion_date);
```

#### **B) Chybějící sloupce**
```sql
-- Zkontrolujte strukturu tabulek
DESCRIBE tblaffiliatevisits;
DESCRIBE tblaffiliateconversions;

-- Přidejte chybějící sloupce
ALTER TABLE tblaffiliates ADD COLUMN commission_rate DECIMAL(5,2) DEFAULT 10.00;
```

#### **C) Encoding problémy**
```sql
-- Zkontrolujte charset
SHOW CREATE TABLE tblaffiliatevisits;

-- Změňte na UTF-8 pokud potřeba
ALTER TABLE tblaffiliatevisits CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

### **5. Email notifikace nefungují**

**Příznaky:**
- Affiliate nedostávají notifikace
- PHP mail() funkce nefunguje

**Řešení:**

#### **A) Zkontrolujte PHP mail konfiguraci**
```php
// test_mail.php
<?php
$to = 'test@example.com';
$subject = 'Test email';
$message = 'This is a test email';
$headers = 'From: noreply@systrix.cz';

if (mail($to, $subject, $message, $headers)) {
    echo 'Email sent successfully';
} else {
    echo 'Email failed to send';
}
?>
```

#### **B) Použijte SMTP**
```php
// V conversion.php nahraďte mail() za SMTP
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;

$mail = new PHPMailer(true);
$mail->isSMTP();
$mail->Host = 'smtp.gmail.com';
$mail->SMTPAuth = true;
$mail->Username = 'your-email@gmail.com';
$mail->Password = 'your-password';
$mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
$mail->Port = 587;
```

---

### **6. Performance problémy**

#### **A) Pomalé načítání**
```bash
# Zkontrolujte server load
top
htop

# Zkontrolujte MySQL procesy
mysqladmin processlist
```

#### **B) Optimalizace**
```sql
-- Vyčistěte staré záznamy
DELETE FROM tblaffiliatevisits WHERE visit_date < DATE_SUB(NOW(), INTERVAL 1 YEAR);

-- Optimalizujte tabulky
OPTIMIZE TABLE tblaffiliatevisits;
OPTIMIZE TABLE tblaffiliateconversions;
```

#### **C) Cache implementace**
```php
// Přidejte cache do api.php
$cache_key = 'affiliate_stats_' . $affiliate_id;
$cached_data = apcu_fetch($cache_key);

if ($cached_data === false) {
    // Načtěte data z databáze
    $data = getAffiliateStats($pdo, $affiliate_id);
    apcu_store($cache_key, $data, 3600); // Cache na 1 hodinu
} else {
    $data = $cached_data;
}
```

---

## 🔍 **Diagnostické nástroje**

### **1. Debug skript**
```php
<?php
// debug_affiliate.php
require_once 'configuration.php';

echo "<h2>HostBill Affiliate Debug</h2>";

// Test databázového připojení
try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name", $db_username, $db_password);
    echo "✅ Database connection OK<br>";
} catch (Exception $e) {
    echo "❌ Database error: " . $e->getMessage() . "<br>";
}

// Zkontroluj tabulky
$tables = ['tblaffiliatevisits', 'tblaffiliateconversions', 'tblaffiliatestats'];
foreach ($tables as $table) {
    $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
    if ($stmt->rowCount() > 0) {
        echo "✅ Table $table exists<br>";
    } else {
        echo "❌ Table $table missing<br>";
    }
}

// Zkontroluj affiliate data
$stmt = $pdo->query("SELECT COUNT(*) as count FROM tblaffiliates WHERE status = 'active'");
$count = $stmt->fetch()['count'];
echo "📊 Active affiliates: $count<br>";

// Zkontroluj tracking data
$stmt = $pdo->query("SELECT COUNT(*) as count FROM tblaffiliatevisits WHERE visit_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)");
$visits = $stmt->fetch()['count'];
echo "📊 Visits last 7 days: $visits<br>";

echo "<h3>Recent visits:</h3>";
$stmt = $pdo->query("SELECT * FROM tblaffiliatevisits ORDER BY id DESC LIMIT 5");
while ($row = $stmt->fetch()) {
    echo "ID: {$row['id']}, Affiliate: {$row['affiliate_id']}, Page: {$row['page']}, Date: {$row['visit_date']}<br>";
}
?>
```

### **2. JavaScript debug**
```javascript
// Přidejte do tracking.js
window.AffiliateDebug = {
    testTracking: function() {
        console.log('Testing affiliate tracking...');
        
        // Test cookie
        var affiliateId = window.HostBillTracking.getAffiliateId();
        console.log('Affiliate ID:', affiliateId);
        
        // Test API
        window.HostBillTracking.trackPageView('/debug-test');
        
        // Test conversion
        window.HostBillTracking.trackConversion({
            orderId: 'DEBUG-' + Date.now(),
            amount: 100,
            currency: 'CZK',
            products: ['Debug Product']
        });
    },
    
    showStats: function() {
        fetch('/includes/affiliate/api.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                action: 'get_stats',
                data: {affiliate_id: window.HostBillTracking.getAffiliateId()}
            })
        })
        .then(response => response.json())
        .then(data => console.log('Stats:', data));
    }
};

// Použití:
// AffiliateDebug.testTracking();
// AffiliateDebug.showStats();
```

---

## 📞 **Kontakt na podporu**

Pokud problém přetrvává:

1. **Shromážděte informace:**
   - Error logy
   - Browser console výstup
   - Network tab data
   - PHP verze a konfigurace

2. **Popište problém:**
   - Co se snažíte udělat
   - Co se děje místo toho
   - Kdy problém začal

3. **Kontaktujte podporu:**
   - Email: podpora@systrix.cz
   - Telefon: +420 123 456 789
   - Ticket systém: https://podpora.systrix.cz

**Affiliate systém by měl nyní fungovat bez problémů!** 🎉
