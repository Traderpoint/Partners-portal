# Test Checklist - Order Flow

## ✅ Základní Funkce Košíku

### 1. Přidání produktu do košíku
- [ ] Klikněte na "Přidat do košíku" u libovolného VPS plánu
- [ ] Ověřte, že se zobrazí číslo v košíku ikonce (červený badge)
- [ ] Klikněte na košík ikonu v navigaci
- [ ] Ověřte, že se košík otevře s přidaným produktem

### 2. Správa košíku
- [ ] Změňte množství produktu pomocí +/- tlačítek
- [ ] Ověřte, že se přepočítá celková cena
- [ ] Přidejte další produkt do košíku
- [ ] Odstraňte produkt pomocí "Odstranit" tlačítka
- [ ] Vymažte celý košík pomocí "Vyprázdnit košík"

### 3. Perzistence košíku
- [ ] Přidejte produkty do košíku
- [ ] Obnovte stránku (F5)
- [ ] Ověřte, že produkty zůstaly v košíku

## ✅ Affiliate Tracking

### 1. URL parametry
- [ ] Navštivte: `http://localhost:3000?aff=123&aff_code=TEST2024`
- [ ] Přidejte produkt do košíku
- [ ] Otevřete košík a ověřte, že se zobrazuje "Affiliate tracking aktivní"
- [ ] Pokračujte k checkout a ověřte affiliate informace

### 2. Perzistence affiliate dat
- [ ] Navštivte stránku s affiliate parametry
- [ ] Zavřete prohlížeč a otevřete znovu
- [ ] Navštivte stránku bez affiliate parametrů
- [ ] Přidejte produkt - affiliate tracking by měl být stále aktivní

## ✅ Checkout Proces

### 1. Přístup k checkout
- [ ] Přidejte produkty do košíku
- [ ] Klikněte "Pokračovat k objednávce"
- [ ] Ověřte, že se otevře checkout stránka
- [ ] Zkuste přístup na `/checkout` s prázdným košíkem - mělo by přesměrovat na `/pricing`

### 2. Formulář
- [ ] Vyplňte všechna povinná pole (označená *)
- [ ] Zkuste odeslat bez souhlasu s podmínkami - měla by se zobrazit chyba
- [ ] Zaškrtněte souhlas a odešlete formulář
- [ ] Ověřte, že se zobrazuje "Zpracovávám objednávku..."

### 3. Validace
- [ ] Zkuste odeslat s neplatným emailem
- [ ] Zkuste odeslat s prázdnými povinnými poli
- [ ] Ověřte, že se zobrazují příslušné chyby

## ✅ Order Confirmation

### 1. Potvrzovací stránka
- [ ] Po úspěšném odeslání objednávky se měla otevřít confirmation stránka
- [ ] Ověřte zobrazení čísla objednávky
- [ ] Ověřte zobrazení dalších kroků
- [ ] Klikněte na "Zpět na hlavní stránku"

## ✅ Responzivní Design

### 1. Mobilní zobrazení
- [ ] Otevřete dev tools (F12)
- [ ] Přepněte na mobilní zobrazení
- [ ] Otestujte košík na mobilu
- [ ] Otestujte checkout formulář na mobilu

### 2. Tablet zobrazení
- [ ] Přepněte na tablet zobrazení
- [ ] Ověřte, že všechny komponenty fungují správně

## ✅ Chybové Stavy

### 1. Síťové chyby
- [ ] Odpojte internet
- [ ] Zkuste odeslat objednávku
- [ ] Ověřte, že se zobrazí chybová hláška

### 2. API chyby
- [ ] Bez nastavených environment variables by měla checkout API vrátit chybu
- [ ] Ověřte, že se chyba správně zobrazí uživateli

## 🔧 Technické Testy

### 1. Console chyby
- [ ] Otevřete dev tools Console
- [ ] Procházejte aplikaci a hledejte JavaScript chyby
- [ ] Všechny chyby by měly být opraveny

### 2. Network požadavky
- [ ] Otevřete Network tab
- [ ] Odešlete objednávku
- [ ] Ověřte, že se volají správné API endpointy

### 3. LocalStorage
- [ ] Otevřete Application tab > Local Storage
- [ ] Ověřte, že se ukládají data košíku a affiliate informace

## 📊 Performance

### 1. Rychlost načítání
- [ ] Ověřte, že se stránky načítají rychle
- [ ] Košík by se měl otevírat okamžitě

### 2. Animace
- [ ] Ověřte plynulé animace košíku
- [ ] Hover efekty na tlačítkách

## 🎯 Uživatelská Zkušenost

### 1. Intuitivnost
- [ ] Je jasné, jak přidat produkt do košíku?
- [ ] Je jasné, jak upravit košík?
- [ ] Je checkout proces srozumitelný?

### 2. Feedback
- [ ] Zobrazují se správné zprávy při akcích?
- [ ] Je jasné, kdy se něco načítá?
- [ ] Jsou chybové hlášky srozumitelné?

## 🔗 Integrace s HostBill

### 1. API připojení (vyžaduje nastavené env variables)
- [ ] Nastavte HOSTBILL_URL, HOSTBILL_API_ID, HOSTBILL_API_KEY
- [ ] Otestujte vytvoření objednávky
- [ ] Ověřte v HostBill admin panelu, že se objednávka vytvořila

### 2. Affiliate tracking (vyžaduje HostBill affiliate systém)
- [ ] Nastavte affiliate v HostBill
- [ ] Otestujte s reálným affiliate ID
- [ ] Ověřte tracking v HostBill

---

## 📝 Poznámky k testování

- Pro plné testování API funkcí je potřeba nastavit environment variables
- Bez HostBill připojení budou API volání vracet chyby, ale frontend by měl fungovat
- Affiliate tracking funguje i bez HostBill - data se ukládají lokálně
- Všechny komponenty by měly být responzivní a přístupné

## 🚀 Produkční Checklist

Před nasazením do produkce:
- [ ] Nastavte všechny environment variables
- [ ] Otestujte s reálným HostBill API
- [ ] Nastavte správné produktové ID (hostbillPid)
- [ ] Otestujte affiliate tracking
- [ ] Ověřte SSL certifikáty
- [ ] Nastavte monitoring a error tracking
