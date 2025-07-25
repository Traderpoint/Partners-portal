/**
 * Společná konfigurace pro všechny direct HostBill API testy
 * Centralizuje API klíče a nastavení pro konzistentní použití
 * Všechny API klíče jsou nakonfigurovány v .env.local
 */

export const HOSTBILL_CONFIG = {
  // Základní URL a doména
  domain: process.env.NEXT_PUBLIC_HOSTBILL_DOMAIN || 'vps.kabel1it.cz',
  baseUrl: process.env.NEXT_PUBLIC_HOSTBILL_URL || 'https://vps.kabel1it.cz',
  apiUrl: process.env.HOSTBILL_API_URL || 'https://vps.kabel1it.cz/admin/api.php',

  // API přihlašovací údaje (CONFIGURED)
  apiId: process.env.HOSTBILL_API_ID || 'adcdebb0e3b6f583052d',
  apiKey: process.env.HOSTBILL_API_KEY || '341697c41aeb1c842f0d',
  apiSecret: process.env.HOSTBILL_API_SECRET || '341697c41aeb1c842f0d',

  // Výchozí nastavení
  defaultCurrency: 'CZK',
  defaultCountry: 'CZ',
  defaultLanguage: 'czech',

  // Timeout pro API volání
  timeout: 30000,

  // SSL nastavení pro development
  rejectUnauthorized: false,

  // Test Client ID
  testClientId: process.env.HOSTBILL_TEST_CLIENT_ID || '1'
};

// Product IDs (PLACEHOLDERS - TO BE UPDATED)
export const PRODUCTS = {
  VPS_BASIC: process.env.HOSTBILL_PRODUCT_VPS_BASIC || '1',
  VPS_PRO: process.env.HOSTBILL_PRODUCT_VPS_PRO || '2', 
  VPS_ENTERPRISE: process.env.HOSTBILL_PRODUCT_VPS_ENTERPRISE || '3',
  VPS_PREMIUM: process.env.HOSTBILL_PRODUCT_VPS_PREMIUM || '4'
};

// Addon IDs (PLACEHOLDERS - TO BE UPDATED)
export const ADDONS = {
  CPANEL: process.env.HOSTBILL_ADDON_CPANEL || '5',
  SSL_CERT: process.env.HOSTBILL_ADDON_SSL_CERT || '6',
  BACKUP: process.env.HOSTBILL_ADDON_BACKUP || '7',
  MONITORING: process.env.HOSTBILL_ADDON_MONITORING || '8',
  FIREWALL: process.env.HOSTBILL_ADDON_FIREWALL || '9',
  EXTRA_IP: process.env.HOSTBILL_ADDON_EXTRA_IP || '10',
  PLESK: process.env.HOSTBILL_ADDON_PLESK || '11',
  CLOUDFLARE: process.env.HOSTBILL_ADDON_CLOUDFLARE || '12'
};

// Configuration Options (PLACEHOLDERS - TO BE UPDATED)
export const CONFIG_OPTIONS = {
  RAM: {
    '1GB': process.env.HOSTBILL_CONFIG_RAM_1GB || '1',
    '2GB': process.env.HOSTBILL_CONFIG_RAM_2GB || '2',
    '4GB': process.env.HOSTBILL_CONFIG_RAM_4GB || '3',
    '8GB': process.env.HOSTBILL_CONFIG_RAM_8GB || '4'
  },
  CPU: {
    '1_CORE': process.env.HOSTBILL_CONFIG_CPU_1CORE || '1',
    '2_CORE': process.env.HOSTBILL_CONFIG_CPU_2CORE || '2',
    '4_CORE': process.env.HOSTBILL_CONFIG_CPU_4CORE || '3'
  },
  STORAGE: {
    '20GB': process.env.HOSTBILL_CONFIG_STORAGE_20GB || '1',
    '40GB': process.env.HOSTBILL_CONFIG_STORAGE_40GB || '2',
    '80GB': process.env.HOSTBILL_CONFIG_STORAGE_80GB || '3'
  }
};

