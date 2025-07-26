/**
 * Payment Status API
 * GET /api/payments/status?paymentId=xxx&invoiceId=xxx
 * Checks payment status
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
    const { paymentId, invoiceId, orderId } = req.query;

    console.log('🔍 Checking payment status...', {
      paymentId,
      invoiceId,
      orderId
    });

    // Validate required parameters
    if (!paymentId && !invoiceId && !orderId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: paymentId, invoiceId, or orderId',
        timestamp: new Date().toISOString()
      });
    }

    // Build query parameters for middleware
    const queryParams = new URLSearchParams();
    if (paymentId) queryParams.append('paymentId', paymentId);
    if (invoiceId) queryParams.append('invoiceId', invoiceId);
    if (orderId) queryParams.append('orderId', orderId);

    console.log('🔄 Querying middleware...');

    // Query middleware
    const response = await fetch(`${middlewareUrl}/api/payments/status?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Payment status retrieved:', result);

      // Enhanced response
      res.status(200).json({
        success: true,
        message: 'Payment status retrieved successfully',
        payment: {
          paymentId: result.payment?.paymentId,
          orderId: result.payment?.orderId,
          invoiceId: result.payment?.invoiceId,
          method: result.payment?.method,
          amount: result.payment?.amount,
          currency: result.payment?.currency,
          status: result.payment?.status,
          gateway: result.payment?.gateway,
          transactionId: result.payment?.transactionId,
          createdAt: result.payment?.createdAt,
          updatedAt: result.payment?.updatedAt,
          paidAt: result.payment?.paidAt
        },
        invoice: result.invoice ? {
          id: result.invoice.id,
          status: result.invoice.status,
          total: result.invoice.total,
          paid: result.invoice.paid,
          balance: result.invoice.balance
        } : null,
        order: result.order ? {
          id: result.order.id,
          status: result.order.status,
          number: result.order.number
        } : null,
        middleware_url: middlewareUrl,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('❌ Payment status check failed:', result);
      res.status(404).json({
        success: false,
        error: result.error || 'Payment not found',
        details: result.details || 'Payment status could not be retrieved',
        middleware_response: result,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ Error checking payment status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check payment status',
      details: error.message,
      middleware_url: middlewareUrl,
      timestamp: new Date().toISOString()
    });
  }
}
