// Test endpoint for direct getAffiliates API call
// Tests the official HostBill getAffiliates API method

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
  console.log(`📋 Payload:`, payload);

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
          
          resolve({ success: true, data: jsonData, error: null });
        } catch (parseError) {
          console.error(`❌ HostBill API Parse Error (${payload.call}):`, parseError);
          console.error(`❌ Raw response:`, data);
          resolve({ success: false, error: 'Failed to parse response', data: data });
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

  console.log('🧪 Testing getAffiliates API directly...');

  try {
    // Test getAffiliates with different parameters
    const tests = [
      {
        name: 'Basic getAffiliates',
        payload: {
          call: 'getAffiliates',
          api_id: HOSTBILL_CONFIG.apiId,
          api_key: HOSTBILL_CONFIG.apiKey
        }
      },
      {
        name: 'getAffiliates with page 1',
        payload: {
          call: 'getAffiliates',
          api_id: HOSTBILL_CONFIG.apiId,
          api_key: HOSTBILL_CONFIG.apiKey,
          page: 1
        }
      },
      {
        name: 'getAffiliates with perpage 10',
        payload: {
          call: 'getAffiliates',
          api_id: HOSTBILL_CONFIG.apiId,
          api_key: HOSTBILL_CONFIG.apiKey,
          page: 1,
          perpage: 10
        }
      }
    ];

    const results = [];

    for (const test of tests) {
      console.log(`\n🧪 Running test: ${test.name}`);
      
      const response = await makeHostBillAPICall(test.payload);
      
      results.push({
        test_name: test.name,
        success: response.success,
        error: response.error,
        has_affiliates: response.data?.affiliates ? true : false,
        affiliates_count: response.data?.affiliates?.length || 0,
        has_sorter: response.data?.sorter ? true : false,
        sorter: response.data?.sorter || null,
        api_success: response.data?.success,
        api_error: response.data?.error || null,
        raw_response: response.data
      });
    }

    // Prepare response
    const result = {
      success: true,
      tests: results,
      summary: {
        total_tests: tests.length,
        successful_calls: results.filter(r => r.success).length,
        successful_api_responses: results.filter(r => r.api_success).length,
        tests_with_affiliates: results.filter(r => r.has_affiliates).length
      },
      timestamp: new Date().toISOString()
    };

    console.log(`🎉 Test completed: ${result.summary.successful_calls}/${result.summary.total_tests} calls successful`);
    
    res.status(200).json(result);

  } catch (error) {
    console.error('❌ Error in test-getaffiliates:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}