// Product Definitions with Placeholders
export const PRODUCT_DEFINITIONS = {
  [PRODUCTS.VPS_BASIC]: {
    id: PRODUCTS.VPS_BASIC,
    name: 'VPS Basic',
    description: 'Základní VPS server pro začátečníky',
    specs: {
      cpu: '1 vCPU',
      ram: '1 GB RAM', 
      storage: '20 GB SSD',
      bandwidth: '1 TB'
    },
    pricing: {
      monthly: 299,
      quarterly: 850,
      annually: 3200
    },
    availableAddons: [ADDONS.SSL_CERT, ADDONS.BACKUP, ADDONS.MONITORING],
    configOptions: {
      ram: [CONFIG_OPTIONS.RAM['1GB'], CONFIG_OPTIONS.RAM['2GB']],
      storage: [CONFIG_OPTIONS.STORAGE['20GB'], CONFIG_OPTIONS.STORAGE['40GB']]
    }
  },
  
  [PRODUCTS.VPS_PRO]: {
    id: PRODUCTS.VPS_PRO,
    name: 'VPS Pro',
    description: 'Profesionální VPS pro náročnější aplikace',
    specs: {
      cpu: '2 vCPU',
      ram: '4 GB RAM',
      storage: '80 GB SSD', 
      bandwidth: '2 TB'
    },
    pricing: {
      monthly: 599,
      quarterly: 1700,
      annually: 6400
    },
    availableAddons: [ADDONS.CPANEL, ADDONS.SSL_CERT, ADDONS.BACKUP, ADDONS.MONITORING, ADDONS.FIREWALL],
    configOptions: {
      ram: [CONFIG_OPTIONS.RAM['2GB'], CONFIG_OPTIONS.RAM['4GB'], CONFIG_OPTIONS.RAM['8GB']],
      cpu: [CONFIG_OPTIONS.CPU['2_CORE'], CONFIG_OPTIONS.CPU['4_CORE']],
      storage: [CONFIG_OPTIONS.STORAGE['40GB'], CONFIG_OPTIONS.STORAGE['80GB']]
    }
  },
  
  [PRODUCTS.VPS_ENTERPRISE]: {
    id: PRODUCTS.VPS_ENTERPRISE,
    name: 'VPS Enterprise',
    description: 'Výkonný VPS pro enterprise aplikace',
    specs: {
      cpu: '4 vCPU',
      ram: '8 GB RAM',
      storage: '160 GB SSD',
      bandwidth: '5 TB'
    },
    pricing: {
      monthly: 1299,
      quarterly: 3700,
      annually: 14000
    },
    availableAddons: [ADDONS.CPANEL, ADDONS.PLESK, ADDONS.SSL_CERT, ADDONS.BACKUP, ADDONS.MONITORING, ADDONS.FIREWALL, ADDONS.EXTRA_IP, ADDONS.CLOUDFLARE],
    configOptions: {
      ram: [CONFIG_OPTIONS.RAM['4GB'], CONFIG_OPTIONS.RAM['8GB']],
      cpu: [CONFIG_OPTIONS.CPU['4_CORE']],
      storage: [CONFIG_OPTIONS.STORAGE['80GB']]
    }
  }
};

// Addon Definitions with Placeholders
export const ADDON_DEFINITIONS = {
  [ADDONS.CPANEL]: {
    id: ADDONS.CPANEL,
    name: 'cPanel',
    description: 'Webové rozhraní pro správu hostingu',
    price: 150,
    cycle: 'monthly'
  },
  
  [ADDONS.SSL_CERT]: {
    id: ADDONS.SSL_CERT,
    name: 'SSL Certifikát',
    description: 'Bezpečnostní certifikát pro HTTPS',
    price: 99,
    cycle: 'annually'
  },
  
  [ADDONS.BACKUP]: {
    id: ADDONS.BACKUP,
    name: 'Automatické zálohy',
    description: 'Denní automatické zálohy dat',
    price: 50,
    cycle: 'monthly'
  },
  
  [ADDONS.MONITORING]: {
    id: ADDONS.MONITORING,
    name: '24/7 Monitoring',
    description: 'Nepřetržité sledování serveru',
    price: 75,
    cycle: 'monthly'
  },
  
  [ADDONS.FIREWALL]: {
    id: ADDONS.FIREWALL,
    name: 'Pokročilý Firewall',
    description: 'Rozšířená ochrana proti útokům',
    price: 100,
    cycle: 'monthly'
  },
  
  [ADDONS.EXTRA_IP]: {
    id: ADDONS.EXTRA_IP,
    name: 'Dodatečná IP adresa',
    description: 'Další dedikovaná IP adresa',
    price: 200,
    cycle: 'monthly'
  },
  
  [ADDONS.PLESK]: {
    id: ADDONS.PLESK,
    name: 'Plesk Panel',
    description: 'Alternativní správcovské rozhraní',
    price: 180,
    cycle: 'monthly'
  },
  
  [ADDONS.CLOUDFLARE]: {
    id: ADDONS.CLOUDFLARE,
    name: 'CloudFlare Pro',
    description: 'CDN a ochrana proti DDoS',
    price: 120,
    cycle: 'monthly'
  }
};

