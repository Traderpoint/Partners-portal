# Systrix Cloud VPS - Order Flow s Nákupním Košíkem a HostBill Affiliate Integrací

Tato dokumentace popisuje implementaci kompletního order flow s nákupním košíkem a propojením s HostBill affiliate systémem pro Systrix Cloud VPS platformu.

## 🚀 Nové Funkce

### 1. Nákupní Košík
- **Shopping Cart komponenta** (`components/ShoppingCart.js`)
- **Cart Context** pro globální state management (`contexts/CartContext.js`)
- **Cart Icon** v navigaci s počítadlem položek
- Přidávání/odebírání produktů
- Výpočet celkové ceny
- Perzistence v localStorage

### 2. Rozšířená PricingTable
- Tlačítka "Přidat do košíku" místo přímých odkazů na HostBill
- Integrace s Cart Context
- Zachování všech produktových informací

### 3. Checkout Proces
- **Checkout stránka** (`pages/checkout.js`)
- Formulář pro zákaznické údaje
- Výběr platební metody
- Souhrn objednávky
- Validace formuláře

### 4. HostBill API Integrace
- **API endpoint** pro vytváření objednávek (`pages/api/create-order.js`)
- Automatické vytváření zákazníků v HostBill
- Propojení objednávek s HostBill produkty
- Affiliate tracking integrace

### 5. Affiliate Systém
- **Affiliate utility** (`utils/affiliate.js`)
- Automatické zachycení affiliate parametrů z URL
- Perzistence affiliate dat (30 dní)
- Tracking konverzí
- Validace affiliate ID/kódů
- Generování referral linků

### 6. Order Confirmation
- **Potvrzovací stránka** (`pages/order-confirmation.js`)
- Zobrazení detailů objednávky
- Další kroky pro zákazníka
- Kontaktní informace

## 📁 Struktura Souborů

```
├── components/
│   ├── ShoppingCart.js          # Košík komponenta + Cart Icon
│   ├── PricingTable.js          # Rozšířená ceníková tabulka
│   └── Navbar.js                # Navigace s košíkem
├── contexts/
│   └── CartContext.js           # Globální state management
├── pages/
│   ├── checkout.js              # Checkout proces
│   ├── order-confirmation.js    # Potvrzení objednávky
│   └── api/
│       ├── create-order.js      # HostBill API integrace
│       ├── validate-affiliate.js # Validace affiliate
│       └── track-conversion.js  # Tracking konverzí
├── utils/
│   └── affiliate.js             # Affiliate utility funkce
└── .env.example                 # Konfigurace prostředí
```

## ⚙️ Konfigurace

### 1. Environment Variables

Zkopírujte `.env.example` do `.env.local` a nastavte:

```bash
# HostBill API
HOSTBILL_URL=https://vas-hostbill.cz
HOSTBILL_API_ID=your_api_id
HOSTBILL_API_KEY=your_api_key

# Volitelné
NEXT_PUBLIC_GA_ID=GA_MEASUREMENT_ID
NEXT_PUBLIC_FB_PIXEL_ID=facebook_pixel_id
```

### 2. HostBill Nastavení

V HostBill admin panelu:
1. Povolte API přístup
2. Vytvořte API klíče
3. Nastavte affiliate systém
4. Nakonfigurujte produkty s správnými PID

## 🔄 Workflow

### 1. Přidání do Košíku
```javascript
// PricingTable.js
const { addItem } = useCart();

const handleAddToCart = (plan) => {
  addItem({
    id: plan.id,
    name: plan.name,
    // ... další data
  });
};
```

### 2. Affiliate Tracking
```javascript
// Automatické zachycení z URL
// ?aff=123&aff_code=PARTNER2024

// Uložení do localStorage (30 dní)
storeAffiliateData(affiliateParams);

// Použití při objednávce
const orderData = {
  // ...
  affiliate: {
    id: affiliateId,
    code: affiliateCode
  }
};
```

### 3. Checkout Process
```javascript
// checkout.js
const response = await fetch('/api/create-order', {
  method: 'POST',
  body: JSON.stringify(orderData)
});
```

### 4. HostBill Integrace
```javascript
// api/create-order.js
// 1. Vytvoření/nalezení zákazníka
const customerResponse = await fetch(`${HOSTBILL_URL}/api/`, {
  method: 'POST',
  body: new URLSearchParams({
    call: 'client_add',
    // ... zákaznická data
  })
});

// 2. Vytvoření objednávky
const orderResponse = await fetch(`${HOSTBILL_URL}/api/`, {
  method: 'POST',
  body: new URLSearchParams({
    call: 'order_add',
    // ... objednávková data
  })
});

// 3. Affiliate tracking
if (affiliate.id) {
  await fetch(`${HOSTBILL_URL}/api/`, {
    method: 'POST',
    body: new URLSearchParams({
      call: 'affiliate_add_referral',
      // ... affiliate data
    })
  });
}
```

## 🎯 Affiliate Funkce

### URL Parametry
- `?aff=123` - Affiliate ID
- `?aff_code=PARTNER2024` - Affiliate kód
- `?campaign=summer2024` - Kampaň
- `?source=facebook` - Zdroj
- `?medium=social` - Médium

### Generování Referral Linků
```javascript
import { generateAffiliateLink } from '../utils/affiliate';

const referralLink = generateAffiliateLink(
  product,
  'affiliate_id',
  'affiliate_code',
  'https://mojecloud.cz'
);
```

### Tracking Konverzí
```javascript
import { trackAffiliateConversion } from '../utils/affiliate';

await trackAffiliateConversion(
  orderId,
  affiliateData,
  orderValue
);
```

## 🧪 Testování

### 1. Testování Košíku
1. Přidejte produkty do košíku
2. Ověřte počítadlo v navigaci
3. Otevřete košík a upravte množství
4. Zkontrolujte perzistenci po obnovení stránky

### 2. Testování Affiliate
1. Navštivte stránku s `?aff=123`
2. Přidejte produkty do košíku
3. Dokončete objednávku
4. Ověřte affiliate tracking v HostBill

### 3. Testování Checkout
1. Vyplňte formulář
2. Zkontrolujte validaci
3. Odešlete objednávku
4. Ověřte vytvoření v HostBill

## 🔧 Rozšíření

### Přidání Nového Produktu
1. Upravte `plans` array v `PricingTable.js`
2. Přidejte produkt do HostBill
3. Nastavte správné `hostbillPid`

### Vlastní Affiliate Tracking
1. Rozšiřte `utils/affiliate.js`
2. Přidejte vlastní tracking služby
3. Implementujte dashboard pro affiliates

### Platební Brány
1. Rozšiřte checkout formulář
2. Přidejte podporu pro více platebních metod
3. Integrujte s HostBill payment gateways

## 🐛 Troubleshooting

### Košík se nevymaže
- Zkontrolujte localStorage
- Ověřte CartContext provider

### Affiliate tracking nefunguje
- Zkontrolujte URL parametry
- Ověřte HostBill API klíče
- Zkontrolujte affiliate nastavení v HostBill

### API chyby
- Zkontrolujte environment variables
- Ověřte HostBill API přístup
- Zkontrolujte network tab v dev tools

## 📞 Podpora

Pro technickou podporu kontaktujte:
- Email: podpora@mojecloud.cz
- Telefon: +420 123 456 789
