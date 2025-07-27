# 🎛️ Middleware Dashboards Overview

Máme **dva funkční middleware dashboardy**, každý s různými funkcemi a účely.

## 📊 Dashboard #1 - Původní (React komponenta)

### **Základní informace:**
- **URL**: http://localhost:3000/middleware-dashboard
- **Typ**: React komponenta v CloudVPS aplikaci
- **Port**: 3000 (součást hlavní CloudVPS aplikace)
- **Technologie**: Next.js React komponenta

### **Funkce:**
- ✅ **Server Status** - Online/offline status middleware
- ✅ **API Health** - HostBill API connection status
- ✅ **Product Mapping** - CloudVPS ↔ HostBill product mapping
- ✅ **Configuration** - Middleware URL a port info
- ✅ **Quick Links** - Odkazy na test stránky
- ✅ **Real-time Updates** - Automatické načítání dat

### **Výhody:**
- Integrovaný do hlavní CloudVPS aplikace
- Jednoduchý přístup přes hlavní navigaci
- Rychlý přehled základních funkcí
- Minimální resource requirements

### **Použití:**
```bash
# Spustit CloudVPS aplikaci
npm run dev

# Přístup
http://localhost:3000/middleware-dashboard
```

---

## 🎛️ Dashboard #2 - Nový (Standalone server)

### **Základní informace:**
- **URL**: http://localhost:3010
- **Typ**: Samostatný Express server s EJS templates
- **Port**: 3010 (nezávislý server)
- **Technologie**: Express.js + EJS + CSS

### **Funkce:**
- ✅ **Real-time Monitoring** - Live stats, uptime, requests
- ✅ **System Health** - Dashboard + middleware health checks
- ✅ **Log Viewer** - Recent logs s barevným kódováním
- ✅ **Request Tracking** - Posledních 50 requestů s detaily
- ✅ **API Tester** - Kompletní API testing interface
- ✅ **Quick Tests** - Přednastavené testy pro hlavní endpointy
- ✅ **Custom Requests** - Vlastní API calls s JSON daty
- ✅ **Auto-refresh** - Automatické obnovování každých 30s
- ✅ **Error Handling** - Detailní error reporting

### **API Endpoints:**
- `GET /api/health` - Dashboard + middleware health
- `GET /api/stats` - Dashboard statistiky JSON
- `GET /api/logs` - Recent logs JSON
- `POST /api/test/middleware` - Proxy pro middleware testing

### **Výhody:**
- Nezávislý na hlavní aplikaci
- Pokročilé monitoring funkce
- Kompletní API testing suite
- Real-time log viewing
- Professional dashboard UI

### **Použití:**
```bash
# Spustit dashboard server
cd hostbill-order-middleware
npm run dashboard

# Nebo přímo
node dashboard/dashboard-server.js

# Přístup
http://localhost:3010
```

---

## 🔄 Porovnání funkcí

| **Funkce** | **Dashboard #1 (React)** | **Dashboard #2 (Standalone)** |
|------------|---------------------------|--------------------------------|
| **Server Status** | ✅ Základní | ✅ Detailní s uptime |
| **API Health** | ✅ Základní | ✅ Pokročilé s response time |
| **Product Mapping** | ✅ Ano | ❌ Ne |
| **Log Viewing** | ❌ Ne | ✅ Real-time s barevným kódováním |
| **Request Tracking** | ❌ Ne | ✅ Posledních 50 requestů |
| **API Testing** | ❌ Ne | ✅ Kompletní testing suite |
| **Auto-refresh** | ✅ Ano | ✅ Ano (30s) |
| **Custom Styling** | ✅ Základní | ✅ Professional UI |
| **Independence** | ❌ Závislý na CloudVPS | ✅ Samostatný server |

---

## 🎯 Kdy použít který dashboard

### **Dashboard #1 (React) - Použij když:**
- Potřebuješ rychlý přehled stavu middleware
- Chceš zkontrolovat product mapping
- Pracuješ v rámci CloudVPS aplikace
- Potřebuješ základní monitoring

### **Dashboard #2 (Standalone) - Použij když:**
- Potřebuješ detailní monitoring a debugging
- Chceš testovat API endpointy
- Potřebuješ sledovat logy v real-time
- Chceš nezávislý monitoring tool
- Pracuješ na vývoji middleware

---

## 🚀 Spuštění obou dashboardů současně

```bash
# Terminal 1 - CloudVPS aplikace (Dashboard #1)
npm run dev

# Terminal 2 - Middleware server
cd hostbill-order-middleware
npm start

# Terminal 3 - Standalone dashboard (Dashboard #2)
cd hostbill-order-middleware
npm run dashboard
```

### **Přístupové URL:**
- **Dashboard #1**: http://localhost:3000/middleware-dashboard
- **Dashboard #2**: http://localhost:3010
- **Middleware API**: http://localhost:3005

---

## 📝 Doporučení

### **Pro produkční použití:**
1. **Dashboard #1** - Pro běžné uživatele a základní monitoring
2. **Dashboard #2** - Pro administrátory a debugging

### **Pro vývoj:**
- Používej **Dashboard #2** pro detailní debugging a API testing
- Používej **Dashboard #1** pro rychlé kontroly během vývoje

### **Bezpečnost:**
- Dashboard #2 by měl být v produkci chráněn autentizací
- Oba dashboardy by měly být dostupné pouze z interní sítě

---

## 🎉 Závěr

Máme **dva komplementární dashboardy** - jeden pro základní monitoring integrovaný do hlavní aplikace, druhý pro pokročilé monitoring a debugging jako samostatný nástroj. Oba jsou funkční a slouží různým účelům!
