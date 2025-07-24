# 🚀 HostBill Affiliate System - Kompletní Balíček

## 📋 **Přehled**

Kompletní affiliate systém pro HostBill s pokročilým trackingem, provizním systémem a detailními statistikami. Tento balíček obsahuje vše potřebné pro implementaci profesionálního affiliate programu.

### **✨ Hlavní funkce:**
- 🎯 **Pokročilý tracking** - Návštěvy, konverze, page views
- 💰 **Flexibilní provizní systém** - Podle produktů, tier systém
- 📊 **Detailní statistiky** - Real-time reporty a analytics
- 🔒 **Fraud protection** - Ochrana proti podvodům
- 📧 **Email notifikace** - Automatické upozornění
- 🌐 **API integrace** - RESTful API pro externí systémy
- 📱 **Responsive design** - Funguje na všech zařízeních

---

## 📦 **Obsah balíčku**

```
hostbill-affiliate-package/
├── 📁 includes/affiliate/          # PHP skripty pro HostBill
│   ├── tracking.js                 # Client-side tracking
│   ├── api.php                     # API endpoint
│   └── conversion.php              # Conversion tracking
├── 📁 sql/                         # Databázové skripty
│   ├── 01_create_tables.sql        # Vytvoření tabulek
│   └── 02_sample_data.sql          # Ukázková data
├── 📁 config/                      # Konfigurační soubory
│   └── affiliate_config.php        # Hlavní konfigurace
├── 📁 docs/                        # Dokumentace
│   ├── API_DOCUMENTATION.md        # API dokumentace
│   ├── TROUBLESHOOTING.md          # Řešení problémů
│   └── FEATURES.md                 # Detailní popis funkcí
├── 📄 install.sh                   # Automatický instalační skript
├── 📄 INSTALLATION_GUIDE.md        # Detailní návod
└── 📄 README.md                    # Tento soubor
```

---

## ⚡ **Rychlá instalace**

### **Metoda 1: Automatická instalace (doporučeno)**

```bash
# 1. Stáhněte balíček
wget https://github.com/systrix/hostbill-affiliate/archive/main.zip
unzip main.zip
cd hostbill-affiliate-package/

# 2. Spusťte instalační skript
chmod +x install.sh
sudo ./install.sh

# 3. Postupujte podle instrukcí
```

### **Metoda 2: Manuální instalace**

1. **Nahrajte PHP skripty:**
   ```bash
   cp -r includes/affiliate/ /path/to/hostbill/includes/
   chmod 644 /path/to/hostbill/includes/affiliate/*.php
   ```

2. **Vytvořte databázové tabulky:**
   ```sql
   mysql -u user -p database < sql/01_create_tables.sql
   ```

3. **Aktivujte v HostBill Admin:**
   ```
   Admin Panel → Addons → Affiliate System → Enable
   ```

---

## 🔧 **Systémové požadavky**

### **Server:**
- ✅ **PHP 7.4+** (doporučeno 8.0+)
- ✅ **MySQL 5.7+** nebo **MariaDB 10.2+**
- ✅ **Apache/Nginx** web server
- ✅ **HostBill 5.0+**

### **PHP rozšíření:**
- ✅ `pdo` a `pdo_mysql`
- ✅ `json`
- ✅ `curl`
- ✅ `mbstring`

### **Oprávnění:**
- ✅ Zápis do `/includes/affiliate/`
- ✅ Přístup k HostBill databázi
- ✅ Možnost spouštět SQL dotazy

---

## 🎯 **Konfigurace**

### **1. HostBill nastavení**

```php
// V HostBill Admin → Settings → Affiliate
$affiliate_settings = [
    'enabled' => true,
    'cookie_duration' => 30,        // dny
    'tracking_parameter' => 'aff',
    'minimum_payout' => 500,        // CZK
    'default_commission' => 10      // %
];
```

### **2. Next.js integrace**

```env
# .env.local
NEXT_PUBLIC_HOSTBILL_URL=https://your-hostbill-domain.com
NEXT_PUBLIC_HOSTBILL_AFFILIATE_PARAM=aff
NEXT_PUBLIC_HOSTBILL_COOKIE_NAME=hb_affiliate
NEXT_PUBLIC_HOSTBILL_COOKIE_DURATION=30
```

### **3. Provizní sazby**

```sql
-- Nastavení provizí podle produktů
INSERT INTO tblaffiliateproductcommissions VALUES
(1, 'VPS Start', 10.00),
(1, 'VPS Profi', 12.00),
(1, 'VPS Expert', 15.00),
(1, 'VPS Ultra', 18.00);
```

---

## 📊 **Použití**

### **1. Základní tracking**

```javascript
// Automatické tracking při načtení stránky
// URL: https://example.com/vps?aff=123

// Manuální tracking
window.HostBillTracking.trackPageView('/custom-page');
```

### **2. Conversion tracking**

```javascript
// Při dokončení objednávky
window.HostBillTracking.trackConversion({
    orderId: 'ORDER-12345',
    amount: 249.00,
    currency: 'CZK',
    products: ['VPS Start']
});
```

### **3. API volání**

```bash
# Test API
curl -X POST https://your-domain.com/includes/affiliate/api.php \
  -H "Content-Type: application/json" \
  -d '{
    "action": "track_visit",
    "data": {
      "affiliate_id": 123,
      "page": "/vps"
    }
  }'
```

