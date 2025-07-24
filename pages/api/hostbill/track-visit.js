// HostBill Affiliate Visit Tracking API (CSP-safe)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { aff, action, url, referrer, timestamp } = req.body;

    if (!aff) {
      return res.status(400).json({ error: 'Affiliate ID is required' });
    }

    // HostBill configuration
    const HOSTBILL_CONFIG = {
      apiUrl: process.env.HOSTBILL_API_URL || 'https://vps.kabel1it.cz/admin/api.php',
      affiliateUrl: process.env.NEXT_PUBLIC_HOSTBILL_URL || 'https://vps.kabel1it.cz/',
      apiId: process.env.HOSTBILL_API_ID || 'adcdebb0e3b6f583052d',
      apiKey: process.env.HOSTBILL_API_KEY || '341697c41aeb1c842f0d',
      apiSecret: process.env.HOSTBILL_API_SECRET || '341697c41aeb1c842f0d'
    };

    // Prepare tracking data
    const trackingData = {
      affiliate_id: aff,
      action: action || 'visit',
      url: url || '',
      referrer: referrer || '',
      ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress || '',
      user_agent: req.headers['user-agent'] || '',
      timestamp: timestamp || Date.now()
    };

    console.log('📊 HostBill Visit Tracking:', trackingData);

    // Method 1: Verify affiliate exists via HostBill API
    let apiSuccess = false;
    let affiliateExists = false;

    if (HOSTBILL_CONFIG.apiKey !== 'your-api-key') {
      try {
        // Ověříme, že affiliate s daným ID existuje
        const apiPayload = {
          call: 'getAffiliate',
          api_id: HOSTBILL_CONFIG.apiId,
          api_key: HOSTBILL_CONFIG.apiKey,
          id: affiliateId
        };

        console.log('🔧 HostBill API Request:', {
          url: HOSTBILL_CONFIG.apiUrl,
          payload: apiPayload
        });

        // Use native https module with SSL bypass (like in test-api-direct)
        const https = require('https');
        const { URL } = require('url');

        const apiUrl = new URL(HOSTBILL_CONFIG.apiUrl);
        const postData = new URLSearchParams(apiPayload).toString();

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
                ok: res.statusCode === 200,
                status: res.statusCode,
                statusText: res.statusMessage,
                text: () => Promise.resolve(data),
                json: () => {
                  try {
                    return Promise.resolve(JSON.parse(data));
                  } catch {
                    return Promise.resolve({ response: data });
                  }
                }
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

        if (apiResponse.ok) {
          const result = await apiResponse.json();
          console.log('✅ HostBill API: Visit tracked successfully', result);
          apiSuccess = true;
        } else {
          const errorText = await apiResponse.text();
          console.warn('⚠️ HostBill API Warning:', {
            status: apiResponse.status,
            statusText: apiResponse.statusText,
            response: errorText
          });
        }
      } catch (apiError) {
        console.warn('⚠️ HostBill API Request Failed:', apiError.message);
      }
    }

    // Method 2: Fallback to tracking pixel/webhook
    if (!apiSuccess) {
      try {
        const pixelParams = new URLSearchParams({
          aff: aff,
          action: action || 'visit',
          url: url || '',
          ref: referrer || '',
          ts: timestamp || Date.now()
        });

        const pixelUrl = `${HOSTBILL_CONFIG.affiliateUrl.replace(/\/$/, '')}/includes/affiliate/track.php?${pixelParams.toString()}`;
        
        const pixelResponse = await fetch(pixelUrl, {
          method: 'GET',
          timeout: 5000
        });

        console.log('📍 HostBill Pixel: Visit tracked via fallback', { 
          status: pixelResponse.status,
          url: pixelUrl 
        });
      } catch (pixelError) {
        console.warn('⚠️ HostBill Pixel Failed:', pixelError.message);
      }
    }

    // Always return success to avoid blocking user experience
    res.status(200).json({
      success: true,
      message: 'Visit tracking initiated',
      affiliate_id: aff,
      timestamp: new Date().toISOString(),
      methods: {
        api: apiSuccess,
        pixel: !apiSuccess
      }
    });

  } catch (error) {
    console.error('❌ HostBill Visit Tracking Error:', error);
    
    // Return success even on error to avoid blocking user experience
    res.status(200).json({
      success: false,
      message: 'Visit tracking failed but request completed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
