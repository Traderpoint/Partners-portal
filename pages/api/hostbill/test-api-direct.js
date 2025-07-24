// Direct HostBill API Test (with SSL bypass for development)
import https from 'https';
import { URL } from 'url';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const config = {
    apiUrl: process.env.HOSTBILL_API_URL || 'https://vps.kabel1it.cz/admin/api.php',
    apiId: process.env.HOSTBILL_API_ID || 'adcdebb0e3b6f583052d',
    apiKey: process.env.HOSTBILL_API_KEY || '341697c41aeb1c842f0d'
  };

  console.log('🧪 Testing HostBill API:', config.apiUrl);

  const testResults = {
    config: {
      apiUrl: config.apiUrl,
      hasApiId: !!config.apiId,
      hasApiKey: !!config.apiKey
    },
    tests: []
  };

  // Test 1: Basic API connectivity using native https module
  try {
    const apiUrl = new URL(config.apiUrl);

    const responseData = await new Promise((resolve, reject) => {
      const options = {
        hostname: apiUrl.hostname,
        port: apiUrl.port || 443,
        path: apiUrl.pathname,
        method: 'GET',
        rejectUnauthorized: false // Ignore SSL errors for development
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            headers: res.headers,
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

      req.end();
    });

    testResults.tests.push({
      name: 'API Endpoint Connectivity',
      status: responseData.statusCode < 500 ? 'PASS' : 'FAIL',
      details: `HTTP ${responseData.statusCode} - ${responseData.statusMessage}`,
      url: config.apiUrl
    });

    testResults.tests.push({
      name: 'API Response',
      status: 'INFO',
      details: responseData.body.substring(0, 200) + (responseData.body.length > 200 ? '...' : ''),
      fullResponse: responseData.body
    });

  } catch (error) {
    testResults.tests.push({
      name: 'API Endpoint Connectivity',
      status: 'FAIL',
      details: error.message,
      url: config.apiUrl
    });
  }

  // Test 2: API Authentication with affiliate_list call
  if (config.apiId && config.apiKey) {
    try {
      const apiUrl = new URL(config.apiUrl);
      // Podle oficiální HostBill API dokumentace
      const apiPayload = {
        call: 'getAffiliates', // Oficiální API call
        api_id: config.apiId,
        api_key: config.apiKey
      };
      const postData = new URLSearchParams(apiPayload).toString();

      const responseData = await new Promise((resolve, reject) => {
        const options = {
          hostname: apiUrl.hostname,
          port: apiUrl.port || 443,
          path: apiUrl.pathname,
          method: 'POST',
          rejectUnauthorized: false,
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
              statusMessage: res.statusMessage,
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

      testResults.tests.push({
        name: 'API Authentication (affiliate_list)',
        status: responseData.statusCode === 200 ? 'PASS' : 'FAIL',
        details: responseData.statusCode === 200 ? 'API authentication successful' : `HTTP ${responseData.statusCode} - ${responseData.statusMessage}`,
        response: responseData.body.substring(0, 500) + (responseData.body.length > 500 ? '...' : ''),
        fullResponse: responseData.body
      });

    } catch (error) {
      testResults.tests.push({
        name: 'API Authentication',
        status: 'FAIL',
        details: 'API authentication failed: ' + error.message
      });
    }
  }

  // Test 3: Try affiliate tracking call
  if (config.apiId && config.apiKey) {
    try {
      const agent = new https.Agent({
        rejectUnauthorized: false
      });

      // Test konkrétního affiliate podle dokumentace
      const trackingPayload = {
        call: 'getAffiliate',
        api_id: config.apiId,
        api_key: config.apiKey,
        id: '1' // Test s affiliate ID 1
      };

      const response = await fetch(config.apiUrl, {
        method: 'POST',
        agent: agent,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(trackingPayload).toString(),
        timeout: 10000
      });

      const responseText = await response.text();
      
      testResults.tests.push({
        name: 'Affiliate Tracking Call',
        status: response.ok ? 'PASS' : 'WARN',
        details: response.ok ? 'Affiliate tracking call successful' : `HTTP ${response.status} - May not be implemented`,
        response: responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''),
        fullResponse: responseText
      });

    } catch (error) {
      testResults.tests.push({
        name: 'Affiliate Tracking Call',
        status: 'WARN',
        details: 'Affiliate tracking call failed: ' + error.message
      });
    }
  }

  // Overall status
  const failedTests = testResults.tests.filter(test => test.status === 'FAIL').length;
  const passedTests = testResults.tests.filter(test => test.status === 'PASS').length;
  
  testResults.summary = {
    total: testResults.tests.length,
    passed: passedTests,
    failed: failedTests,
    warnings: testResults.tests.filter(test => test.status === 'WARN').length,
    overall: failedTests === 0 ? (passedTests > 0 ? 'SUCCESS' : 'PARTIAL') : 'ISSUES'
  };

  res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    ...testResults
  });
}