---

## 📈 **Statistiky a reporty**

### **1. Základní statistiky**

```sql
-- Přehled affiliate výkonu
SELECT 
    a.firstname, a.lastname,
    COUNT(v.id) as visits,
    COUNT(c.id) as conversions,
    SUM(c.commission_amount) as earnings
FROM tblaffiliates a
LEFT JOIN tblaffiliatevisits v ON a.id = v.affiliate_id
LEFT JOIN tblaffiliateconversions c ON a.id = c.affiliate_id
WHERE a.status = 'active'
GROUP BY a.id;
```

### **2. Denní statistiky**

```sql
-- Výkon za posledních 30 dní
SELECT 
    date,
    SUM(visits) as total_visits,
    SUM(conversions) as total_conversions,
    SUM(earnings) as total_earnings
FROM tblaffiliatestats 
WHERE date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY date
ORDER BY date DESC;
```

---

## 🔒 **Bezpečnost**

### **1. Fraud protection**

```php
// Automatická detekce podvodů
$fraud_checks = [
    'max_clicks_per_ip' => 10,
    'max_conversions_per_ip' => 3,
    'suspicious_patterns' => true,
    'ip_blacklist' => ['1.2.3.4', '5.6.7.8']
];
```

### **2. Rate limiting**

```php
// API rate limiting
$rate_limits = [
    'requests_per_hour' => 1000,
    'requests_per_minute' => 60,
    'burst_limit' => 10
];
```

---

## 🐛 **Troubleshooting**

### **Nejčastější problémy:**

#### **1. API vrací 500 chybu**
```bash
# Zkontrolujte error log
tail -f /var/log/apache2/error.log

# Zkontrolujte databázové připojení
php -r "
require 'configuration.php';
try {
    new PDO(\"mysql:host=\$db_host;dbname=\$db_name\", \$db_username, \$db_password);
    echo 'DB OK';
} catch(Exception \$e) {
    echo 'DB Error: ' . \$e->getMessage();
}
"
```

#### **2. Tracking nefunguje**
```javascript
// Debug v browser console
console.log(window.HostBillTracking);
console.log(document.cookie);

// Test manuálního trackingu
window.HostBillTracking.trackPageView('/test');
```

#### **3. Chybějící tabulky**
```sql
-- Zkontrolujte existence tabulek
SHOW TABLES LIKE 'tblaffiliate%';

-- Znovu vytvořte tabulky
SOURCE sql/01_create_tables.sql;
```

---

## 📚 **Dokumentace**

### **Detailní návody:**
- 📖 [**Instalační návod**](INSTALLATION_GUIDE.md) - Krok za krokem
- 🔧 [**Troubleshooting**](docs/TROUBLESHOOTING.md) - Řešení problémů
- 🌐 [**API dokumentace**](docs/API_DOCUMENTATION.md) - REST API
- ⚙️ [**Konfigurace**](config/affiliate_config.php) - Všechna nastavení

### **Video návody:**
- 🎥 [Základní instalace](https://youtube.com/watch?v=example1)
- 🎥 [Konfigurace provizí](https://youtube.com/watch?v=example2)
- 🎥 [Troubleshooting](https://youtube.com/watch?v=example3)

---

## 🚀 **Pokročilé funkce**

### **1. Tier systém**
```php
$tiers = [
    'Bronze' => ['min' => 0, 'max' => 5000, 'rate' => 8],
    'Silver' => ['min' => 5001, 'max' => 15000, 'rate' => 10],
    'Gold' => ['min' => 15001, 'max' => 50000, 'rate' => 12],
    'Platinum' => ['min' => 50001, 'max' => null, 'rate' => 15]
];
```

### **2. Webhook integrace**
```php
// Automatické notifikace
$webhooks = [
    'new_conversion' => 'https://example.com/webhook/conversion',
    'payout_completed' => 'https://example.com/webhook/payout'
];
```

### **3. Custom tracking**
```javascript
// Pokročilé tracking události
window.HostBillTracking.trackEvent('button_click', {
    button: 'pricing_cta',
    page: '/pricing',
    value: 249
});
```

---

## 📞 **Podpora**

### **Kontaktní informace:**
- 📧 **Email:** podpora@systrix.cz
- 📱 **Telefon:** +420 123 456 789
- 💬 **Live Chat:** https://systrix.cz/chat
- 🎫 **Ticket systém:** https://podpora.systrix.cz

### **Pracovní doba:**
- **Po-Pá:** 9:00 - 17:00 CET
- **Víkendy:** Pouze urgentní případy
- **Svátky:** Omezená podpora

### **SLA:**
- ⚡ **Kritické problémy:** 2 hodiny
- 🔧 **Standardní problémy:** 24 hodin
- 💡 **Dotazy:** 48 hodin

---

## 📄 **Licence**

```
MIT License

Copyright (c) 2024 Systrix

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 🎉 **Závěr**

**Affiliate systém je nyní připraven k použití!**

Tento balíček poskytuje kompletní řešení pro affiliate marketing s HostBill. Obsahuje vše potřebné pro profesionální provoz affiliate programu včetně pokročilých funkcí jako fraud protection, tier systém a detailní analytics.

**Začněte ještě dnes a zvyšte své tržby pomocí affiliate partnerů!** 🚀

---

*Vytvořeno s ❤️ týmem Systrix*
