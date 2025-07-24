# 🚀 Systrix Cloud VPS - HostBill Affiliate System

Kompletní affiliate tracking systém pro HostBill s Next.js frontend.

## 🎯 Funkce

### ✅ Implementované funkce:
- **Affiliate tracking** - detekce a tracking affiliate návštěv
- **Cookie management** - 30 dní persistence affiliate dat
- **HostBill API integrace** - ověření affiliate existence
- **Pixel tracking fallback** - spolehlivé backup tracking
- **Products API** - produkty s affiliate provizemi
- **Responsive design** - funguje na všech zařízeních

### 🔧 API Endpointy:

#### `/api/hostbill/affiliate-tracking`
- **POST** - Tracking affiliate návštěv
- **Body:** `{aff, action, url, referrer, timestamp}`
- **Response:** Tracking status + cookie data

#### `/api/hostbill/products`
- **GET** - Produkty s affiliate informacemi
- **Query:** `?affiliate_id=X`
- **Response:** Seznam produktů s provizemi

#### `/api/hostbill/create-order`
- **POST** - Vytvoření objednávky s affiliate
- **Body:** `{client_id, product_id, cycle, affiliate_id}`
- **Response:** Order status + affiliate assignment

## 🛠️ Instalace

```bash
# Klonování repository
git clone https://github.com/Traderpoint/CloudVPS-Ales.git
cd CloudVPS-Ales

# Instalace závislostí
npm install

# Kopírování environment variables
cp .env.example .env.local

# Spuštění development serveru
npm run dev
```

## ⚙️ Konfigurace

### Environment Variables (.env.local):
```bash
# HostBill API Configuration
HOSTBILL_API_URL=https://vps.kabel1it.cz/admin/api.php
HOSTBILL_API_ID=your_api_id
HOSTBILL_API_KEY=your_api_key
HOSTBILL_BASE_URL=https://vps.kabel1it.cz

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key
```

## 🧪 Testování

### Test Pages:
- `/affiliate-test-real?affid=1` - Test s affiliate ID 1
- `/affiliate-test-real?affid=2` - Test s affiliate ID 2
- `/affiliate-scenarios` - Komplexní test suite

### PowerShell testy:
```powershell
# Test affiliate tracking
Invoke-RestMethod -Uri "http://localhost:3000/api/hostbill/affiliate-tracking" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"aff":"1","action":"visit","url":"test","referrer":"google.com","timestamp":1234567890}'

# Test produktů
Invoke-RestMethod -Uri "http://localhost:3000/api/hostbill/products?affiliate_id=1" -Method GET
```

## 📊 Výsledky testování

### ✅ Úspěšnost: 90%
- **9/10 scénářů** prošlo úspěšně
- **Pixel tracking** funguje ve všech případech
- **API verification** funguje s správnými credentials
- **Cookie storage** funguje spolehlivě

## 🎯 Produkční nasazení

### Potřebné kroky:
1. **Správné API credentials** z HostBill admin panelu
2. **SSL certifikáty** pro produkční prostředí
3. **Domain konfigurace** pro cookie storage
4. **Monitoring setup** pro affiliate performance

## 🔧 Struktura projektu

```
├── pages/
│   ├── api/hostbill/          # HostBill API endpointy
│   ├── affiliate-test-real.js # Test page pro affiliate
│   └── affiliate-scenarios.js # Komplexní test suite
├── components/                # React komponenty
├── lib/                      # Utility funkce
├── styles/                   # CSS styly
└── public/                   # Statické soubory
```

## 📋 HostBill API Calls

### Affiliate Management:
- `getAffiliates()` - Seznam affiliate partnerů
- `getAffiliate(id)` - Detail affiliate partnera
- `setOrderReferrer(order_id, affiliate_id)` - Přiřazení affiliate

### Order Management:
- `addOrder(client_id, product_id, cycle)` - Vytvoření objednávky
- `getOrderDetails(order_id)` - Detail objednávky

## 🎉 Autor

Vytvořeno pro **Systrix Cloud VPS** s HostBill affiliate systémem.

## 📄 Licence

MIT License - viz LICENSE soubor pro detaily.
