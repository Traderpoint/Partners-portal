/**
 * Payment Callback/Webhook API
 * POST /api/payments/callback
 * Handles payment gateway callbacks and webhooks
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  const middlewareUrl = process.env.MIDDLEWARE_URL || 'http://localhost:3005';

  try {
    console.log('🔔 Payment callback received...');
    console.log('📤 Callback data:', JSON.stringify(req.body, null, 2));
    console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));

    // Extract callback data
    const callbackData = {
      ...req.body,
      headers: req.headers,
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      timestamp: new Date().toISOString()
    };

    // Basic validation
    if (!callbackData.invoiceId && !callbackData.invoice_id) {
      console.warn('⚠️ Callback missing invoice ID');
      return res.status(400).json({
        success: false,
        error: 'Missing invoice ID in callback',
        timestamp: new Date().toISOString()
      });
    }

    // Normalize invoice ID field
    if (callbackData.invoice_id && !callbackData.invoiceId) {
      callbackData.invoiceId = callbackData.invoice_id;
    }

    console.log('🔄 Forwarding to middleware...');

    // Forward to middleware for processing
    const response = await fetch(`${middlewareUrl}/api/payments/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': req.headers['x-forwarded-for'] || '',
        'User-Agent': req.headers['user-agent'] || ''
      },
      body: JSON.stringify(callbackData)
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Payment callback processed successfully:', result);

      // Return success response to payment gateway
      res.status(200).json({
        success: true,
        message: 'Callback processed successfully',
        processingId: result.processingId,
        status: result.status,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('❌ Payment callback processing failed:', result);
      
      // Still return 200 to prevent gateway retries for invalid data
      res.status(200).json({
        success: false,
        message: result.message || 'Callback processing failed',
        error: result.error,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ Error processing payment callback:', error);
    
    // Return 200 to prevent gateway retries
    res.status(200).json({
      success: false,
      error: 'Failed to process callback',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
