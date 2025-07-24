// Test konkrétních HostBill Affiliate API calls
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

  console.log('🧪 Testing HostBill Affiliate API calls:', config.apiUrl);

  const testResults = {
    config: {
      apiUrl: config.apiUrl,
      hasApiId: !!config.apiId,
      hasApiKey: !!config.apiKey
    },
    tests: []
  };

  // Helper function pro API calls
  const makeApiCall = async (callName, params = {}) => {
    try {
      const apiUrl = new URL(config.apiUrl);
      const apiPayload = {
        call: callName,
        api_id: config.apiId,
        api_key: config.apiKey,
        ...params
      };
      const postData = new URLSearchParams(apiPayload).toString();

      const responseData = await new Promise((resolve, reject) => {
        const options = {
          hostname: apiUrl.hostname,
          port: apiUrl.port || 443,
          path: apiUrl.pathname,
          method: 'POST',
          rejectUnauthorized: false, // SSL bypass pro development
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

      return responseData;
    } catch (error) {
      throw error;
    }
  };

  // Test 1: getAffiliates - Seznam všech affiliates
  try {
    const response = await makeApiCall('getAffiliates');
    
    let isSuccess = false;
    let affiliateCount = 0;
    let responseObj = null;

    try {
      responseObj = JSON.parse(response.body);
      isSuccess = responseObj.success === true;
      affiliateCount = responseObj.affiliates ? responseObj.affiliates.length : 0;
    } catch (parseError) {
      // Možná není JSON response
    }

    testResults.tests.push({
      name: 'getAffiliates - Seznam affiliates',
      status: isSuccess ? 'PASS' : (response.statusCode === 200 ? 'WARN' : 'FAIL'),
      details: isSuccess ? `Nalezeno ${affiliateCount} affiliates` : `HTTP ${response.statusCode} - ${response.statusMessage}`,
      response: response.body.substring(0, 300) + (response.body.length > 300 ? '...' : ''),
      fullResponse: responseObj || response.body
    });

  } catch (error) {
    testResults.tests.push({
      name: 'getAffiliates - Seznam affiliates',
      status: 'FAIL',
      details: 'API call failed: ' + error.message
    });
  }

  // Test 2: getAffiliate - Detail affiliate ID 1 (reálné ID z HostBill)
  try {
    const response = await makeApiCall('getAffiliate', { id: '1' });
    
    let isSuccess = false;
    let affiliateData = null;
    let responseObj = null;

    try {
      responseObj = JSON.parse(response.body);
      isSuccess = responseObj.success === true;
      affiliateData = responseObj.affiliate;
    } catch (parseError) {
      // Možná není JSON response
    }

    testResults.tests.push({
      name: 'getAffiliate - Detail affiliate ID 1',
      status: isSuccess ? 'PASS' : (response.statusCode === 200 ? 'WARN' : 'FAIL'),
      details: isSuccess ? `Affiliate: ${affiliateData?.firstname} ${affiliateData?.lastname}` : `HTTP ${response.statusCode} - ${response.statusMessage}`,
      response: response.body.substring(0, 300) + (response.body.length > 300 ? '...' : ''),
      fullResponse: responseObj || response.body
    });

  } catch (error) {
    testResults.tests.push({
      name: 'getAffiliate - Detail affiliate ID 1',
      status: 'FAIL',
      details: 'API call failed: ' + error.message
    });
  }

  // Test 3: getAffiliate - Detail affiliate ID 2 (druhé reálné ID)
  try {
    const response = await makeApiCall('getAffiliate', { id: '2' });

    let isSuccess = false;
    let affiliateData = null;
    let responseObj = null;

    try {
      responseObj = JSON.parse(response.body);
      isSuccess = responseObj.success === true;
      affiliateData = responseObj.affiliate;
    } catch (parseError) {
      // Možná není JSON response
    }

    testResults.tests.push({
      name: 'getAffiliate - Detail affiliate ID 2',
      status: isSuccess ? 'PASS' : (response.statusCode === 200 ? 'WARN' : 'FAIL'),
      details: isSuccess ? `Affiliate: ${affiliateData?.firstname} ${affiliateData?.lastname}` : `HTTP ${response.statusCode} - ${response.statusMessage}`,
      response: response.body.substring(0, 300) + (response.body.length > 300 ? '...' : ''),
      fullResponse: responseObj || response.body
    });

  } catch (error) {
    testResults.tests.push({
      name: 'getAffiliate - Detail affiliate ID 2',
      status: 'FAIL',
      details: 'API call failed: ' + error.message
    });
  }

  // Test 4: activateAsAffiliate - Test aktivace affiliate
  try {
    const response = await makeApiCall('activateAsAffiliate', { client_id: '1' });
    
    let isSuccess = false;
    let responseObj = null;

    try {
      responseObj = JSON.parse(response.body);
      isSuccess = responseObj.success === true;
    } catch (parseError) {
      // Možná není JSON response
    }

    testResults.tests.push({
      name: 'activateAsAffiliate - Test aktivace',
      status: isSuccess ? 'PASS' : (response.statusCode === 200 ? 'WARN' : 'FAIL'),
      details: isSuccess ? 'Affiliate aktivace úspěšná' : `HTTP ${response.statusCode} - Možná již aktivní`,
      response: response.body.substring(0, 300) + (response.body.length > 300 ? '...' : ''),
      fullResponse: responseObj || response.body
    });

  } catch (error) {
    testResults.tests.push({
      name: 'activateAsAffiliate - Test aktivace',
      status: 'FAIL',
      details: 'API call failed: ' + error.message
    });
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

  // Recommendations
  testResults.recommendations = [];
  
  if (passedTests > 0) {
    testResults.recommendations.push('✅ HostBill API funguje! Affiliate systém je dostupný.');
  }
  
  if (failedTests > 0) {
    testResults.recommendations.push('⚠️ Některé API calls selhaly - zkontrolujte affiliate konfiguraci.');
  }
  
  if (testResults.summary.overall === 'SUCCESS') {
    testResults.recommendations.push('🎉 Všechny affiliate API calls fungují správně!');
  }

  res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    ...testResults
  });
}
