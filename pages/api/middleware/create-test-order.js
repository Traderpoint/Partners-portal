// Advanced Order Test API - Complete implementation
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const middlewareUrl = process.env.MIDDLEWARE_URL || 'http://localhost:3005';

  try {
    console.log('🚀 Processing advanced order test...');
    console.log('📤 Order data:', JSON.stringify(req.body, null, 2));

    // Validate required fields
    const { customer, items, addons = [], affiliate, payment } = req.body;

    if (!customer || !items || !items.length) {
      return res.status(400).json({
        success: false,
        error: 'Customer and items are required',
        timestamp: new Date().toISOString()
      });
    }

    // Transform Cloud VPS data to middleware format
    const middlewareOrderData = {
      customer: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone || '',
        address: customer.address || '',
        city: customer.city || '',
        postalCode: customer.postalCode || '',
        country: customer.country || 'CZ',
        company: customer.company || ''
      },
      items: items.map(item => ({
        productId: item.productId,
        name: item.name,
        price: parseFloat(item.price),
        cycle: item.cycle || 'm',
        configOptions: {
          // Map Cloud VPS config to HostBill format
          config_option_os: mapOperatingSystem(item.configOptions?.os),
          config_option_ram: item.configOptions?.ram,
          config_option_cpu: item.configOptions?.cpu,
          config_option_storage: item.configOptions?.storage,
          config_option_bandwidth: item.configOptions?.bandwidth,
          // Add custom fields
          cloudvps_os_type: item.configOptions?.os,
          cloudvps_ram: item.configOptions?.ram,
          cloudvps_cpu: item.configOptions?.cpu
        }
      })),
      addons: addons.map(addon => ({
        name: addon.name,
        enabled: addon.enabled,
        addon_id: mapAddonToHostBill(addon.name)
      })),
      affiliate: affiliate ? {
        id: affiliate.id
      } : null,
      paymentMethod: payment?.method || 'banktransfer',
      total: payment?.total || 0,
      source: 'advanced_order_test',
      test_mode: true
    };

    console.log('🔄 Transformed data for middleware:', JSON.stringify(middlewareOrderData, null, 2));

    // Send to middleware
    const response = await fetch(`${middlewareUrl}/api/process-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(middlewareOrderData)
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Advanced order processed successfully:', result);

      // Enhanced response with mapping info
      res.status(200).json({
        success: true,
        message: 'Advanced order processed successfully',
        processingId: result.processingId,
        clientId: result.clientId,
        orders: result.orders,
        affiliate: result.affiliate,
        mapping: {
          originalData: req.body,
          transformedData: middlewareOrderData,
          productMapping: getProductMapping(),
          addonMapping: getAddonMapping()
        },
        summary: {
          customer: `${customer.firstName} ${customer.lastName}`,
          email: customer.email,
          products: items.length,
          addons: addons.filter(a => a.enabled).length,
          total: payment?.total || 0,
          currency: 'CZK'
        },
        source: 'advanced_order_test',
        middleware_url: middlewareUrl,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('❌ Middleware order processing failed:', result);
      res.status(500).json({
        success: false,
        error: result.error || 'Order processing failed',
        details: result.details || 'Unknown error',
        middleware_response: result,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ Error processing advanced order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process advanced order',
      details: error.message,
      middleware_url: middlewareUrl,
      timestamp: new Date().toISOString()
    });
  }
}

// Helper functions
function mapOperatingSystem(osType) {
  const osMapping = {
    'linux': 'Ubuntu 22.04 LTS',
    'windows': 'Windows Server 2022'
  };
  return osMapping[osType] || 'Ubuntu 22.04 LTS';
}

function mapAddonToHostBill(addonName) {
  const addonMapping = {
    'backup_daily': '15',
    'backup_weekly': '16',
    'ssl_certificate': '20',
    'monitoring': '25'
  };
  return addonMapping[addonName] || null;
}

function getProductMapping() {
  return {
    '1': '10', // VPS Basic -> VPS Profi
    '2': '11', // VPS Pro -> VPS Premium
    '3': '12', // VPS Premium -> VPS Enterprise
    '4': '5'   // VPS Enterprise -> VPS Start
  };
}

function getAddonMapping() {
  return {
    'backup_daily': { id: '15', name: 'Daily Backup', price: 99 },
    'backup_weekly': { id: '16', name: 'Weekly Backup', price: 49 },
    'ssl_certificate': { id: '20', name: 'SSL Certificate', price: 199 },
    'monitoring': { id: '25', name: 'Server Monitoring', price: 149 }
  };
}
