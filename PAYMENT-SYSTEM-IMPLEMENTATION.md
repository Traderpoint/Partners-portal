# 💳 Payment System Implementation Guide

## 🎯 Přehled systému

Kompletní platební systém integrovaný s HostBill API pro zpracování plateb objednávek CloudVPS.

---

## 🏗️ Architektura

### **📊 Komponenty systému:**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CloudVPS      │    │   Middleware     │    │    HostBill     │
│   Frontend      │◄──►│   Server         │◄──►│    API          │
│                 │    │                  │    │                 │
│ • Payment UI    │    │ • PaymentProcessor│   │ • Invoices      │
│ • Order Form    │    │ • Gateway Mapping│   │ • Gateways      │
│ • Status Check  │    │ • Webhook Handler│   │ • Transactions  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Payment         │
                    │  Gateways        │
                    │                  │
                    │ • Card Processor │
                    │ • PayPal         │
                    │ • Bank Transfer  │
                    │ • Crypto         │
                    └──────────────────┘
```

---

## 🔧 Implementované komponenty

### **📋 1. Backend (Middleware)**

#### **A) PaymentProcessor (`lib/payment-processor.js`)**
- ✅ **Gateway mapping** - CloudVPS → HostBill
- ✅ **Payment initialization** - URL generation, instructions
- ✅ **Webhook handling** - Callback processing
- ✅ **Status tracking** - Real-time payment status

#### **B) HostBillClient rozšíření**
- ✅ **getPaymentGateways()** - Dostupné platební brány
- ✅ **processPayment()** - Zpracování platby
- ✅ **chargeCreditCard()** - Nabití karty
- ✅ **getInvoicePaymentUrl()** - URL pro platbu

#### **C) API Endpoints**
- ✅ **GET /api/payments/methods** - Dostupné platební metody
- ✅ **POST /api/payments/initialize** - Inicializace platby
- ✅ **POST /api/payments/callback** - Webhook callbacks
- ✅ **GET /api/payments/status** - Status platby

### **📋 2. Frontend**

#### **A) PaymentProcessor Component**
- ✅ **Method selection** - Výběr platební metody
- ✅ **Payment initialization** - Spuštění platby
- ✅ **Redirect handling** - Přesměrování na bránu
- ✅ **Manual instructions** - Instrukce pro bankovní převod

#### **B) Test Interface**
- ✅ **Payment test page** - `/payment-test`
- ✅ **Configuration UI** - Nastavení test dat
- ✅ **Result display** - Zobrazení výsledků

---

## 🚀 Použití

### **📋 1. Základní integrace**

```javascript
import PaymentProcessor from '../components/PaymentProcessor';

function CheckoutPage() {
  return (
    <PaymentProcessor
      orderId="ORDER-123"
      invoiceId="INV-456"
      amount={299}
      currency="CZK"
      onSuccess={(data) => console.log('Payment success:', data)}
      onError={(error) => console.error('Payment error:', error)}
      onCancel={() => console.log('Payment cancelled')}
    />
  );
}
```

### **📋 2. API volání**

```javascript
// Získání dostupných platebních metod
const response = await fetch('/api/payments/methods');
const { methods } = await response.json();

// Inicializace platby
const paymentResponse = await fetch('/api/payments/initialize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderId: 'ORDER-123',
    invoiceId: 'INV-456',
    method: 'card',
    amount: 299,
    currency: 'CZK'
  })
});

const paymentData = await paymentResponse.json();
if (paymentData.redirectRequired) {
  window.location.href = paymentData.paymentUrl;
}
```

---

## ⚙️ Konfigurace

### **📋 Environment Variables**

```bash
# Payment Gateway IDs v HostBill
HOSTBILL_GATEWAY_CARD=1
HOSTBILL_GATEWAY_PAYPAL=2
HOSTBILL_GATEWAY_BANK=3
HOSTBILL_GATEWAY_CRYPTO=4

# HostBill Client Area URL
HOSTBILL_CLIENT_URL=https://your-hostbill.com

