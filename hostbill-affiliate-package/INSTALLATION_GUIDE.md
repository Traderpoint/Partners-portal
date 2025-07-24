# 🚀 HostBill Affiliate System - Instalační Návod

## 📋 **Přehled instalace**

Tento balíček obsahuje kompletní affiliate systém pro HostBill. Instalace trvá přibližně 15-30 minut.

### **Co budete potřebovat:**
- ✅ Přístup k HostBill Admin panelu
- ✅ FTP/SSH přístup k serveru
- ✅ Přístup k MySQL databázi
- ✅ Základní znalost PHP/MySQL

---

## 🗂️ **Struktura balíčku**

```
hostbill-affiliate-package/
├── includes/affiliate/
│   ├── tracking.js          # Client-side tracking script
│   ├── api.php             # API endpoint pro tracking
│   └── conversion.php      # Conversion tracking
├── sql/
│   ├── 01_create_tables.sql # Databázové tabulky
│   └── 02_sample_data.sql   # Ukázková data
├── config/
│   └── affiliate_config.php # Konfigurační soubor
├── docs/
│   ├── API_DOCUMENTATION.md # API dokumentace
│   └── TROUBLESHOOTING.md   # Řešení problémů
└── INSTALLATION_GUIDE.md    # Tento návod
```

---

## 🔧 **KROK 1: Příprava serveru**

### **1.1 Kontrola požadavků**

```bash
# Kontrola PHP verze (min. 7.4)
php -v

# Kontrola MySQL verze (min. 5.7)
mysql --version

# Kontrola dostupných PHP rozšíření
php -m | grep -E "(pdo|mysql|json|curl)"
```

### **1.2 Vytvoření adresářové struktury**

```bash
# Připojte se k serveru přes SSH
ssh username@your-hostbill-server.com

# Přejděte do HostBill root adresáře
cd /path/to/hostbill/

# Vytvořte adresář pro affiliate skripty
mkdir -p includes/affiliate
chmod 755 includes/affiliate
```

---

## 📁 **KROK 2: Nahrání souborů**

### **2.1 Nahrání PHP skriptů**

**Metoda A: Přes FTP (doporučeno pro začátečníky)**

1. Otevřete FTP klient (FileZilla, WinSCP)
2. Připojte se k serveru
3. Nahrajte soubory:
   ```
   LOCAL → REMOTE
   includes/affiliate/tracking.js → /path/to/hostbill/includes/affiliate/tracking.js
   includes/affiliate/api.php → /path/to/hostbill/includes/affiliate/api.php
   includes/affiliate/conversion.php → /path/to/hostbill/includes/affiliate/conversion.php
   ```

**Metoda B: Přes SSH**

```bash
# Nahrání souborů přes SCP
scp -r includes/affiliate/ username@server:/path/to/hostbill/includes/

# Nebo přes rsync
rsync -avz includes/affiliate/ username@server:/path/to/hostbill/includes/affiliate/
```

### **2.2 Nastavení oprávnění**

```bash
# Nastavte správná oprávnění
chmod 644 includes/affiliate/*.php
chmod 644 includes/affiliate/*.js
chmod 755 includes/affiliate/
```

---

## 🗄️ **KROK 3: Vytvoření databázových tabulek**

### **3.1 Přes HostBill Admin (doporučeno)**

1. **Přihlaste se do HostBill Admin:**
   ```
   https://your-hostbill-domain.com/admin/
   ```

2. **Navigujte do Database sekce:**
   ```
   Admin Panel → System → Database → SQL Query
   ```

3. **Spusťte SQL skript:**
   - Otevřete soubor `sql/01_create_tables.sql`
   - Zkopírujte celý obsah
   - Vložte do SQL Query pole
   - Klikněte "Execute Query"

### **3.2 Přes phpMyAdmin**

1. Otevřete phpMyAdmin
2. Vyberte HostBill databázi
3. Klikněte na "SQL" tab
4. Vložte obsah `sql/01_create_tables.sql`
5. Klikněte "Go"

### **3.3 Přes SSH/Terminal**

```bash
# Připojení k MySQL
mysql -u hostbill_user -p hostbill_database

# Spuštění SQL skriptu
source /path/to/sql/01_create_tables.sql

# Nebo přímo
mysql -u hostbill_user -p hostbill_database < sql/01_create_tables.sql
```

---

## ⚙️ **KROK 4: Konfigurace HostBill**

### **4.1 Aktivace Affiliate modulu**

1. **V HostBill Admin:**
   ```
   Admin Panel → Addons → Affiliate System
   ```

2. **Nastavení:**
   ```
   ✅ Enable Affiliate System
   ✅ Allow Affiliate Registration
   ✅ Require Admin Approval for New Affiliates
   ✅ Enable Affiliate Tracking Cookies
   
   Cookie Duration: 30 days
   Tracking Parameter: aff
   Minimum Payout: 500 CZK
   Default Commission Rate: 10%
   ```

### **4.2 Vytvoření testovacího affiliate**

```sql
-- Spusťte v SQL Query
INSERT INTO tblaffiliates 
(firstname, lastname, email, commission_rate, status, created_date) 
VALUES 
('Test', 'Partner', 'test@example.com', 10.00, 'active', NOW());
```

