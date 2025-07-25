import https from 'https';
import { URLSearchParams } from 'url';

// Helper function to make HostBill API calls
function makeHostBillAPICall(url, payload) {
  const formData = new URLSearchParams();
  Object.keys(payload).forEach(key => {
    formData.append(key, payload[key]);
  });

  console.log(`🔗 HostBill API Call: ${payload.call}`);

  return new Promise((resolve, reject) => {
    const postData = formData.toString();

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 30000,
      rejectUnauthorized: false // Ignore SSL certificate errors
    };

    const req = https.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (parseError) {
          reject(new Error(`Failed to parse JSON: ${parseError.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

// API endpoint to get all products directly from HostBill
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    console.log('🔍 Fetching all products directly from HostBill...');

    // HostBill configuration with fallbacks
    const hostbillUrl = process.env.HOSTBILL_URL || 'https://vps.kabel1it.cz';
    const apiId = process.env.HOSTBILL_API_ID || 'adcdebb0e3b6f583052d';
    const apiKey = process.env.HOSTBILL_API_KEY || '341697c41aeb1c842f0d';

    console.log('🔧 Using HostBill config:', { hostbillUrl, apiId: apiId.substring(0, 8) + '...' });

    // Step 1: Get all orderpages
    const orderPagesPayload = {
      api_id: apiId,
      api_key: apiKey,
      call: 'getOrderPages'
    };

    const orderPagesData = await makeHostBillAPICall(`${hostbillUrl}/admin/api.php`, orderPagesPayload);

    if (!orderPagesData.success || !orderPagesData.categories) {
      throw new Error('Failed to get orderpages from HostBill');
    }

    console.log(`✅ Found ${orderPagesData.categories.length} orderpages`);

    // Step 2: Get products from all orderpages
    let allProducts = [];

    for (const orderpage of orderPagesData.categories) {
      try {
        const productsPayload = {
          api_id: apiId,
          api_key: apiKey,
          call: 'getProducts',
          id: orderpage.id
        };

        const productsData = await makeHostBillAPICall(`${hostbillUrl}/admin/api.php`, productsPayload);

        if (productsData.success && productsData.products) {
          // Convert products object to array and add orderpage info
          const products = Object.values(productsData.products).map(product => ({
            ...product,
            orderpage_id: orderpage.id,
            orderpage_name: orderpage.name,
            monthly_price: product.m,
            quarterly_price: product.q,
            semi_annually_price: product.s,
            annually_price: product.a
          }));
          
          allProducts = allProducts.concat(products);
          
          console.log(`✅ Loaded ${products.length} products from orderpage: ${orderpage.name}`);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to load products from orderpage ${orderpage.name}:`, error.message);
      }
    }

    if (allProducts.length === 0) {
      throw new Error('No products found in any orderpage');
    }

    console.log(`✅ Successfully loaded ${allProducts.length} total products from HostBill`);

    res.status(200).json({
      success: true,
      products: allProducts,
      totalProducts: allProducts.length,
      orderpages: orderPagesData.categories.map(cat => ({ id: cat.id, name: cat.name })),
      source: 'direct_hostbill',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching all products from HostBill:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      source: 'direct_hostbill',
      timestamp: new Date().toISOString()
    });
  }
}
