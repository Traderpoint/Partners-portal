# Systrix Partners Portal

Vylepšený Systrix Partners Portal s dlaždicovými tlačítky, pokročilou analýzou a grafy.

## 🚀 Funkce

### ✨ Nový Dashboard
- **Dlaždicová tlačítka** pro rychlé akce (View Orders, Analytics, Refresh Data, Export)
- **Metriky v reálném čase** s gradientními kartami
- **Přehled komisí** s progress barem
- **Responzivní design** pro všechna zařízení

### 📊 Pokročilá Analýza
- **Interaktivní grafy** pomocí Recharts
- **6 různých pohledů**:
  - Overview (Area chart s revenue a orders)
  - Revenue Trend (Line chart)
  - Commission Analysis (Bar chart)
  - Order Status Distribution (Pie chart)
  - Performance Metrics (KPI dashboard)
  - Activity Timeline (Area chart)

### 🎯 Klíčové Metriky
- Průměrná hodnota objednávky
- Konverzní poměr
- Celkový příjem
- Průměrná komise
- Placené vs. čekající komise

## 🛠️ Instalace

```bash
# Naklonování a instalace závislostí
cd Partners-HostBill-Portal
npm install

# Spuštění vývojového serveru
npm run dev
```

## 🌐 Přístup

- **URL**: http://localhost:3006
- **Test Affiliate ID**: 1
- **Heslo**: Není vyžadováno (validace pouze přes HostBill API)

## 🧪 Testování

```bash
# Spuštění automatických testů
node test-portal.js
```

Test ověří:
- ✅ Dostupnost serveru
- ✅ Připojení k HostBill API
- ✅ Autentifikaci
- ✅ Načítání objednávek
- ✅ Načítání komisí

## 📱 Použití

### 1. Přihlášení
- Zadejte Affiliate ID (např. "1")
- Systém ověří ID přes HostBill API
- Automatické přihlášení bez hesla

### 2. Navigace
Aplikace obsahuje 4 hlavní sekce dostupné z levého menu:

#### 🏠 **Dashboard**
- Hlavní přehled s dlaždicovými tlačítky
- Metriky v reálném čase
- Rychlé akce (View Orders, Analytics, Refresh, Export)
- Přehled komisí s progress barem

#### 📋 **Orders**
- Detailní seznam všech objednávek
- Pokročilé filtry (status, datum, částka)
- Export funkcionalita
- Kombinované zobrazení objednávek a komisí

#### 💰 **Commissions**
- Specializovaný pohled na komise
- Filtry podle stavu (Paid/Pending)
- Vyhledávání podle Order ID
- Přehledné zobrazení stavu plateb

#### 👤 **Profile**
- Informace o affiliate účtu
- Kontaktní údaje
- Platební informace
- Stav účtu a nastavení

### 3. Dlaždicová Tlačítka (Dashboard)
- **View Orders**: Přepnutí na seznam objednávek
- **Analytics**: Přepnutí na analytický dashboard
- **Refresh Data**: Aktualizace všech dat
- **Export Data**: Export dat do CSV

### 4. Analytické Grafy
Klikněte na libovolné tlačítko pro zobrazení různých grafů:
- **Overview**: Kombinovaný pohled na revenue a objednávky
- **Revenue Trend**: Trend příjmů v čase
- **Commission**: Analýza komisí
- **Order Status**: Distribuce stavů objednávek
- **Performance**: KPI metriky
- **Activity**: Timeline aktivity

## 🔧 Konfigurace

### Environment Variables
```env
HOSTBILL_API_ID=your_api_id
HOSTBILL_API_KEY=your_api_key
JWT_SECRET=your_jwt_secret
```

### HostBill API
- **URL**: http://vps.kabel1it.cz
- **Endpoint**: /admin/api.php
- **Metody**: getAffiliate, getOrders, getAffiliateCommissions

## 📊 Technologie

- **Frontend**: Next.js, React, Tailwind CSS
- **Grafy**: Recharts
- **Ikony**: Lucide React
- **Autentifikace**: JWT
- **API**: HostBill REST API

## 🎨 Design

### Barevné Schéma
- **Primární**: Modrá (#3B82F6)
- **Úspěch**: Zelená (#10B981)
- **Varování**: Žlutá (#F59E0B)
- **Chyba**: Červená (#EF4444)
- **Info**: Fialová (#8B5CF6)

### Komponenty
- **DashboardTiles**: Dlaždicová tlačítka a metriky
- **Analytics**: Pokročilé grafy a analýzy
- **FiltersAndExport**: Filtry a export funkcionalita
- **Layout**: Základní layout s navigací

## 🔍 Debugging

### Logs
Aplikace loguje všechny API volání:
- 🔧 API calls
- 📡 URLs
- 🔑 API credentials (částečně)
- 📋 Parameters
- ✅/❌ Responses

### Debug Data
Na konci každé stránky je sekce "Debug Data" s:
- Raw orders data
- Raw commissions data
- JSON formát pro debugging

## 🚀 Deployment

```bash
# Build pro produkci
npm run build

# Spuštění produkčního serveru
npm start
```

## 📝 Changelog

### v1.3.0 (2024-01-27) - Final Navigation Fix & Rebranding
- 🏷️ **Rebranding na "Systrix Partners Portal"** - Změna názvu napříč celou aplikací
- 🔧 **Definitivní oprava Dashboard navigace** - Přidán explicitní handler pro Dashboard klik
- ⚡ **onDashboardClick prop** - Layout komponent nyní přijímá callback pro reset view
- 🎯 **Explicitní Link handlery** - Každý navigační link má vlastní onClick handler
- 🧪 **Kompletní testování** - Ověření všech oprav a funkcionalit

### v1.2.0 (2024-01-27) - Dashboard Navigation Fix
- 🔧 **Opravena Dashboard navigace** - Kliknutí na "Dashboard" v menu nyní správně resetuje view
- 🏷️ **Opraveny titulky** - Všechny stránky nyní zobrazují "Partners HostBill Portal"
- ⚡ **useRouter implementace** - Přidán useEffect pro resetování currentView při změně URL
- 🧪 **Rozšířené testování** - Nové testy pro ověření navigačních oprav

### v1.1.0 (2024-01-27) - Navigation Update
- 🔗 **Opravena navigace** - Všechny položky z levého menu nyní fungují
- 📋 **Nová stránka Orders** - Specializovaný pohled na objednávky s filtry
- 💰 **Nová stránka Commissions** - Detailní správa komisí
- 👤 **Nová stránka Profile** - Kompletní profil affiliate partnera
- 🎯 **Next.js Link komponenty** - Správná navigace bez 404 chyb
- ✨ **Aktivní stav menu** - Zvýraznění aktuální stránky

### v1.0.0 (2024-01-27)
- ✨ Nový dashboard s dlaždicovými tlačítky
- 📊 Pokročilé grafy s Recharts
- 🎯 6 různých analytických pohledů
- 💰 Vylepšený přehled komisí
- 📱 Responzivní design
- 🧪 Automatické testování

## 🤝 Podpora

Pro podporu a dotazy kontaktujte vývojový tým.

---

**🎉 Systrix Partners Portal je nyní připraven k použití!**
