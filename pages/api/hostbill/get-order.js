// Get order details from HostBill to check order_number
import https from 'https';
import { URL } from 'url';
import { HOSTBILL_CONFIG } from '../../../lib/hostbill-config.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { order_id } = req.body;

  if (!order_id) {
    return res.status(400).json({ error: 'order_id is required' });
  }

  console.log('🔍 Getting order details for order_id:', order_id);

  try {
    const payload = {
      call: 'getOrders',
      api_id: HOSTBILL_CONFIG.apiId,
      api_key: HOSTBILL_CONFIG.apiKey,
      limit: 10
    };

    const response = await makeHostBillAPICall(payload);
    
    console.log('📥 HostBill getOrder response:', JSON.stringify(response, null, 2));

    res.status(200).json({
      success: true,
      order_id: order_id,
      response: response
    });

  } catch (error) {
    console.error('❌ Error getting order:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// Helper function to make HostBill API calls
async function makeHostBillAPICall(payload) {
  try {
    const postData = new URLSearchParams(payload).toString();
    const apiUrl = new URL(HOSTBILL_CONFIG.apiUrl);

    console.log('🌐 Making API call to:', apiUrl.toString());
    console.log('📤 Payload:', payload);

    const response = await new Promise((resolve, reject) => {
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

      req.setTimeout(15000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.write(postData);
      req.end();
    });

    console.log('📥 API Response status:', response.statusCode);
    console.log('📥 API Response body (first 500 chars):', response.body.substring(0, 500));

    // Parse response
    try {
      const responseData = JSON.parse(response.body);
      return {
        success: true,
        data: responseData
      };
    } catch (parseError) {
      return {
        success: false,
        error: 'Invalid JSON response',
        raw_response: response.body.substring(0, 1000)
      };
    }

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
