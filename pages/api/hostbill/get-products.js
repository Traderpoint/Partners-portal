// API endpoint for getting available products from HostBill
import https from 'https';
import { URL } from 'url';
import { HOSTBILL_CONFIG } from '../../../lib/hostbill-config.js';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { affiliate_id } = req.method === 'POST' ? req.body : req.query;

    // Helper function to make HostBill API calls (copied from working create-order.js)
    async function makeHostBillAPICall(payload) {
      try {
        const postData = new URLSearchParams(payload).toString();
        const apiUrl = new URL(HOSTBILL_CONFIG.apiUrl);

        const response = await new Promise((resolve, reject) => {
          const options = {
            hostname: apiUrl.hostname,
            port: apiUrl.port || 443,
            path: apiUrl.pathname,
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Content-Length': Buffer.byteLength(postData)
            },
            rejectUnauthorized: false // For self-signed certificates
          };

          const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
              data += chunk;
            });
            res.on('end', () => {
              resolve(data);
            });
          });

          req.on('error', (error) => {
            reject(error);
          });

          req.write(postData);
          req.end();
        });

        console.log('📥 HostBill Raw Response:', response);

        try {
          const data = JSON.parse(response);
          return { success: true, data };
        } catch (parseError) {
          console.error('❌ JSON Parse Error:', parseError.message);
          return { success: false, error: 'Invalid JSON response', raw: response };
        }
      } catch (error) {
        console.error('❌ HostBill API Error:', error.message);
        return { success: false, error: error.message };
      }
    }

    // Get orders first to find product IDs
    const ordersPayload = {
      call: 'getOrders',
      api_id: HOSTBILL_CONFIG.apiId,
      api_key: HOSTBILL_CONFIG.apiKey,
      limit: 5
    };

    console.log('📋 Getting recent orders...');
    const ordersResponse = await makeHostBillAPICall(ordersPayload);

    let orderDetails = [];
    if (ordersResponse.success && ordersResponse.data.orders) {
      // Get details for first few orders to find product IDs
      for (const order of ordersResponse.data.orders.slice(0, 3)) {
        const orderDetailPayload = {
          call: 'getOrderDetails',
          api_id: HOSTBILL_CONFIG.apiId,
          api_key: HOSTBILL_CONFIG.apiKey,
          id: order.id
        };

        console.log(`🔍 Getting details for order ${order.id}...`);
        const detailResponse = await makeHostBillAPICall(orderDetailPayload);
        if (detailResponse.success) {
          orderDetails.push({
            order_id: order.id,
            order_number: order.number,
            details: detailResponse.data
          });
        }
      }
    }

    // Try different HostBill API calls to find available products
    const apiCalls = [
      { name: 'getProducts', call: 'getProducts' },
      { name: 'getProductList', call: 'getProductList' },
      { name: 'getOrderableItems', call: 'getOrderableItems' }
    ];

    const results = {};

    for (const apiCall of apiCalls) {
      const payload = {
        call: apiCall.call,
        api_id: HOSTBILL_CONFIG.apiId,
        api_key: HOSTBILL_CONFIG.apiKey
      };

      console.log(`🔍 Testing ${apiCall.name}...`);
      const response = await makeHostBillAPICall(payload);
      results[apiCall.name] = response;
    }

    console.log('🛍️ Testing multiple HostBill API calls...');

    // Get categories for better organization
    const categoriesPayload = {
      call: 'getCategories',
      api_id: HOSTBILL_CONFIG.apiId,
      api_key: HOSTBILL_CONFIG.apiKey
    };

    console.log('📂 Fetching categories from HostBill...');
    const categoriesResponse = await makeHostBillAPICall(categoriesPayload);

    // Prepare response with all API call results
    const result = {
      success: true,
      affiliate_id: affiliate_id || 'not specified',
      orders: ordersResponse.success ? ordersResponse.data.orders : null,
      order_details: orderDetails,
      api_calls: results,
      timestamp: new Date().toISOString()
    };

    // Log summary of all API calls
    console.log('📊 API Call Results Summary:');
    Object.entries(results).forEach(([name, response]) => {
      if (response.success && response.data.success) {
        console.log(`✅ ${name}: SUCCESS`);
        if (response.data.products) {
          console.log(`   📦 Found ${response.data.products.length} products`);
        }
      } else {
        console.log(`❌ ${name}: FAILED - ${response.data?.error || response.error || 'Unknown error'}`);
      }
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ Error fetching products:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}
