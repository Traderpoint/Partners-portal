# HostBill Order Processing Middleware

Bezpečný middleware pro zpracování objednávek mezi Cloud VPS a HostBill API.

## 🎯 Účel

Tento middleware zajišťuje:
1. **Bezpečné zpracování dat** mezi Cloud VPS a HostBill API
2. **Vytvoření klienta** v HostBill na základě objednávky
3. **Vytvoření objednávky** v HostBill s produkty
4. **Affiliate assignment** - přiřazení klienta k affiliate partnerovi
5. **Potvrzovací stránku** po úspěšném zpracování

## 🚀 Spuštění

### Instalace závislostí
```bash
cd hostbill-order-middleware
npm install
```

### Konfigurace
```bash
# Zkopírujte .env.example do .env a upravte hodnoty
cp .env.example .env
```

### Spuštění serveru
```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server běží na **portu 3005**: http://localhost:3005

## 📡 API Endpointy

### Health Check
```
GET /health
```
Kontrola stavu serveru.

### Test HostBill připojení
```
GET /api/test-connection
```
Test připojení k HostBill API.

### Zpracování objednávky
```
POST /api/process-order
```

**Request Body:**
```json
{
  "customer": {
    "firstName": "Jan",
    "lastName": "Novák",
    "email": "jan.novak@example.com",
    "phone": "+420123456789",
    "address": "Testovací ulice 123",
    "city": "Praha",
    "postalCode": "11000",
    "country": "CZ",
    "company": "Test s.r.o."
  },
  "items": [
    {
      "productId": "5",
      "name": "VPS Start",
      "price": 249,
      "cycle": "m",
      "configOptions": {
        "ram": "4GB",
        "cpu": "2",
        "storage": "50GB"
      }
    }
  ],
  "affiliate": {
    "id": "1",
    "code": "test-affiliate"
  },
  "paymentMethod": "banktransfer",
  "newsletterSubscribe": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order processed successfully",
  "data": {
    "processingId": "uuid-here",
    "client": {
      "id": "123",
      "email": "jan.novak@example.com",
      "firstName": "Jan",
      "lastName": "Novák"
    },
    "affiliate": {
      "id": "1",
      "name": "Test Partner",
      "status": "Active"
    },
    "orders": [
      {
        "orderId": "456",
        "invoiceId": "789",
        "productName": "VPS Start",
        "status": "pending"
      }
    ],
    "errors": []
  }
}
```

### Potvrzovací stránka
```
GET /confirmation/:orderId
```
Zobrazí HTML stránku s potvrzením objednávky.

## 🧪 Testování

### Spuštění testů
```bash
npm test
```

### Manuální testování
```bash
# Test health check
curl http://localhost:3005/health

# Test HostBill připojení
curl http://localhost:3005/api/test-connection

# Test zpracování objednávky
curl -X POST http://localhost:3005/api/process-order \
  -H "Content-Type: application/json" \
  -d @test-order.json
```

## 🔒 Bezpečnost

### Implementované bezpečnostní opatření:
- **Helmet.js** - HTTP security headers
- **CORS** - Cross-origin resource sharing
- **Rate limiting** - Ochrana proti DDoS
- **Input validation** - Validace všech vstupů
- **Error handling** - Bezpečné zpracování chyb
- **Logging** - Kompletní auditní trail

### Konfigurace bezpečnosti:
```env
API_SECRET_KEY=your_secret_key_here
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📊 Monitoring a Logging

### Log soubory:
- `logs/middleware.log` - Všechny logy
- `logs/error.log` - Pouze chyby
- `logs/exceptions.log` - Neošetřené výjimky
- `logs/rejections.log` - Neošetřené promise rejections

### Log úrovně:
- `error` - Chyby
- `warn` - Varování
- `info` - Informace
- `debug` - Debug informace

## 🔧 Konfigurace

### Environment Variables:
```env
# Server
PORT=3005
NODE_ENV=development

# HostBill API
HOSTBILL_API_URL=https://vps.kabel1it.cz/admin/api.php
HOSTBILL_API_ID=your_api_id
HOSTBILL_API_KEY=your_api_key
HOSTBILL_BASE_URL=https://vps.kabel1it.cz

# Security
API_SECRET_KEY=your_secret_key
ALLOWED_ORIGINS=http://localhost:3000

# Logging
LOG_LEVEL=info
LOG_FILE=logs/middleware.log

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🏗️ Architektura

```
hostbill-order-middleware/
├── server.js              # Hlavní Express server
├── lib/
│   ├── hostbill-client.js # HostBill API klient
│   └── order-processor.js # Zpracování objednávek
├── utils/
│   └── logger.js          # Logging konfigurace
├── test/
│   └── test-endpoints.js  # Testovací suite
├── logs/                  # Log soubory
├── .env                   # Konfigurace
└── package.json
```

## 🔄 Workflow zpracování objednávky

1. **Příjem objednávky** z Cloud VPS
2. **Validace dat** - kontrola povinných polí
3. **Validace affiliate** (pokud je přítomen)
4. **Vytvoření klienta** v HostBill
5. **Přiřazení k affiliate** (pokud je validní)
6. **Vytvoření objednávek** pro každý produkt
7. **Vrácení výsledku** s detaily
8. **Generování potvrzovací stránky**

## 📞 Podpora

Pro technickou podporu kontaktujte:
- **Email:** podpora@systrix.cz
- **Telefon:** +420 123 456 789

## 📄 Licence

MIT License - viz LICENSE soubor.
