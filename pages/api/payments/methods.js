/**
 * Payment Methods API
 * GET /api/payments/methods
 * Returns available payment methods
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
    console.log('🔍 Fetching available payment methods...');

    // Query middleware for available payment methods
    const response = await fetch(`${middlewareUrl}/api/payments/methods`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Payment methods retrieved:', result);

      // Enhanced response with frontend-friendly data
      const enhancedMethods = result.methods.map(method => ({
        id: method.method,
        name: method.name,
        type: method.type,
        enabled: method.enabled,
        requiresRedirect: method.requiresRedirect,
        hostbillId: method.hostbillId,
        icon: getPaymentMethodIcon(method.method),
        description: getPaymentMethodDescription(method.method),
        processingTime: getPaymentMethodProcessingTime(method.method),
        fees: getPaymentMethodFees(method.method),
        minAmount: getPaymentMethodMinAmount(method.method),
        maxAmount: getPaymentMethodMaxAmount(method.method),
        supportedCurrencies: ['CZK', 'EUR', 'USD'],
        warning: method.warning || null
      }));

      res.status(200).json({
        success: true,
        message: 'Payment methods retrieved successfully',
        methods: enhancedMethods,
        total: enhancedMethods.length,
        enabled: enhancedMethods.filter(m => m.enabled).length,
        middleware_url: middlewareUrl,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('❌ Failed to get payment methods:', result);
      
      // Return fallback methods if middleware fails
      const fallbackMethods = getFallbackPaymentMethods();
      
      res.status(200).json({
        success: true,
        message: 'Payment methods retrieved (fallback)',
        methods: fallbackMethods,
        total: fallbackMethods.length,
        enabled: fallbackMethods.length,
        fallback: true,
        middleware_error: result.error,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ Error fetching payment methods:', error);
    
    // Return fallback methods on error
    const fallbackMethods = getFallbackPaymentMethods();
    
    res.status(200).json({
      success: true,
      message: 'Payment methods retrieved (fallback)',
      methods: fallbackMethods,
      total: fallbackMethods.length,
      enabled: fallbackMethods.length,
      fallback: true,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get payment method icon
 */
function getPaymentMethodIcon(method) {
  const icons = {
    card: '💳',
    paypal: '🅿️',
    banktransfer: '🏦',
    crypto: '₿',
    payu: '💰'
  };
  return icons[method] || '💰';
}

/**
 * Get payment method description
 */
function getPaymentMethodDescription(method) {
  const descriptions = {
    card: 'Visa, Mastercard, American Express',
    paypal: 'Rychlá a bezpečná platba přes PayPal',
    banktransfer: 'Převod z bankovního účtu',
    crypto: 'Bitcoin, Ethereum a další kryptoměny',
    payu: 'Rychlá a bezpečná platba přes PayU'
  };
  return descriptions[method] || 'Platební metoda';
}

/**
 * Get payment method processing time
 */
function getPaymentMethodProcessingTime(method) {
  const times = {
    card: 'Okamžitě',
    paypal: 'Okamžitě',
    banktransfer: '1-2 pracovní dny',
    crypto: '10-30 minut',
    payu: 'Okamžitě'
  };
  return times[method] || 'Neznámý';
}

/**
 * Get payment method fees
 */
function getPaymentMethodFees(method) {
  const fees = {
    card: { type: 'percentage', value: 2.9, fixed: 0 },
    paypal: { type: 'percentage', value: 3.4, fixed: 10 },
    banktransfer: { type: 'fixed', value: 0, fixed: 0 },
    crypto: { type: 'percentage', value: 1.0, fixed: 0 },
    payu: { type: 'percentage', value: 2.5, fixed: 0 }
  };
  return fees[method] || { type: 'unknown', value: 0, fixed: 0 };
}

/**
 * Get payment method minimum amount
 */
function getPaymentMethodMinAmount(method) {
  const minAmounts = {
    card: 50,
    paypal: 50,
    banktransfer: 100,
    crypto: 100,
    payu: 50
  };
  return minAmounts[method] || 0;
}

/**
 * Get payment method maximum amount
 */
function getPaymentMethodMaxAmount(method) {
  const maxAmounts = {
    card: 100000,
    paypal: 50000,
    banktransfer: 1000000,
    crypto: 500000,
    payu: 100000
  };
  return maxAmounts[method] || 999999;
}

/**
 * Get fallback payment methods when middleware is unavailable
 */
function getFallbackPaymentMethods() {
  return [
    {
      id: 'card',
      name: 'Platební karta',
      type: 'redirect',
      enabled: true,
      requiresRedirect: true,
      hostbillId: '1',
      icon: '💳',
      description: 'Visa, Mastercard, American Express',
      processingTime: 'Okamžitě',
      fees: { type: 'percentage', value: 2.9, fixed: 0 },
      minAmount: 50,
      maxAmount: 100000,
      supportedCurrencies: ['CZK', 'EUR', 'USD'],
      fallback: true
    },
    {
      id: 'banktransfer',
      name: 'Bankovní převod',
      type: 'manual',
      enabled: true,
      requiresRedirect: false,
      hostbillId: '3',
      icon: '🏦',
      description: 'Převod z bankovního účtu',
      processingTime: '1-2 pracovní dny',
      fees: { type: 'fixed', value: 0, fixed: 0 },
      minAmount: 100,
      maxAmount: 1000000,
      supportedCurrencies: ['CZK', 'EUR'],
      fallback: true
    }
  ];
}
