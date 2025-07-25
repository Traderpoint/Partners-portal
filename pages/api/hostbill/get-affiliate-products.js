// API endpoint for getting products available to specific affiliate with commission info
// Combines multiple HostBill API calls: getAffiliate, getAffiliateCommisionPlans, getOrderPages, getProducts

// HostBill configuration
const HOSTBILL_CONFIG = {
  domain: process.env.NEXT_PUBLIC_HOSTBILL_DOMAIN || 'vps.kabel1it.cz',
  apiId: process.env.HOSTBILL_API_ID || 'adcdebb0e3b6f583052d',
  apiKey: process.env.HOSTBILL_API_KEY || '341697c41aeb1c842f0d'
};

// Helper function to make HostBill API calls using Node.js https module
async function makeHostBillAPICall(payload) {
  const https = require('https');
  const { URLSearchParams } = require('url');

  const url = `https://${HOSTBILL_CONFIG.domain}/admin/api.php`;

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

          if (!jsonData.success) {
            console.error(`❌ HostBill API Error (${payload.call}):`, jsonData);
            resolve({ success: false, error: jsonData.error || 'Unknown API error', data: null });
          } else {
            console.log(`✅ HostBill API Success (${payload.call})`);
            resolve({ success: true, data: jsonData, error: null });
          }
        } catch (parseError) {
          console.error(`❌ HostBill API Parse Error (${payload.call}):`, parseError);
          resolve({ success: false, error: 'Failed to parse response', data: null });
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ HostBill API Exception (${payload.call}):`, error);
      resolve({ success: false, error: error.message, data: null });
    });

    req.on('timeout', () => {
      req.destroy();
      console.error(`❌ HostBill API Timeout (${payload.call})`);
      resolve({ success: false, error: 'Request timeout', data: null });
    });

    req.write(postData);
    req.end();
  });
}

// Parse commission plans to extract applicable products
function parseCommissionPlans(commissionPlans, affiliateId) {
  const applicableProducts = new Set();
  const productCommissions = {};

  if (!commissionPlans || !commissionPlans.commisions) {
    return { applicableProducts: [], productCommissions: {} };
  }

  commissionPlans.commisions.forEach(plan => {
    if (plan.applicable_products) {
      // Parse applicable_products string (comma-separated IDs)
      const productIds = plan.applicable_products
        .split(',')
        .map(id => id.trim())
        .filter(id => id && !id.startsWith('-')); // Filter out negative IDs (exclusions)

      productIds.forEach(productId => {
        applicableProducts.add(productId);
        productCommissions[productId] = {
          plan_id: plan.id,
          plan_name: plan.name,
          type: plan.type,
          rate: plan.rate,
          recurring: plan.recurring === '1'
        };
      });
    }
  });

  return {
    applicableProducts: Array.from(applicableProducts),
    productCommissions
  };
}

// Calculate commission amount
function calculateCommission(price, commissionInfo) {
  if (!commissionInfo || !price) return 0;

  const numericPrice = parseFloat(price);
  const numericRate = parseFloat(commissionInfo.rate);

  if (commissionInfo.type === 'Percent') {
    return (numericPrice * numericRate / 100).toFixed(2);
  } else if (commissionInfo.type === 'Fixed') {
    return numericRate.toFixed(2);
  }

  return 0;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { affiliate_id, mode = 'affiliate' } = req.query;

  if (!affiliate_id) {
    return res.status(400).json({
      success: false,
      error: 'Missing affiliate_id parameter'
    });
  }

  console.log(`🎯 Getting products for affiliate ID: ${affiliate_id}, mode: ${mode}`);

  try {
    // Step 1: Get affiliate details
    console.log('📋 Step 1: Getting affiliate details...');
    const affiliatePayload = {
      call: 'getAffiliate',
      api_id: HOSTBILL_CONFIG.apiId,
      api_key: HOSTBILL_CONFIG.apiKey,
      id: affiliate_id
    };

    const affiliateResponse = await makeHostBillAPICall(affiliatePayload);
    if (!affiliateResponse.success) {
      return res.status(400).json({
        success: false,
        error: `Failed to get affiliate details: ${affiliateResponse.error}`,
        step: 'getAffiliate'
      });
    }

    // Step 2: Get commission plans
    console.log('💰 Step 2: Getting commission plans...');
    const commissionPayload = {
      call: 'getAffiliateCommisionPlans',
      api_id: HOSTBILL_CONFIG.apiId,
      api_key: HOSTBILL_CONFIG.apiKey
    };

    const commissionResponse = await makeHostBillAPICall(commissionPayload);
    if (!commissionResponse.success) {
      return res.status(400).json({
        success: false,
        error: `Failed to get commission plans: ${commissionResponse.error}`,
        step: 'getAffiliateCommisionPlans'
      });
    }

    // Parse commission plans
    const { applicableProducts, productCommissions } = parseCommissionPlans(
      commissionResponse.data, 
      affiliate_id
    );

    console.log(`💡 Found ${applicableProducts.length} products with commissions`);

    // Step 3: Get order pages (categories)
    console.log('📂 Step 3: Getting product categories...');
    const categoriesPayload = {
      call: 'getOrderPages',
      api_id: HOSTBILL_CONFIG.apiId,
      api_key: HOSTBILL_CONFIG.apiKey
    };

    const categoriesResponse = await makeHostBillAPICall(categoriesPayload);
    if (!categoriesResponse.success) {
      return res.status(400).json({
        success: false,
        error: `Failed to get categories: ${categoriesResponse.error}`,
        step: 'getOrderPages'
      });
    }

    // Step 4: Get products from each category
    console.log('🛍️ Step 4: Getting products from categories...');
    const allProducts = [];
    const categories = categoriesResponse.data.categories || [];

    for (const category of categories) {
      console.log(`📦 Getting products from category: ${category.name} (ID: ${category.id})`);
      
      const productsPayload = {
        call: 'getProducts',
        api_id: HOSTBILL_CONFIG.apiId,
        api_key: HOSTBILL_CONFIG.apiKey,
        id: category.id,
        visible: 1 // Only visible products
      };

      const productsResponse = await makeHostBillAPICall(productsPayload);
      
      if (productsResponse.success && productsResponse.data.products) {
        const categoryProducts = Object.values(productsResponse.data.products);
        
        // Filter products based on mode
        let filteredProducts;
        if (mode === 'all') {
          // All products mode - return all products with commission info if available
          filteredProducts = categoryProducts;
        } else {
          // Affiliate mode - only products that have commissions for this affiliate
          filteredProducts = categoryProducts.filter(product =>
            applicableProducts.includes(product.id)
          );
        }

        // Add category info and commission details to each product
        filteredProducts.forEach(product => {
          const commissionInfo = productCommissions[product.id];

          // For all mode, provide default commission info if not available
          const finalCommissionInfo = commissionInfo || (mode === 'all' ? {
            plan_id: null,
            plan_name: 'No commission plan',
            type: 'Percent',
            rate: '0',
            recurring: false
          } : null);

          allProducts.push({
            ...product,
            category: {
              id: category.id,
              name: category.name,
              description: category.description
            },
            commission: finalCommissionInfo ? {
              ...finalCommissionInfo,
              monthly_amount: calculateCommission(product.m, finalCommissionInfo),
              quarterly_amount: calculateCommission(product.q, finalCommissionInfo),
              semiannually_amount: calculateCommission(product.s, finalCommissionInfo),
              annually_amount: calculateCommission(product.a, finalCommissionInfo),
              has_commission: !!commissionInfo
            } : null
          });
        });

        console.log(`✅ Found ${filteredProducts.length} products in ${category.name} (mode: ${mode})`);
      }
    }

    // Prepare final response
    const result = {
      success: true,
      mode: mode,
      affiliate: affiliateResponse.data.affiliate,
      commission_plans: commissionResponse.data.commisions,
      categories: categories,
      products: allProducts,
      summary: {
        total_categories: categories.length,
        total_products: allProducts.length,
        total_applicable_products: applicableProducts.length,
        products_with_commission: allProducts.filter(p => p.commission?.has_commission).length,
        products_without_commission: allProducts.filter(p => !p.commission?.has_commission).length
      },
      note: mode === 'all'
        ? 'All products from all categories - some may not have commission plans for this affiliate'
        : 'Only products with commission plans for this affiliate',
      timestamp: new Date().toISOString()
    };

    console.log(`🎉 Successfully retrieved ${allProducts.length} products for affiliate ${affiliate_id} (mode: ${mode})`);
    
    res.status(200).json(result);

  } catch (error) {
    console.error('❌ Error in get-affiliate-products:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}