# Bank Transfer Details
BANK_ACCOUNT_NUMBER=123456789/0100
BANK_NAME=Komerční banka
BANK_IBAN=CZ65 0100 0000 0012 3456 7890
BANK_SWIFT=KOMBCZPP
```

### **📋 HostBill Gateway Setup**

1. **Přihlaste se do HostBill Admin**
2. **Jděte na Settings → Payment Gateways**
3. **Nakonfigurujte brány:**
   - Credit Card Gateway (ID: 1)
   - PayPal (ID: 2)
   - Bank Transfer (ID: 3)
   - Cryptocurrency (ID: 4)
4. **Nastavte callback URLs:**
   - Success: `https://your-domain.com/api/payments/callback`
   - Failure: `https://your-domain.com/api/payments/callback`
   - Notify: `https://your-domain.com/api/payments/callback`

---

## 🔄 Payment Flow

### **📊 1. Redirect Payment (Card, PayPal, Crypto)**

```
1. User selects payment method
2. Frontend calls /api/payments/initialize
3. Middleware generates HostBill payment URL
4. User is redirected to payment gateway
5. Gateway processes payment
6. Gateway sends callback to /api/payments/callback
7. Middleware updates payment status in HostBill
8. User is redirected back to success/failure page
```

### **📊 2. Manual Payment (Bank Transfer)**

```
1. User selects bank transfer
2. Frontend calls /api/payments/initialize
3. Middleware returns payment instructions
4. User sees bank details and instructions
5. User performs manual bank transfer
6. Admin manually confirms payment in HostBill
7. Order is activated
```

---

## 🛡️ Bezpečnost

### **📋 Implementované opatření:**

- ✅ **Rate limiting** - Ochrana proti spam
- ✅ **Input validation** - Validace všech vstupů
- ✅ **CORS protection** - Omezené origins
- ✅ **Helmet security** - HTTP security headers
- ✅ **Error handling** - Bezpečné error messages
- ✅ **Logging** - Kompletní audit trail

### **📋 Doporučení:**

- 🔒 **HTTPS only** - Vždy používejte HTTPS
- 🔑 **Strong API keys** - Silné HostBill API klíče
- 🛡️ **Webhook validation** - Ověřování webhook podpisů
- 📊 **Monitoring** - Sledování podezřelých aktivit

---

## 🧪 Testování

### **📋 1. Spuštění test serveru**

```bash
# Spustit CloudVPS aplikaci
npm run dev

# Spustit middleware (v jiném terminálu)
cd hostbill-order-middleware
npm start
```

### **📋 2. Test platebního systému**

1. **Otevřete:** `http://localhost:3000/payment-test`
2. **Nakonfigurujte test data**
3. **Vyberte platební metodu**
4. **Spusťte test platby**
5. **Ověřte výsledky**

### **📋 3. API testování**

```bash
# Test dostupných metod
curl http://localhost:3005/api/payments/methods

# Test inicializace platby
curl -X POST http://localhost:3005/api/payments/initialize \
  -H "Content-Type: application/json" \
  -d '{"orderId":"TEST-123","invoiceId":"456","method":"card","amount":299}'
```

---

## 📊 Monitoring & Debugging

### **📋 Logy**

```bash
# Middleware logy
tail -f hostbill-order-middleware/logs/middleware.log

# Aplikační logy
# Zkontrolujte browser console pro frontend logy
```

### **📋 Health Check**

```bash
# Middleware health
curl http://localhost:3005/health

# Payment methods check
curl http://localhost:3005/api/payments/methods
```

---

## 🔧 Rozšíření

### **📋 Přidání nové platební brány**

1. **Přidejte do PaymentProcessor:**
```javascript
this.supportedGateways.set('newgateway', {
  id: process.env.HOSTBILL_GATEWAY_NEW || '5',
  name: 'New Gateway',
  type: 'redirect',
  requiresRedirect: true
});
```

2. **Aktualizujte frontend ikony a popisy**
3. **Nakonfigurujte v HostBill**
4. **Přidejte environment variable**

### **📋 Custom webhook handling**

```javascript
// V payment-processor.js
async handleCustomCallback(callbackData) {
  // Custom logic pro specifickou bránu
  if (callbackData.gateway === 'custom') {
    // Zpracování custom callback formátu
  }
}
```

---

## 🎯 Výsledek

**✅ Kompletní platební systém připravený k produkci!**

- **🔄 Multiple payment gateways** - Karta, PayPal, převod, crypto
- **🛡️ Security first** - Bezpečné zpracování plateb
- **📊 Real-time status** - Okamžité aktualizace stavu
- **🧪 Fully tested** - Kompletní testovací rozhraní
- **📖 Well documented** - Detailní dokumentace

**Systém je připraven k nasazení a integraci s produkčním HostBill!** 🚀
