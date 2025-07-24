# 🔧 HostBill Placeholder Update Guide

Tento guide vysvětluje, jak aktualizovat placeholder hodnoty reálnými HostBill product a addon ID.

## 📋 Soubory k aktualizaci

### 1. `.env.local` - Environment Variables
```bash
# AKTUALIZUJTE TYTO HODNOTY:

# HostBill Product IDs (PLACEHOLDERS - TO BE UPDATED WITH REAL IDs)
HOSTBILL_PRODUCT_VPS_BASIC=1          # ← Nahraďte reálným ID
HOSTBILL_PRODUCT_VPS_PRO=2            # ← Nahraďte reálným ID
HOSTBILL_PRODUCT_VPS_ENTERPRISE=3     # ← Nahraďte reálným ID
HOSTBILL_PRODUCT_VPS_PREMIUM=4        # ← Nahraďte reálným ID

# HostBill Addon IDs (PLACEHOLDERS - TO BE UPDATED WITH REAL IDs)
HOSTBILL_ADDON_CPANEL=5               # ← Nahraďte reálným ID
HOSTBILL_ADDON_SSL_CERT=6             # ← Nahraďte reálným ID
HOSTBILL_ADDON_BACKUP=7               # ← Nahraďte reálným ID
HOSTBILL_ADDON_MONITORING=8           # ← Nahraďte reálným ID
HOSTBILL_ADDON_FIREWALL=9             # ← Nahraďte reálným ID
HOSTBILL_ADDON_EXTRA_IP=10            # ← Nahraďte reálným ID

# Default Test Client ID (PLACEHOLDER - TO BE UPDATED)
HOSTBILL_TEST_CLIENT_ID=1             # ← Nahraďte reálným test client ID
```

### 2. `lib/hostbill-config.js` - Konfigurace
Tento soubor automaticky načítá hodnoty z `.env.local`, takže stačí aktualizovat pouze `.env.local`.

## 🎯 Jak získat reálné ID z HostBill

### Product IDs:
1. Přihlaste se do HostBill admin panelu
2. Jděte na **Products/Services → Products/Services**
3. Klikněte na produkt a v URL uvidíte ID: `...&id=123`
4. Poznamenejte si ID pro každý VPS produkt

### Addon IDs:
1. V HostBill admin jděte na **Products/Services → Product Addons**
2. Klikněte na addon a v URL uvidíte ID: `...&id=456`
3. Poznamenejte si ID pro každý addon

### Client ID pro testování:
1. Jděte na **Clients → View/Search Clients**
2. Vyberte test klienta a poznamenejte si jeho ID

## 🔧 Postup aktualizace

### Krok 1: Aktualizace .env.local
```bash
# Příklad s reálnými hodnotami:
HOSTBILL_PRODUCT_VPS_BASIC=15
HOSTBILL_PRODUCT_VPS_PRO=16
HOSTBILL_ADDON_CPANEL=23
HOSTBILL_ADDON_SSL_CERT=24
HOSTBILL_TEST_CLIENT_ID=5
```

### Krok 2: Restart serveru
```bash
# Zastavte development server (Ctrl+C)
npm run dev
```

### Krok 3: Test funkcionality
1. Otevřete `http://localhost:3000/affiliate-test-real?affid=1`
2. Vyzkoušejte produktový selektor
3. Otestujte vytvoření objednávky

## 🧪 Testovací endpointy

### Test s reálnými ID:
```bash
# PowerShell test
Invoke-RestMethod -Uri "http://localhost:3000/api/hostbill/create-order" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"client_id":"REAL_CLIENT_ID","product_id":"REAL_PRODUCT_ID","cycle":"m","affiliate_id":"1","selected_addons":[{"id":"REAL_ADDON_ID","quantity":1}]}'
```

## 📊 Ověření funkcionality

### ✅ Co by mělo fungovat po aktualizaci:
- ✅ Produktový selektor s reálnými produkty
- ✅ Addon výběr s reálnými doplňky
- ✅ Vytvoření objednávky v HostBill
- ✅ Automatické přiřazení affiliate
- ✅ Generování faktury

### ⚠️ Možné problémy:
- **Neplatné Product ID** - zkontrolujte ID v HostBill admin
- **Neplatné Addon ID** - ověřte dostupnost addonu pro produkt
- **Neplatné Client ID** - použijte existujícího klienta
- **API permissions** - ověřte oprávnění API klíče

## 🎯 Produkční nasazení

Po aktualizaci placeholder hodnot:

1. **Commit změny:**
```bash
git add .env.local
git commit -m "Update HostBill product and addon IDs with real values"
git push
```

2. **Deploy na produkci:**
```bash
# Aktualizujte environment variables na produkčním serveru
# Restartujte aplikaci
```

## 📞 Support

Pokud máte problémy s aktualizací:
1. Zkontrolujte HostBill admin panel pro správné ID
2. Ověřte API klíč permissions
3. Otestujte jednotlivé endpointy
4. Zkontrolujte logy serveru

---

**Poznámka:** Všechny onClick eventy jsou připravené a budou fungovat okamžitě po aktualizaci placeholder hodnot!