---

## 🔗 **KROK 5: Integrace s webem**

### **5.1 Aktualizace .env.local**

```env
# Aktualizujte tyto hodnoty
NEXT_PUBLIC_HOSTBILL_URL=https://your-hostbill-domain.com
NEXT_PUBLIC_HOSTBILL_AFFILIATE_PARAM=aff
NEXT_PUBLIC_HOSTBILL_COOKIE_NAME=hb_affiliate
NEXT_PUBLIC_HOSTBILL_COOKIE_DURATION=30
NEXT_PUBLIC_AFFILIATE_DEBUG=false
```

### **5.2 Restart Next.js aplikace**

```bash
# Zastavte development server (Ctrl+C)
# Spusťte znovu
npm run dev
```

---

## ✅ **KROK 6: Testování**

### **6.1 Test základního trackingu**

1. **Otevřete URL s affiliate parametrem:**
   ```
   http://localhost:3000/vps?aff=1
   ```

2. **Zkontrolujte cookie v Developer Tools:**
   ```
   Application → Cookies → hb_affiliate=1
   ```

3. **Zkontrolujte databázi:**
   ```sql
   SELECT * FROM tblaffiliatevisits ORDER BY id DESC LIMIT 5;
   ```

### **6.2 Test conversion trackingu**

1. **Přidejte produkt do košíku**
2. **Zkontrolujte Network tab** pro API požadavky
3. **Zkontrolujte databázi:**
   ```sql
   SELECT * FROM tblaffiliateconversions ORDER BY id DESC LIMIT 5;
   ```

### **6.3 Test API endpointů**

```bash
# Test API
curl -X POST https://your-hostbill-domain.com/includes/affiliate/api.php \
  -H "Content-Type: application/json" \
  -d '{"action":"track_visit","data":{"affiliate_id":1,"page":"/test"}}'

# Očekávaná odpověď
{"success":true}
```

---

## 🐛 **Řešení problémů**

### **Problém: API vrací 500 chybu**

**Řešení:**
1. Zkontrolujte error log serveru
2. Ověřte databázové připojení
3. Zkontrolujte oprávnění souborů

```bash
# Kontrola error logu
tail -f /var/log/apache2/error.log
# nebo
tail -f /var/log/nginx/error.log
```

### **Problém: Tracking nefunguje**

**Řešení:**
1. Otevřete Developer Tools → Console
2. Zkontrolujte JavaScript chyby
3. Ověřte, že tracking.js se načítá

```javascript
// V browser console
console.log(window.HostBillTracking);
console.log(window.hostbillAffiliate);
```

### **Problém: Databázové chyby**

**Řešení:**
1. Zkontrolujte, že všechny tabulky existují:
   ```sql
   SHOW TABLES LIKE 'tblaffiliate%';
   ```

2. Zkontrolujte oprávnění databázového uživatele:
   ```sql
   SHOW GRANTS FOR 'hostbill_user'@'localhost';
   ```

---

## 📊 **KROK 7: Monitoring a údržba**

### **7.1 Pravidelné kontroly**

```sql
-- Kontrola počtu návštěv za posledních 7 dní
SELECT DATE(visit_date) as date, COUNT(*) as visits 
FROM tblaffiliatevisits 
WHERE visit_date >= DATE_SUB(NOW(), INTERVAL 7 DAY) 
GROUP BY DATE(visit_date);

-- Kontrola konverzí
SELECT affiliate_id, COUNT(*) as conversions, SUM(commission_amount) as earnings
FROM tblaffiliateconversions 
WHERE conversion_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY affiliate_id;
```

### **7.2 Optimalizace výkonu**

```sql
-- Přidání indexů pro lepší výkon
ALTER TABLE tblaffiliatevisits ADD INDEX idx_date_affiliate (visit_date, affiliate_id);
ALTER TABLE tblaffiliateconversions ADD INDEX idx_status_date (status, conversion_date);
```

### **7.3 Zálohování**

```bash
# Záloha affiliate tabulek
mysqldump -u user -p database_name tblaffiliatevisits tblaffiliateconversions tblaffiliatestats > affiliate_backup.sql
```

---

## 🎯 **Dokončení instalace**

### **✅ Kontrolní seznam:**

- [ ] PHP skripty nahrány a fungují
- [ ] Databázové tabulky vytvořeny
- [ ] HostBill Affiliate modul aktivován
- [ ] Testovací affiliate vytvořen
- [ ] Tracking funguje na webu
- [ ] API endpointy odpovídají
- [ ] Conversion tracking funguje
- [ ] Error logy jsou čisté

### **🚀 Další kroky:**

1. **Vytvořte reálné affiliate partnery**
2. **Nastavte automatické výplaty**
3. **Nakonfigurujte email notifikace**
4. **Vytvořte affiliate dashboard**
5. **Nastavte monitoring a reporty**

---

## 📞 **Podpora**

Pokud narazíte na problémy:

1. **Zkontrolujte TROUBLESHOOTING.md**
2. **Prohlédněte si error logy**
3. **Otestujte jednotlivé komponenty**
4. **Kontaktujte podporu**

**Affiliate systém je nyní plně funkční!** 🎉
