// Middleware health check API
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const middlewareUrl = process.env.MIDDLEWARE_URL || 'http://localhost:3005';
  
  try {
    console.log('🏥 Checking middleware health...');
    
    const response = await fetch(`${middlewareUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000 // 5 second timeout
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Middleware health check successful:', data);
      
      res.status(200).json({
        success: true,
        online: true,
        middleware_url: middlewareUrl,
        health_data: data,
        timestamp: new Date().toISOString()
      });
    } else {
      console.warn('⚠️ Middleware health check failed:', response.status);
      
      res.status(200).json({
        success: false,
        online: false,
        error: `Middleware responded with status: ${response.status}`,
        middleware_url: middlewareUrl,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ Middleware health check error:', error);
    
    res.status(200).json({
      success: false,
      online: false,
      error: 'Failed to connect to middleware',
      details: error.message,
      middleware_url: middlewareUrl,
      timestamp: new Date().toISOString()
    });
  }
}
