// Get product mapping from middleware
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const middlewareUrl = process.env.MIDDLEWARE_URL || 'http://localhost:3005';
  
  try {
    console.log('🔍 Getting product mapping from middleware...');
    
    const response = await fetch(`${middlewareUrl}/api/product-mapping`);
    const data = await response.json();

    if (data.success) {
      console.log('✅ Product mapping retrieved from middleware:', data);
      res.status(200).json(data);
    } else {
      console.error('❌ Failed to get product mapping from middleware:', data);
      res.status(500).json({
        success: false,
        error: data.error || 'Failed to get product mapping from middleware',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ Error connecting to middleware:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to connect to middleware',
      details: error.message,
      middleware_url: middlewareUrl,
      timestamp: new Date().toISOString()
    });
  }
}
