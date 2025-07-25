// Get all affiliates via middleware
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const middlewareUrl = process.env.MIDDLEWARE_URL || 'http://localhost:3005';
  
  try {
    console.log('🔍 Getting all affiliates via middleware...');
    
    const response = await fetch(`${middlewareUrl}/api/affiliates`);
    
    if (!response.ok) {
      throw new Error(`Middleware responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('✅ Affiliates loaded via middleware:', data);
    res.json({
      success: true,
      source: 'middleware',
      middleware_url: middlewareUrl,
      ...data
    });
    
  } catch (error) {
    console.error('❌ Failed to get affiliates via middleware:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      middleware_url: middlewareUrl,
      note: 'Make sure middleware server is running on port 3005'
    });
  }
}
