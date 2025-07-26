/**
 * HostBill Payment Modules API
 * GET /api/hostbill/payment-modules
 * EXCLUSIVELY routes through middleware - NO FALLBACK
 * Uses proven method from payment-methods-test test portal
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
    console.log('🔄 Getting payment modules EXCLUSIVELY via middleware:', middlewareUrl);

    // Use proven method from test portal: get payment modules via middleware
    const response = await fetch(`${middlewareUrl}/api/payment-modules`, {
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
      throw new Error(result.error || 'Failed to get payment modules from middleware');
    }

    console.log('✅ Payment modules retrieved EXCLUSIVELY via middleware:', {
      total: result.total,
      known: result.known,
      unknown: result.unknown,
      source: result.source
    });

    // Return middleware response
    res.json(result);

  } catch (error) {
    console.error('❌ CRITICAL: Failed to get payment modules via middleware - NO FALLBACK:', error);

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
