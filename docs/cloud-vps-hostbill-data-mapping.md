# Cloud VPS → HostBill Data Mapping

Přehledná dokumentace pro přenos dat z Cloud VPS do HostBill systému.

## 📋 Product Mapping

### Cloud VPS → HostBill Product IDs
| Cloud VPS ID | Cloud VPS Name | HostBill ID | HostBill Name | Price (CZK) |
|--------------|----------------|-------------|---------------|-------------|
| 1 | VPS Basic | 10 | VPS Profi | 299 |
| 2 | VPS Pro | 11 | VPS Premium | 499 |
| 3 | VPS Premium | 12 | VPS Enterprise | 899 |
| 4 | VPS Enterprise | 5 | VPS Start | 1299 |

## 🛒 Order Data Structure

### Customer Information
| Cloud VPS Field | HostBill API Field | Type | Required | Example |
|------------------|-------------------|------|----------|---------|
| `customer.firstName` | `firstname` | string | ✅ | "Jan" |
| `customer.lastName` | `lastname` | string | ✅ | "Novák" |
| `customer.email` | `email` | string | ✅ | "jan.novak@example.com" |
| `customer.phone` | `phonenumber` | string | ❌ | "+420123456789" |
| `customer.address` | `address1` | string | ❌ | "Testovací ulice 123" |
| `customer.city` | `city` | string | ❌ | "Praha" |
| `customer.postalCode` | `postcode` | string | ❌ | "11000" |
| `customer.country` | `country` | string | ❌ | "CZ" |
| `customer.company` | `companyname` | string | ❌ | "Test s.r.o." |

### Product Configuration
| Cloud VPS Field | HostBill API Field | Type | Required | Example |
|------------------|-------------------|------|----------|---------|
| `items[].productId` | `product` (mapped) | string | ✅ | "1" → "10" |
| `items[].name` | - | string | ❌ | "VPS Basic" |
| `items[].price` | - | number | ❌ | 299 |
| `items[].cycle` | `cycle` | string | ❌ | "m" |

### Operating System Selection
| Cloud VPS Value | HostBill Config Option | Field Name | Example |
|-----------------|----------------------|------------|---------|
| "linux" | `config_option_os` | `os` | "Ubuntu 22.04" |
| "windows" | `config_option_os` | `os` | "Windows Server 2022" |

### VPS Configuration Options
| Cloud VPS Field | HostBill Config Option | Type | Example |
|-----------------|----------------------|------|---------|
| `config.ram` | `config_option_ram` | string | "4GB" |
| `config.cpu` | `config_option_cpu` | string | "2" |
| `config.storage` | `config_option_storage` | string | "80GB" |
| `config.bandwidth` | `config_option_bandwidth` | string | "1TB" |

### Add-ons
| Cloud VPS Add-on | HostBill Addon ID | Price (CZK) | Description |
|------------------|-------------------|-------------|-------------|
| `backup_daily` | 15 | 99 | Daily Backup |
| `backup_weekly` | 16 | 49 | Weekly Backup |
| `ssl_certificate` | 20 | 199 | SSL Certificate |
| `monitoring` | 25 | 149 | Server Monitoring |

### Billing Cycles
| Cloud VPS Code | HostBill Code | Description |
|----------------|---------------|-------------|
| `monthly` | `m` | Monthly |
| `quarterly` | `q` | Quarterly |
| `semiannually` | `s` | Semi-annually |
| `annually` | `a` | Annually |

## 🎯 Affiliate Information
| Cloud VPS Field | HostBill API Field | Type | Required | Example |
|------------------|-------------------|------|----------|---------|
| `affiliate.id` | `affiliate_id` | string | ❌ | "2" |
| `affiliate.code` | - | string | ❌ | "test-affiliate" |

## 💰 Payment Information
| Cloud VPS Field | HostBill API Field | Type | Required | Example |
|------------------|-------------------|------|----------|---------|
| `payment.method` | `module` | string | ❌ | "banktransfer" |
| `payment.currency` | - | string | ❌ | "CZK" |
| `payment.total` | - | number | ❌ | 299 |

## 🔧 HostBill API Capabilities

### ✅ Product Management
- **`addProduct`** - Vytvoření nového produktu
- **`editProduct`** - Úprava existujícího produktu
- **`deleteProduct`** - Smazání produktu
- **`getProductDetails`** - Detail produktu
- **`getProducts`** - Seznam produktů

### ✅ Order Management
- **`addOrder`** - Vytvoření objednávky
- **`getOrderDetails`** - Detail objednávky
- **`setOrderReferrer`** - Přiřazení affiliate

### ✅ Client Management
- **`addClient`** - Vytvoření klienta
- **`getClientDetails`** - Detail klienta
- **`setClientDetails`** - Úprava klienta

### ✅ Addon Management
- **`getAddons`** - Seznam add-onů
- **`getProductApplicableAddons`** - Add-ony pro produkt

## 📊 Data Flow

### 1. Cloud VPS → Middleware
```json
{
  "customer": {
    "firstName": "Jan",
    "lastName": "Novák",
    "email": "jan.novak@example.com"
  },
  "items": [{
    "productId": "1",
    "name": "VPS Basic",
    "price": 299,
    "cycle": "monthly",
    "config": {
      "os": "linux",
      "ram": "4GB",
      "cpu": "2"
    }
  }],
  "affiliate": {
    "id": "2"
  }
}
```

### 2. Middleware → HostBill
```json
{
  "call": "addOrder",
  "client_id": "92",
  "product": "10",
  "cycle": "m",
  "config_option_os": "Ubuntu 22.04",
  "config_option_ram": "4GB",
  "config_option_cpu": "2",
  "affiliate_id": "2"
}
```

## 🚀 Implementation Status

### ✅ Implemented
- [x] Product ID mapping (Cloud VPS → HostBill)
- [x] Customer data transfer
- [x] Basic order creation
- [x] Affiliate assignment
- [x] Billing cycle mapping

### 🔄 In Progress
- [ ] Operating system configuration
- [ ] Add-ons integration
- [ ] Advanced VPS configuration
- [ ] Payment method handling

### 📋 Planned
- [ ] Automatic product creation via API
- [ ] Real-time inventory sync
- [ ] Advanced pricing rules
- [ ] Multi-currency support

## 🔗 API Endpoints

### Middleware
- `POST /api/process-order` - Complete order processing
- `GET /api/product-mapping` - Product mapping status

### Direct HostBill
- `POST /api/hostbill/create-order` - Direct order creation
- `GET /api/hostbill/get-affiliate-products` - Product listing

## 📝 Notes

1. **Product Mapping** je uložen v middleware `.env` souboru
2. **HostBill API** podporuje vytváření produktů přes `addProduct`
3. **Configuration Options** se předávají jako `config_option_[name]`
4. **Add-ons** se přidávají pomocí `addons[id][qty]` parametrů
5. **Affiliate Assignment** se provádí po vytvoření objednávky
