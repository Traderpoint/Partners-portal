// Get affiliate products via middleware
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { affiliate_id, mode = 'affiliate' } = req.query;

  if (!affiliate_id) {
    return res.status(400).json({
      success: false,
      error: 'affiliate_id parameter is required'
    });
  }

  const middlewareUrl = process.env.MIDDLEWARE_URL || 'http://localhost:3005';

  try {
    console.log(`🔍 Getting products for affiliate ${affiliate_id} via middleware (mode: ${mode})...`);

    const response = await fetch(`${middlewareUrl}/api/affiliate/${affiliate_id}/products?mode=${mode}`);
    
    if (!response.ok) {
      throw new Error(`Middleware responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('✅ Affiliate products loaded via middleware:', data);
    res.json({
      success: true,
      source: 'middleware',
      middleware_url: middlewareUrl,
      affiliate_id: affiliate_id,
      ...data
    });
    
  } catch (error) {
    console.error('❌ Failed to get affiliate products via middleware:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      middleware_url: middlewareUrl,
      affiliate_id: affiliate_id,
      note: 'Make sure middleware server is running on port 3005'
    });
  }
}
