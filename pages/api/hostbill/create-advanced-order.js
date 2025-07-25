// Advanced HostBill Order Creation with full configuration
import https from 'https';
import { URL } from 'url';
import { HOSTBILL_CONFIG, createOrderPayload, createAffiliatePayload, getProductById, getAddonById } from '../../../lib/hostbill-config.js';

// Product mapping (Cloud VPS -> HostBill)
const PRODUCT_MAPPING = {
  '1': '10', // VPS Basic -> VPS Profi
  '2': '11', // VPS Pro -> VPS Premium
  '3': '12', // VPS Premium -> VPS Enterprise
  '4': '5'   // VPS Enterprise -> VPS Start
};

// Addon mapping
const ADDON_MAPPING = {
  'backup_daily': '15',
  'backup_weekly': '16', 
  'ssl_certificate': '20',
  'monitoring': '25'
};

function mapProductId(cloudVpsProductId) {
  const hostbillId = PRODUCT_MAPPING[String(cloudVpsProductId)];
  if (!hostbillId) {
    throw new Error(`No HostBill mapping found for Cloud VPS product ID: ${cloudVpsProductId}`);
  }
  return hostbillId;
}

function mapOperatingSystem(osType) {
  const osMapping = {
    'linux': 'Ubuntu 22.04 LTS',
    'windows': 'Windows Server 2022'
  };
  return osMapping[osType] || 'Ubuntu 22.04 LTS';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  const { customer, items, addons = [], affiliate, payment } = req.body;

  if (!customer || !items || !items.length) {
    return res.status(400).json({ 
      success: false, 
      error: 'Customer and items are required' 
    });
  }

  console.log('🚀 Creating advanced order directly in HostBill:', {
    customer: customer.email,
    items: items.length,
    addons: addons.filter(a => a.enabled).length
  });

  let orderResult = {
    success: false,
    steps: [],
    errors: []
  };

  try {
    // Step 1: Create or get client
    let clientId;
    
    // For demo purposes, we'll use a test client ID
    // In production, you'd search for existing client or create new one
    clientId = '92'; // Test client ID
    
    orderResult.steps.push({
      step: 'client_lookup',
      status: 'success',
      client_id: clientId,
      message: 'Using existing test client'
    });

    // Step 2: Process each item
    for (const item of items) {
      try {
        // Map Cloud VPS product ID to HostBill product ID
        const hostbillProductId = mapProductId(item.productId);
        
        console.log('🛒 Creating order for item:', {
          cloudVpsProductId: item.productId,
          hostbillProductId: hostbillProductId,
          productName: item.name
        });

        // Prepare order parameters
        const orderParams = {
          call: 'addOrder',
          client_id: clientId,
          product: hostbillProductId,
          cycle: item.cycle || 'm',
          confirm: 1,
          invoice_generate: 1,
          invoice_info: 1
        };

        // Add configuration options
        if (item.configOptions) {
          if (item.configOptions.os) {
            orderParams.config_option_os = mapOperatingSystem(item.configOptions.os);
          }
          if (item.configOptions.ram) {
            orderParams.config_option_ram = item.configOptions.ram;
          }
          if (item.configOptions.cpu) {
            orderParams.config_option_cpu = item.configOptions.cpu;
          }
          if (item.configOptions.storage) {
            orderParams.config_option_storage = item.configOptions.storage;
          }
          if (item.configOptions.bandwidth) {
            orderParams.config_option_bandwidth = item.configOptions.bandwidth;
          }
        }

        // Add addons
        addons.filter(addon => addon.enabled).forEach(addon => {
          const addonId = ADDON_MAPPING[addon.name];
          if (addonId) {
            orderParams[`addons[${addonId}][qty]`] = 1;
          }
        });

        // Add affiliate if provided
        if (affiliate && affiliate.id) {
          orderParams.affiliate_id = affiliate.id;
        }

        console.log('📤 Order parameters:', orderParams);

        // Create order via HostBill API
        const orderResponse = await makeHostBillAPICall(orderParams);
        
        if (orderResponse.success && orderResponse.data.success === true) {
          orderResult.steps.push({
            step: 'create_order',
            status: 'success',
            order_id: orderResponse.data.order_id,
            cloudVpsProductId: item.productId,
            hostbillProductId: hostbillProductId,
            productName: item.name,
            configOptions: item.configOptions,
            addons: addons.filter(a => a.enabled).map(a => a.name),
            message: 'Order created successfully'
          });

          console.log('✅ Order created:', orderResponse.data.order_id);
        } else {
          throw new Error(`Order creation failed: ${JSON.stringify(orderResponse)}`);
        }
      } catch (itemError) {
        console.error('❌ Failed to create order for item:', itemError);
        orderResult.errors.push(`Failed to create order for ${item.name}: ${itemError.message}`);
        orderResult.steps.push({
          step: 'create_order',
          status: 'error',
          productName: item.name,
          error: itemError.message
        });
      }
    }

    // Determine overall success
    const successfulOrders = orderResult.steps.filter(step => step.step === 'create_order' && step.status === 'success');
    orderResult.success = successfulOrders.length > 0;

    if (orderResult.success) {
      res.json({
        success: true,
        message: 'Advanced order processed successfully',
        orders_created: successfulOrders.length,
        total_items: items.length,
        client_id: clientId,
        steps: orderResult.steps,
        errors: orderResult.errors,
        mapping: {
          productMapping: PRODUCT_MAPPING,
          addonMapping: ADDON_MAPPING
        },
        summary: {
          customer: `${customer.firstName} ${customer.lastName}`,
          email: customer.email,
          products: items.length,
          addons: addons.filter(a => a.enabled).length,
          total: payment?.total || 0,
          currency: 'CZK'
        },
        source: 'direct_hostbill_advanced',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to create any orders',
        steps: orderResult.steps,
        errors: orderResult.errors,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ Advanced order processing failed:', error);
    res.status(500).json({
      success: false,
      error: 'Advanced order processing failed',
      details: error.message,
      steps: orderResult.steps,
      timestamp: new Date().toISOString()
    });
  }
}

// Helper function to make HostBill API calls
async function makeHostBillAPICall(params) {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams({
      api_id: HOSTBILL_CONFIG.apiId,
      api_key: HOSTBILL_CONFIG.apiKey,
      ...params
    }).toString();

    const options = {
      hostname: new URL(HOSTBILL_CONFIG.apiUrl).hostname,
      path: new URL(HOSTBILL_CONFIG.apiUrl).pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      },
      rejectUnauthorized: false
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ success: true, data: result });
        } catch (parseError) {
          resolve({ success: false, error: 'Invalid JSON response', data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}
