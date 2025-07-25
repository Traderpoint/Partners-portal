// Test endpoint for middleware affiliate functionality
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const middlewareUrl = process.env.MIDDLEWARE_URL || 'http://localhost:3005';
  
  try {
    console.log('🔍 Testing middleware affiliate functionality...');
    
    // Test 1: Health check
    const healthResponse = await fetch(`${middlewareUrl}/health`);
    const healthData = await healthResponse.json();
    
    // Test 2: Get affiliate info
    const affiliateResponse = await fetch(`${middlewareUrl}/api/affiliate/2`);
    const affiliateData = await affiliateResponse.json();

    // Test 3: Get affiliate products
    const productsResponse = await fetch(`${middlewareUrl}/api/affiliate/2/products`);
    const productsData = await productsResponse.json();
    
    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      middleware_url: middlewareUrl,
      tests: {
        health_check: {
          status: healthResponse.status,
          success: healthResponse.ok,
          data: healthData
        },
        affiliate_info: {
          status: affiliateResponse.status,
          success: affiliateResponse.ok,
          data: affiliateData
        },
        affiliate_products: {
          status: productsResponse.status,
          success: productsResponse.ok,
          data: productsData
        }
      }
    };
    
    console.log('✅ Middleware tests completed:', result);
    res.json(result);
    
  } catch (error) {
    console.error('❌ Middleware test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      middleware_url: middlewareUrl,
      note: 'Make sure middleware server is running on port 3005'
    });
  }
}