// Helper functions
export function getProductById(productId) {
  return PRODUCT_DEFINITIONS[productId] || null;
}

export function getAddonById(addonId) {
  return ADDON_DEFINITIONS[addonId] || null;
}

export function getAvailableAddonsForProduct(productId) {
  const product = getProductById(productId);
  if (!product) return [];
  
  return product.availableAddons.map(addonId => getAddonById(addonId)).filter(Boolean);
}

// Order creation helper
export function createOrderPayload(clientId, productId, cycle, selectedAddons = [], configOptions = {}, affiliateId = null) {
  const payload = {
    call: 'addOrder',
    api_id: HOSTBILL_CONFIG.apiId,
    api_key: HOSTBILL_CONFIG.apiKey,
    client_id: clientId,
    product: productId,
    cycle: cycle,
    confirm: 1,
    invoice_generate: 1,
    invoice_info: 1
  };

  // Add addons if selected
  if (selectedAddons.length > 0) {
    payload.addons = selectedAddons.map(addon => ({
      addon_id: addon.id,
      qty: addon.quantity || 1
    }));
  }

  // Add configuration options
  if (Object.keys(configOptions).length > 0) {
    payload.configoptions = configOptions;
  }

  return payload;
}

// Affiliate assignment helper
export function createAffiliatePayload(orderId, affiliateId) {
  return {
    call: 'setOrderReferrer',
    api_id: HOSTBILL_CONFIG.apiId,
    api_key: HOSTBILL_CONFIG.apiKey,
    id: orderId,
    referral: affiliateId
  };
}

/**
 * Vytvoří payload pro HostBill API volání
 * @param {string} call - Název API volání
 * @param {Object} params - Dodatečné parametry
 * @returns {Object} Kompletní payload
 */
export function createApiPayload(call, params = {}) {
  return {
    api_id: HOSTBILL_CONFIG.apiId,
    api_key: HOSTBILL_CONFIG.apiKey,
    call,
    ...params
  };
}

/**
 * Ověří, zda jsou všechny potřebné konfigurace nastaveny
 * @returns {Object} Výsledek validace
 */
export function validateConfig() {
  const missing = [];
  const warnings = [];

  // Kontrola povinných hodnot
  if (!HOSTBILL_CONFIG.apiId || HOSTBILL_CONFIG.apiId === 'your-api-id') {
    missing.push('HOSTBILL_API_ID');
  }

  if (!HOSTBILL_CONFIG.apiKey || HOSTBILL_CONFIG.apiKey === 'your-api-key') {
    missing.push('HOSTBILL_API_KEY');
  }

  if (!HOSTBILL_CONFIG.domain || HOSTBILL_CONFIG.domain === 'your-domain.com') {
    missing.push('NEXT_PUBLIC_HOSTBILL_DOMAIN');
  }

  // Kontrola doporučených hodnot
  if (HOSTBILL_CONFIG.apiId === HOSTBILL_CONFIG.apiKey) {
    warnings.push('API ID a API Key jsou stejné - zkontrolujte konfiguraci');
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
    config: {
      hostbill: HOSTBILL_CONFIG,
      products: PRODUCTS,
      addons: ADDONS
    }
  };
}

/**
 * Loguje konfiguraci pro debug účely
 */
export function debugConfig() {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_AFFILIATE_DEBUG === 'true') {
    console.group('🔧 HostBill Configuration');
    console.log('Domain:', HOSTBILL_CONFIG.domain);
    console.log('API URL:', HOSTBILL_CONFIG.apiUrl);
    console.log('API ID:', HOSTBILL_CONFIG.apiId ? `${HOSTBILL_CONFIG.apiId.substring(0, 8)}...` : 'NOT SET');
    console.log('API Key:', HOSTBILL_CONFIG.apiKey ? `${HOSTBILL_CONFIG.apiKey.substring(0, 8)}...` : 'NOT SET');
    console.log('Products:', PRODUCTS);
    console.log('Addons:', ADDONS);
    console.groupEnd();
  }
}

// Export default konfigurace
export default {
  HOSTBILL_CONFIG,
  PRODUCTS,
  ADDONS,
  validateConfig,
  createApiPayload,
  debugConfig
};
