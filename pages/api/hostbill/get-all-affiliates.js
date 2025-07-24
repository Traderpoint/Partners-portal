// API endpoint for getting all affiliates from HostBill
// Uses HostBill API call: getAffiliates

// HostBill configuration
const HOSTBILL_CONFIG = {
  domain: process.env.NEXT_PUBLIC_HOSTBILL_DOMAIN || 'vps.kabel1it.cz',
  apiId: process.env.HOSTBILL_API_ID || 'adcdebb0e3b6f583052d',
  apiKey: process.env.HOSTBILL_API_KEY || '341697c41aeb1c842f0d'
};

// Helper function to make HostBill API calls using Node.js https module
async function makeHostBillAPICall(payload) {
  const https = require('https');
  const { URLSearchParams } = require('url');
  
  const url = `https://${HOSTBILL_CONFIG.domain}/admin/api.php`;
  
  const formData = new URLSearchParams();
  Object.keys(payload).forEach(key => {
    formData.append(key, payload[key]);
  });

  console.log(`🔗 HostBill API Call: ${payload.call}`);

  return new Promise((resolve, reject) => {
    const postData = formData.toString();
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 30000,
      rejectUnauthorized: false // Ignore SSL certificate errors
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log(`🔍 HostBill API Response (${payload.call}):`, JSON.stringify(jsonData, null, 2));

          if (!jsonData.success) {
            console.error(`❌ HostBill API Error (${payload.call}):`, jsonData);
            resolve({ success: false, error: jsonData.error || jsonData.info || 'Unknown API error', data: jsonData });
          } else {
            console.log(`✅ HostBill API Success (${payload.call})`);
            resolve({ success: true, data: jsonData, error: null });
          }
        } catch (parseError) {
          console.error(`❌ HostBill API Parse Error (${payload.call}):`, parseError);
          resolve({ success: false, error: 'Failed to parse response', data: null });
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ HostBill API Exception (${payload.call}):`, error);
      resolve({ success: false, error: error.message, data: null });
    });

    req.on('timeout', () => {
      req.destroy();
      console.error(`❌ HostBill API Timeout (${payload.call})`);
      resolve({ success: false, error: 'Request timeout', data: null });
    });

    req.write(postData);
    req.end();
  });
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  console.log('🎯 Getting all affiliates from HostBill...');

  try {
    // Since getAffiliates might not work, try to get affiliates by testing known IDs
    console.log('🔍 Attempting to discover affiliates by testing IDs...');

    const allAffiliates = [];
    const maxAffiliateId = 10; // Test first 10 IDs

    for (let id = 1; id <= maxAffiliateId; id++) {
      try {
        const affiliatePayload = {
          call: 'getAffiliate',
          api_id: HOSTBILL_CONFIG.apiId,
          api_key: HOSTBILL_CONFIG.apiKey,
          id: id.toString()
        };

        const affiliateResponse = await makeHostBillAPICall(affiliatePayload);

        if (affiliateResponse.success && affiliateResponse.data.affiliate) {
          const affiliate = affiliateResponse.data.affiliate;
          allAffiliates.push({
            id: affiliate.id,
            firstname: affiliate.firstname,
            lastname: affiliate.lastname,
            status: affiliate.status,
            balance: affiliate.balance,
            visits: affiliate.visits,
            client_id: affiliate.client_id,
            currency: affiliate.currency,
            date_created: affiliate.date_created
          });
          console.log(`✅ Found affiliate ID ${id}: ${affiliate.firstname} ${affiliate.lastname}`);
        } else {
          console.log(`⚪ No affiliate found for ID ${id}`);
        }
      } catch (error) {
        console.log(`❌ Error checking affiliate ID ${id}:`, error.message);
      }
    }

    // Sort affiliates by ID for consistent ordering
    allAffiliates.sort((a, b) => parseInt(a.id) - parseInt(b.id));

    // Prepare response
    const result = {
      success: true,
      affiliates: allAffiliates,
      total_affiliates: allAffiliates.length,
      method: 'individual_discovery',
      max_tested_id: maxAffiliateId,
      timestamp: new Date().toISOString()
    };

    console.log(`🎉 Successfully retrieved ${allAffiliates.length} affiliates`);
    
    res.status(200).json(result);

  } catch (error) {
    console.error('❌ Error in get-all-affiliates:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}
