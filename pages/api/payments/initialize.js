/**
 * Payment Initialization API
 * POST /api/payments/initialize
 * Initializes payment for an order/invoice
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
    console.log('🚀 Initializing payment...');
    console.log('📤 Payment data:', JSON.stringify(req.body, null, 2));

    // Validate required fields
    const { orderId, invoiceId, method, amount, currency = 'CZK', customerData } = req.body;

    if (!orderId || !invoiceId || !method || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: orderId, invoiceId, method, amount',
        timestamp: new Date().toISOString()
      });
    }

    // Validate payment method
    const supportedMethods = ['card', 'paypal', 'banktransfer', 'crypto', 'payu'];
    if (!supportedMethods.includes(method)) {
      return res.status(400).json({
        success: false,
        error: `Unsupported payment method: ${method}. Supported: ${supportedMethods.join(', ')}`,
        timestamp: new Date().toISOString()
      });
    }

    // Validate amount
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount',
        timestamp: new Date().toISOString()
      });
    }

    // Prepare payment data for middleware
    const paymentData = {
      orderId,
      invoiceId,
      method,
      amount: numericAmount,
      currency,
      customerData: req.body.customerData || {},
      metadata: {
        source: 'cloudvps_frontend',
        userAgent: req.headers['user-agent'],
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        timestamp: new Date().toISOString()
      }
    };

    console.log('🔄 Sending to middleware:', JSON.stringify(paymentData, null, 2));

    // Try middleware first
    try {
      const response = await fetch(`${middlewareUrl}/api/payments/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Payment initialized via middleware:', result);

        return res.status(200).json({
          success: true,
          message: 'Payment initialized successfully',
          paymentId: result.paymentId,
          orderId: result.orderId,
          invoiceId: result.invoiceId,
          method: result.method,
          amount: result.amount,
          currency: result.currency,
          status: result.status,
          redirectRequired: result.redirectRequired,
          paymentUrl: result.paymentUrl,
          instructions: result.instructions,
          gateway: {
            id: result.gateway?.id,
            name: result.gateway?.name,
            type: result.gateway?.type
          },
          expiresAt: result.expiresAt,
          source: 'middleware',
          timestamp: new Date().toISOString()
        });
      } else {
        console.warn('⚠️ Middleware payment initialization failed:', result.error);
        throw new Error(result.error || 'Middleware failed');
      }
    } catch (middlewareError) {
      console.warn('⚠️ Middleware not available, using direct fallback:', middlewareError.message);

      // Direct fallback implementation
      const fallbackResult = await initializePaymentDirect(paymentData);

      return res.status(200).json({
        success: true,
        message: 'Payment initialized successfully (direct fallback)',
        ...fallbackResult,
        source: 'direct_fallback',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ Error initializing payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize payment',
      details: error.message,
      middleware_url: middlewareUrl,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Direct payment initialization fallback
 */
async function initializePaymentDirect(paymentData) {
  const { orderId, invoiceId, method, amount, currency } = paymentData;

  console.log('🎯 Initializing payment directly (fallback)...');

  // Check if payment method is active before proceeding
  try {
    const methodsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/payments/methods`);
    const methodsData = await methodsResponse.json();

    if (methodsData.success) {
      const activeMethod = methodsData.methods.find(m => m.id === method);
      if (!activeMethod || !activeMethod.enabled) {
        throw new Error(`Payment method '${method}' is not active in HostBill configuration`);
      }
      console.log(`✅ Payment method ${method} is active, proceeding with direct fallback`);
    }
  } catch (validationError) {
    console.error('❌ Payment method validation failed:', validationError.message);
    throw validationError;
  }

  const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const hostbillUrl = process.env.HOSTBILL_URL || 'https://vps.kabel1it.cz';
  const returnUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment-return`;
  const cancelUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment-cancel`;

  let result = {
    paymentId,
    orderId,
    invoiceId,
    method,
    amount,
    currency,
    status: 'initialized'
  };

  switch (method.toLowerCase()) {
    case 'card':
    case 'stripe':
      // For card payments, redirect to HostBill payment page
      result.redirectRequired = true;
      result.paymentUrl = `${hostbillUrl}/cart.php?a=checkout&invoiceid=${invoiceId}&paymentmethod=stripe&return=${encodeURIComponent(returnUrl)}&cancel=${encodeURIComponent(cancelUrl)}`;
      break;

    case 'paypal':
      // For PayPal, redirect to HostBill PayPal gateway
      result.redirectRequired = true;
      result.paymentUrl = `${hostbillUrl}/cart.php?a=checkout&invoiceid=${invoiceId}&paymentmethod=paypal&return=${encodeURIComponent(returnUrl)}&cancel=${encodeURIComponent(cancelUrl)}`;
      break;

    case 'banktransfer':
    case 'bank':
      // For bank transfer, provide manual instructions
      result.redirectRequired = false;
      result.instructions = {
        method: 'Bankovní převod',
        amount: `${amount} ${currency}`,
        accountNumber: '123456789/0100',
        bankName: 'Komerční banka',
        variableSymbol: invoiceId,
        specificSymbol: orderId.replace(/[^0-9]/g, '').slice(-10),
        message: `Platba za objednávku ${orderId}`,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('cs-CZ')
      };
      break;

    case 'crypto':
    case 'bitcoin':
      // For crypto, redirect to crypto payment gateway
      result.redirectRequired = true;
      result.paymentUrl = `${hostbillUrl}/cart.php?a=checkout&invoiceid=${invoiceId}&paymentmethod=bitcoin&return=${encodeURIComponent(returnUrl)}&cancel=${encodeURIComponent(cancelUrl)}`;
      break;

    case 'payu':
      // For PayU, redirect to PayU payment gateway
      result.redirectRequired = true;
      result.paymentUrl = `${hostbillUrl}/cart.php?a=checkout&invoiceid=${invoiceId}&paymentmethod=payu&return=${encodeURIComponent(returnUrl)}&cancel=${encodeURIComponent(cancelUrl)}`;
      break;

    default:
      // Generic payment method
      result.redirectRequired = true;
      result.paymentUrl = `${hostbillUrl}/cart.php?a=checkout&invoiceid=${invoiceId}&paymentmethod=${method}&return=${encodeURIComponent(returnUrl)}&cancel=${encodeURIComponent(cancelUrl)}`;
  }

  console.log('✅ Direct payment initialized:', {
    paymentId,
    method,
    redirectRequired: result.redirectRequired,
    paymentUrl: result.paymentUrl || 'N/A'
  });

  return result;
}
