/**
 * Payment Notification API
 * POST /api/payments/notify
 * Handles payment notifications from payment gateways (webhooks)
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    console.log('🔔 Payment notification received:', {
      headers: req.headers,
      body: req.body,
      query: req.query
    });

    // Extract notification data
    const notificationData = {
      ...req.body,
      ...req.query,
      headers: req.headers,
      timestamp: new Date().toISOString()
    };

    // Determine payment gateway type from headers or data
    const gatewayType = determineGatewayType(req.headers, notificationData);
    
    console.log(`📡 Processing ${gatewayType} notification...`);

    let processedData;

    switch (gatewayType) {
      case 'stripe':
        processedData = await processStripeNotification(notificationData);
        break;
      case 'paypal':
        processedData = await processPayPalNotification(notificationData);
        break;
      case 'hostbill':
        processedData = await processHostBillNotification(notificationData);
        break;
      default:
        processedData = await processGenericNotification(notificationData);
    }

    if (processedData.success) {
      // Forward to middleware for processing
      await forwardToMiddleware(processedData);
      
      // Update local records if needed
      await updateLocalPaymentRecord(processedData);

      console.log('✅ Payment notification processed successfully');
      
      return res.status(200).json({
        success: true,
        message: 'Notification processed',
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error(processedData.error || 'Failed to process notification');
    }

  } catch (error) {
    console.error('❌ Payment notification processing failed:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Notification processing failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Determine payment gateway type from request
 */
function determineGatewayType(headers, data) {
  // Check headers for gateway-specific signatures
  if (headers['stripe-signature']) {
    return 'stripe';
  }
  
  if (headers['paypal-transmission-id']) {
    return 'paypal';
  }
  
  if (headers['user-agent']?.includes('HostBill')) {
    return 'hostbill';
  }

  // Check data for gateway-specific fields
  if (data.type && data.object === 'event') {
    return 'stripe';
  }
  
  if (data.event_type && data.resource) {
    return 'paypal';
  }
  
  if (data.hostbill_notification) {
    return 'hostbill';
  }

  return 'generic';
}

/**
 * Process Stripe webhook notification
 */
async function processStripeNotification(data) {
  try {
    console.log('💳 Processing Stripe notification...');
    
    const event = data;
    
    switch (event.type) {
      case 'payment_intent.succeeded':
        return {
          success: true,
          gateway: 'stripe',
          status: 'success',
          paymentId: event.data.object.id,
          amount: event.data.object.amount / 100, // Stripe uses cents
          currency: event.data.object.currency.toUpperCase(),
          transactionId: event.data.object.id,
          metadata: event.data.object.metadata
        };
        
      case 'payment_intent.payment_failed':
        return {
          success: true,
          gateway: 'stripe',
          status: 'failed',
          paymentId: event.data.object.id,
          error: event.data.object.last_payment_error?.message,
          metadata: event.data.object.metadata
        };
        
      default:
        console.log(`ℹ️ Unhandled Stripe event type: ${event.type}`);
        return {
          success: true,
          gateway: 'stripe',
          status: 'ignored',
          eventType: event.type
        };
    }
  } catch (error) {
    return {
      success: false,
      error: `Stripe notification processing failed: ${error.message}`
    };
  }
}

/**
 * Process PayPal webhook notification
 */
async function processPayPalNotification(data) {
  try {
    console.log('🅿️ Processing PayPal notification...');
    
    const eventType = data.event_type;
    const resource = data.resource;
    
    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        return {
          success: true,
          gateway: 'paypal',
          status: 'success',
          paymentId: resource.id,
          amount: parseFloat(resource.amount.value),
          currency: resource.amount.currency_code,
          transactionId: resource.id,
          metadata: resource.custom_id ? { orderId: resource.custom_id } : {}
        };
        
      case 'PAYMENT.CAPTURE.DENIED':
        return {
          success: true,
          gateway: 'paypal',
          status: 'failed',
          paymentId: resource.id,
          error: 'Payment was denied',
          metadata: resource.custom_id ? { orderId: resource.custom_id } : {}
        };
        
      default:
        console.log(`ℹ️ Unhandled PayPal event type: ${eventType}`);
        return {
          success: true,
          gateway: 'paypal',
          status: 'ignored',
          eventType: eventType
        };
    }
  } catch (error) {
    return {
      success: false,
      error: `PayPal notification processing failed: ${error.message}`
    };
  }
}

/**
 * Process HostBill webhook notification
 */
async function processHostBillNotification(data) {
  try {
    console.log('🏠 Processing HostBill notification...');
    
    return {
      success: true,
      gateway: 'hostbill',
      status: data.status || 'unknown',
      paymentId: data.payment_id,
      invoiceId: data.invoice_id,
      amount: parseFloat(data.amount || 0),
      currency: data.currency || 'CZK',
      transactionId: data.transaction_id,
      metadata: {
        orderId: data.order_id,
        clientId: data.client_id
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `HostBill notification processing failed: ${error.message}`
    };
  }
}

/**
 * Process generic webhook notification
 */
async function processGenericNotification(data) {
  try {
    console.log('🔧 Processing generic notification...');
    
    return {
      success: true,
      gateway: 'generic',
      status: data.status || 'unknown',
      paymentId: data.payment_id || data.paymentId,
      amount: parseFloat(data.amount || 0),
      currency: data.currency || 'CZK',
      transactionId: data.transaction_id || data.transactionId,
      metadata: data.metadata || {}
    };
  } catch (error) {
    return {
      success: false,
      error: `Generic notification processing failed: ${error.message}`
    };
  }
}

/**
 * Forward processed notification to middleware
 */
async function forwardToMiddleware(processedData) {
  const middlewareUrl = process.env.MIDDLEWARE_URL || 'http://localhost:3005';
  
  try {
    const response = await fetch(`${middlewareUrl}/api/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(processedData)
    });

    if (!response.ok) {
      throw new Error(`Middleware forwarding failed: ${response.status}`);
    }

    console.log('✅ Notification forwarded to middleware');
  } catch (error) {
    console.error('❌ Failed to forward to middleware:', error);
    // Don't throw - this is not critical for the webhook response
  }
}

/**
 * Update local payment record
 */
async function updateLocalPaymentRecord(processedData) {
  try {
    // Here you would update your local database/records
    // For now, just log the update
    console.log('📝 Updating local payment record:', {
      paymentId: processedData.paymentId,
      status: processedData.status,
      amount: processedData.amount,
      currency: processedData.currency
    });
  } catch (error) {
    console.error('❌ Failed to update local record:', error);
    // Don't throw - this is not critical for the webhook response
  }
}
