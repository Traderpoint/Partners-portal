// HostBill API Connection Test
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const config = {
    hostbillUrl: process.env.NEXT_PUBLIC_HOSTBILL_URL,
    apiKey: process.env.HOSTBILL_API_KEY,
    apiSecret: process.env.HOSTBILL_API_SECRET,
    apiUrl: process.env.HOSTBILL_API_URL
  };

  // Check if all required config is present
  const missingConfig = [];
  if (!config.hostbillUrl || config.hostbillUrl === 'https://your-hostbill-domain.com') {
    missingConfig.push('NEXT_PUBLIC_HOSTBILL_URL');
  }
  if (!config.apiKey || config.apiKey === 'your-api-key') {
    missingConfig.push('HOSTBILL_API_KEY');
  }
  if (!config.apiSecret || config.apiSecret === 'your-api-secret') {
    missingConfig.push('HOSTBILL_API_SECRET');
  }

  if (missingConfig.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Missing configuration',
      missingConfig,
      instructions: {
        message: 'Please update your .env.local file with the following values from HostBill:',
        steps: [
          '1. Go to HostBill Admin → Settings → API → API Access',
          '2. Create new API key with Affiliates permissions',
          '3. Copy API ID as HOSTBILL_API_KEY',
          '4. Copy API Secret as HOSTBILL_API_SECRET',
          '5. Set NEXT_PUBLIC_HOSTBILL_URL to your HostBill domain'
        ]
      }
    });
  }

  const testResults = {
    config: {
      hostbillUrl: config.hostbillUrl,
      apiUrl: config.apiUrl,
      hasApiKey: !!config.apiKey,
      hasApiSecret: !!config.apiSecret
    },
    tests: []
  };

  // Test 1: Basic connectivity
  try {
    const response = await fetch(config.hostbillUrl, {
      method: 'HEAD',
      timeout: 5000
    });
    
    testResults.tests.push({
      name: 'HostBill Connectivity',
      status: response.ok ? 'PASS' : 'FAIL',
      details: `HTTP ${response.status} - ${response.statusText}`,
      url: config.hostbillUrl
    });
  } catch (error) {
    testResults.tests.push({
      name: 'HostBill Connectivity',
      status: 'FAIL',
      details: error.message,
      url: config.hostbillUrl
    });
  }

  // Test 2: API Endpoint availability
  try {
    const apiTestUrl = `${config.apiUrl || config.hostbillUrl + '/api'}/test`;
    const response = await fetch(apiTestUrl, {
      method: 'GET',
      timeout: 5000
    });
    
    testResults.tests.push({
      name: 'API Endpoint',
      status: response.status < 500 ? 'PASS' : 'FAIL',
      details: `HTTP ${response.status} - API endpoint accessible`,
      url: apiTestUrl
    });
  } catch (error) {
    testResults.tests.push({
      name: 'API Endpoint',
      status: 'WARN',
      details: 'API endpoint test failed - this is normal if API requires authentication',
      error: error.message
    });
  }

  // Test 3: API Authentication (if we have credentials)
  if (config.apiKey && config.apiSecret) {
    try {
      // Try to make an authenticated API call
      const authTestUrl = `${config.apiUrl || config.hostbillUrl + '/api'}/admin/affiliates`;
      const response = await fetch(authTestUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'X-API-Secret': config.apiSecret,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      const responseText = await response.text();
      
      testResults.tests.push({
        name: 'API Authentication',
        status: response.ok ? 'PASS' : 'FAIL',
        details: response.ok ? 'API authentication successful' : `HTTP ${response.status} - ${responseText}`,
        url: authTestUrl
      });
    } catch (error) {
      testResults.tests.push({
        name: 'API Authentication',
        status: 'FAIL',
        details: 'API authentication failed',
        error: error.message
      });
    }
  }

  // Test 4: Affiliate system status
  try {
    // This would be a custom endpoint to check affiliate system status
    const affiliateTestUrl = `${config.hostbillUrl}/includes/affiliate/status.php`;
    const response = await fetch(affiliateTestUrl, {
      method: 'GET',
      timeout: 5000
    });
    
    testResults.tests.push({
      name: 'Affiliate System',
      status: response.status < 500 ? 'PASS' : 'WARN',
      details: response.ok ? 'Affiliate system accessible' : 'Affiliate system may not be configured',
      url: affiliateTestUrl
    });
  } catch (error) {
    testResults.tests.push({
      name: 'Affiliate System',
      status: 'WARN',
      details: 'Could not verify affiliate system status',
      note: 'This is normal if affiliate system is not yet configured'
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
    overall: failedTests === 0 ? (passedTests > 0 ? 'READY' : 'NEEDS_SETUP') : 'ISSUES_FOUND'
  };

  // Recommendations
  testResults.recommendations = [];
  
  if (failedTests > 0) {
    testResults.recommendations.push('Fix failed tests before proceeding');
  }
  
  if (testResults.summary.overall === 'NEEDS_SETUP') {
    testResults.recommendations.push('Complete HostBill API configuration');
  }
  
  if (testResults.summary.overall === 'READY') {
    testResults.recommendations.push('Configuration looks good! You can proceed with affiliate integration');
  }

  res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    ...testResults
  });
}
