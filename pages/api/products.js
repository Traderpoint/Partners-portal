/**
 * Products API
 * GET /api/products
 * EXCLUSIVELY routes through middleware - NO FALLBACK
 * Uses proven method from middleware-affiliate-products test portal
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  const middlewareUrl = process.env.MIDDLEWARE_URL || 'http://localhost:3005';

  try {
    console.log('🔄 Getting products EXCLUSIVELY via middleware:', middlewareUrl);

    // Use proven method from test portal: get all products via middleware
    const response = await fetch(`${middlewareUrl}/api/products/all`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Middleware error (${response.status}): ${errorText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to get products from middleware');
    }

    console.log('✅ Products retrieved EXCLUSIVELY via middleware:', {
      total: result.total,
      source: result.source
    });

    // Return middleware response
    res.json(result);

  } catch (error) {
    console.error('❌ CRITICAL: Failed to get products via middleware - NO FALLBACK:', error);

    // NO FALLBACK - middleware communication is mandatory
    res.status(500).json({
      success: false,
      error: 'Middleware communication failed',
      details: error.message,
      middleware_url: middlewareUrl,
      note: 'All communication must go through middleware - ensure middleware is running',
      timestamp: new Date().toISOString()
    });
  }
}
