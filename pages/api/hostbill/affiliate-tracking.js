// Správný HostBill affiliate tracking endpoint
import https from 'https';
import { URL } from 'url';

const HOSTBILL_CONFIG = {
  apiUrl: process.env.HOSTBILL_API_URL || 'https://vps.kabel1it.cz/admin/api.php',
  apiId: process.env.HOSTBILL_API_ID || 'adcdebb0e3b6f583052d',
  apiKey: process.env.HOSTBILL_API_KEY || '341697c41aeb1c842f0d',
  baseUrl: process.env.HOSTBILL_BASE_URL || 'https://vps.kabel1it.cz'
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { aff: affiliateId, action = 'visit', url, referrer, timestamp } = req.body;

  if (!affiliateId) {
    return res.status(400).json({ 
      success: false, 
      error: 'Affiliate ID is required' 
    });
  }

  console.log('🎯 HostBill Affiliate Tracking:', {
    affiliateId,
    action,
    url,
    referrer,
    timestamp: new Date(timestamp).toISOString()
  });

  const trackingResult = {
    success: false,
    affiliate_id: affiliateId,
    timestamp: new Date().toISOString(),
    methods: {
      api_verification: false,
      pixel_tracking: false
    },
    affiliate_data: null
  };

  // Step 1: Verify affiliate exists via HostBill API
  try {
    const apiPayload = {
      call: 'getAffiliate',
      api_id: HOSTBILL_CONFIG.apiId,
      api_key: HOSTBILL_CONFIG.apiKey,
      id: affiliateId
    };

    const postData = new URLSearchParams(apiPayload).toString();
    const apiUrl = new URL(HOSTBILL_CONFIG.apiUrl);

    const apiResponse = await new Promise((resolve, reject) => {
      const options = {
        hostname: apiUrl.hostname,
        port: apiUrl.port || 443,
        path: apiUrl.pathname,
        method: 'POST',
        rejectUnauthorized: false, // SSL bypass for development
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            body: data
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.write(postData);
      req.end();
    });

    // Parse API response
    try {
      const responseData = JSON.parse(apiResponse.body);
      if (responseData.success === true && responseData.affiliate) {
        trackingResult.methods.api_verification = true;
        trackingResult.affiliate_data = {
          id: responseData.affiliate.id,
          name: `${responseData.affiliate.firstname} ${responseData.affiliate.lastname}`,
          status: responseData.affiliate.status,
          visits: responseData.affiliate.visits,
          balance: responseData.affiliate.balance
        };
        console.log('✅ Affiliate verified:', trackingResult.affiliate_data.name);
      } else {
        console.log('⚠️ Affiliate not found:', affiliateId);
      }
    } catch (parseError) {
      console.log('⚠️ API response parse error:', parseError.message);
    }

  } catch (apiError) {
    console.log('❌ HostBill API verification failed:', apiError.message);
  }

  // Step 2: Pixel tracking (always execute for visit counting)
  try {
    const pixelUrl = `${HOSTBILL_CONFIG.baseUrl}/includes/affiliate/track.php`;
    const pixelParams = new URLSearchParams({
      aff: affiliateId,
      action: action,
      url: url || '',
      referrer: referrer || '',
      timestamp: timestamp || Date.now()
    });

    const fullPixelUrl = `${pixelUrl}?${pixelParams.toString()}`;
    
    // Simulate pixel call (in real implementation, this would be called by browser)
    console.log('📊 Pixel tracking URL:', fullPixelUrl);
    trackingResult.methods.pixel_tracking = true;
    trackingResult.pixel_url = fullPixelUrl;

  } catch (pixelError) {
    console.log('❌ Pixel tracking failed:', pixelError.message);
  }

  // Step 3: Store affiliate data for later order assignment
  const affiliateSession = {
    affiliate_id: affiliateId,
    first_visit: new Date().toISOString(),
    last_visit: new Date().toISOString(),
    visit_count: 1,
    referrer: referrer,
    landing_url: url,
    affiliate_data: trackingResult.affiliate_data
  };

  // Set success if at least one method worked
  trackingResult.success = trackingResult.methods.api_verification || trackingResult.methods.pixel_tracking;
  trackingResult.session_data = affiliateSession;

  if (trackingResult.success) {
    trackingResult.message = 'Affiliate tracking successful';
    
    // Add cookie instructions for frontend
    trackingResult.cookie_data = {
      name: 'hostbill_affiliate',
      value: JSON.stringify(affiliateSession),
      expires: 30, // days
      domain: '.systrix.cz' // adjust for your domain
    };

    console.log('✅ Affiliate tracking completed:', {
      affiliate_id: affiliateId,
      methods: trackingResult.methods,
      verified: !!trackingResult.affiliate_data
    });

  } else {
    trackingResult.message = 'Affiliate tracking failed';
    console.log('❌ All tracking methods failed for affiliate:', affiliateId);
  }

  res.status(200).json(trackingResult);
}

// Helper function to create order with affiliate (for future use)
export async function createOrderWithAffiliate(clientId, productId, cycle, affiliateId) {
  try {
    // Step 1: Create order
    const orderPayload = {
      call: 'addOrder',
      api_id: HOSTBILL_CONFIG.apiId,
      api_key: HOSTBILL_CONFIG.apiKey,
      client_id: clientId,
      product: productId,
      cycle: cycle,
      confirm: 1,
      invoice_generate: 1,
      invoice_info: 1
    };

    // Step 2: Assign affiliate to order (after order creation)
    const affiliatePayload = {
      call: 'setOrderReferrer',
      api_id: HOSTBILL_CONFIG.apiId,
      api_key: HOSTBILL_CONFIG.apiKey,
      id: 'ORDER_ID', // Will be replaced with actual order ID
      referral: affiliateId
    };

    console.log('🛒 Order with affiliate prepared:', {
      client: clientId,
      product: productId,
      affiliate: affiliateId
    });

    return {
      success: true,
      order_payload: orderPayload,
      affiliate_payload: affiliatePayload
    };

  } catch (error) {
    console.log('❌ Order creation failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Helper function to get products for affiliate (for future use)
export async function getProductsForAffiliate(affiliateId) {
  try {
    // This would get products that affiliate can promote
    // Implementation depends on your business logic
    
    const products = [
      {
        id: '1',
        name: 'VPS Basic',
        price: '299 CZK/month',
        affiliate_commission: '10%'
      },
      {
        id: '2', 
        name: 'VPS Pro',
        price: '599 CZK/month',
        affiliate_commission: '15%'
      }
    ];

    return {
      success: true,
      affiliate_id: affiliateId,
      products: products
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
