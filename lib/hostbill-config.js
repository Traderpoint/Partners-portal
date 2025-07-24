// HostBill Configuration with Product ID Mapping
// Supports format: INTERNAL_ID:HOSTBILL_ID (e.g., "1:5" means internal ID 1 maps to HostBill product 5)

// Utility function to parse product mapping from env
function parseProductMapping(envValue, defaultHostBillId = '5') {
  if (!envValue) return { internalId: '1', hostbillId: defaultHostBillId };

  if (envValue.includes(':')) {
    const [internalId, hostbillId] = envValue.split(':');
    return { internalId: internalId.trim(), hostbillId: hostbillId.trim() };
  }

  // Legacy format - treat as hostbill ID only
  return { internalId: '1', hostbillId: envValue };
}

export const HOSTBILL_CONFIG = {
  // API Configuration (VERIFIED WORKING)
  apiUrl: process.env.HOSTBILL_API_URL || 'https://vps.kabel1it.cz/admin/api.php',
  apiId: process.env.HOSTBILL_API_ID || 'adcdebb0e3b6f583052d',
  apiKey: process.env.HOSTBILL_API_KEY || '341697c41aeb1c842f0d',
  baseUrl: process.env.NEXT_PUBLIC_HOSTBILL_URL || 'https://vps.kabel1it.cz/',
  
  // Test Client ID (PLACEHOLDER)
  testClientId: process.env.HOSTBILL_TEST_CLIENT_ID || '1'
};

// Product ID Mapping (Internal ID : HostBill ID)
const VPS_BASIC_MAPPING = parseProductMapping(process.env.HOSTBILL_PRODUCT_VPS_BASIC, '5');
const VPS_PRO_MAPPING = parseProductMapping(process.env.HOSTBILL_PRODUCT_VPS_PRO, '5');
const VPS_ENTERPRISE_MAPPING = parseProductMapping(process.env.HOSTBILL_PRODUCT_VPS_ENTERPRISE, '5');
const VPS_PREMIUM_MAPPING = parseProductMapping(process.env.HOSTBILL_PRODUCT_VPS_PREMIUM, '5');

// Internal Product IDs (for UI/frontend)
export const PRODUCTS = {
  VPS_BASIC: VPS_BASIC_MAPPING.internalId,
  VPS_PRO: VPS_PRO_MAPPING.internalId,
  VPS_ENTERPRISE: VPS_ENTERPRISE_MAPPING.internalId,
  VPS_PREMIUM: VPS_PREMIUM_MAPPING.internalId
};

// HostBill Product IDs (for API calls)
export const HOSTBILL_PRODUCTS = {
  VPS_BASIC: VPS_BASIC_MAPPING.hostbillId,
  VPS_PRO: VPS_PRO_MAPPING.hostbillId,
  VPS_ENTERPRISE: VPS_ENTERPRISE_MAPPING.hostbillId,
  VPS_PREMIUM: VPS_PREMIUM_MAPPING.hostbillId
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
export function getHostBillProductId(internalProductId) {
  // Map internal product ID to HostBill product ID
  const mapping = {
    [PRODUCTS.VPS_BASIC]: HOSTBILL_PRODUCTS.VPS_BASIC,
    [PRODUCTS.VPS_PRO]: HOSTBILL_PRODUCTS.VPS_PRO,
    [PRODUCTS.VPS_ENTERPRISE]: HOSTBILL_PRODUCTS.VPS_ENTERPRISE,
    [PRODUCTS.VPS_PREMIUM]: HOSTBILL_PRODUCTS.VPS_PREMIUM
  };

  return mapping[internalProductId] || HOSTBILL_PRODUCTS.VPS_BASIC;
}

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
