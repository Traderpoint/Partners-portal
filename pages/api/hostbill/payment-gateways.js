/**
 * HostBill Payment Gateways Diagnostic API
 * GET /api/hostbill/payment-gateways
 * Checks available and configured payment gateways in HostBill
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  const hostbillUrl = process.env.HOSTBILL_URL;
  const apiId = process.env.HOSTBILL_API_ID;
  const apiKey = process.env.HOSTBILL_API_KEY;

  if (!hostbillUrl || !apiId || !apiKey) {
    return res.status(500).json({
      success: false,
      error: 'HostBill API credentials not configured',
      details: {
        hasUrl: !!hostbillUrl,
        hasApiId: !!apiId,
        hasApiKey: !!apiKey
      }
    });
  }

  try {
    console.log('🔍 Checking HostBill payment gateways...');

    // Try different API calls to get payment gateway information
    const diagnostics = {
      credentials: {
        url: hostbillUrl,
        apiId: apiId.substring(0, 8) + '...',
        hasApiKey: !!apiKey
      },
      tests: []
    };

    // Test 1: Try to get general system info
    try {
      const systemResponse = await fetch(`${hostbillUrl}/admin/api.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          api_id: apiId,
          api_key: apiKey,
          call: 'getSystemInfo'
        }),
        // Ignore SSL certificate errors for development
        agent: process.env.NODE_ENV === 'development' ? new (require('https').Agent)({
          rejectUnauthorized: false
        }) : undefined
      });

      const systemData = await systemResponse.json();
      diagnostics.tests.push({
        name: 'System Info',
        call: 'getSystemInfo',
        success: !systemData.error,
        response: systemData
      });
    } catch (error) {
      diagnostics.tests.push({
        name: 'System Info',
        call: 'getSystemInfo',
        success: false,
        error: error.message
      });
    }

    // Test 2: Try to get products (this usually works)
    try {
      const productsResponse = await fetch(`${hostbillUrl}/admin/api.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          api_id: apiId,
          api_key: apiKey,
          call: 'getProducts'
        })
      });

      const productsData = await productsResponse.json();
      diagnostics.tests.push({
        name: 'Products',
        call: 'getProducts',
        success: !productsData.error,
        response: productsData
      });
    } catch (error) {
      diagnostics.tests.push({
        name: 'Products',
        call: 'getProducts',
        success: false,
        error: error.message
      });
    }

    // Test 3: Try to get payment methods
    try {
      const methodsResponse = await fetch(`${hostbillUrl}/admin/api.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          api_id: apiId,
          api_key: apiKey,
          call: 'getPaymentMethods'
        })
      });

      const methodsData = await methodsResponse.json();
      diagnostics.tests.push({
        name: 'Payment Methods',
        call: 'getPaymentMethods',
        success: !methodsData.error,
        response: methodsData
      });
    } catch (error) {
      diagnostics.tests.push({
        name: 'Payment Methods',
        call: 'getPaymentMethods',
        success: false,
        error: error.message
      });
    }

    // Test 4: Try to get gateways
    try {
      const gatewaysResponse = await fetch(`${hostbillUrl}/admin/api.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          api_id: apiId,
          api_key: apiKey,
          call: 'getGateways'
        })
      });

      const gatewaysData = await gatewaysResponse.json();
      diagnostics.tests.push({
        name: 'Gateways',
        call: 'getGateways',
        success: !gatewaysData.error,
        response: gatewaysData
      });
    } catch (error) {
      diagnostics.tests.push({
        name: 'Gateways',
        call: 'getGateways',
        success: false,
        error: error.message
      });
    }

    // Test 5: Try to get modules
    try {
      const modulesResponse = await fetch(`${hostbillUrl}/admin/api.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          api_id: apiId,
          api_key: apiKey,
          call: 'getModules'
        })
      });

      const modulesData = await modulesResponse.json();
      diagnostics.tests.push({
        name: 'Modules',
        call: 'getModules',
        success: !modulesData.error,
        response: modulesData
      });
    } catch (error) {
      diagnostics.tests.push({
        name: 'Modules',
        call: 'getModules',
        success: false,
        error: error.message
      });
    }

    // Test 6: Try to get configuration
    try {
      const configResponse = await fetch(`${hostbillUrl}/admin/api.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          api_id: apiId,
          api_key: apiKey,
          call: 'getConfiguration'
        })
      });

      const configData = await configResponse.json();
      diagnostics.tests.push({
        name: 'Configuration',
        call: 'getConfiguration',
        success: !configData.error,
        response: configData
      });
    } catch (error) {
      diagnostics.tests.push({
        name: 'Configuration',
        call: 'getConfiguration',
        success: false,
        error: error.message
      });
    }

    // Summary
    const successfulTests = diagnostics.tests.filter(test => test.success).length;
    const totalTests = diagnostics.tests.length;

    console.log(`✅ HostBill diagnostics completed: ${successfulTests}/${totalTests} tests passed`);

    return res.status(200).json({
      success: true,
      message: `HostBill diagnostics completed: ${successfulTests}/${totalTests} tests passed`,
      diagnostics,
      summary: {
        totalTests,
        successfulTests,
        failedTests: totalTests - successfulTests,
        connectionWorking: successfulTests > 0
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ HostBill diagnostics failed:', error);
    
    return res.status(500).json({
      success: false,
      error: 'HostBill diagnostics failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
