// Test reálné objednávky v HostBill s affiliate
import https from 'https';
import { URL } from 'url';
import { HOSTBILL_CONFIG, createOrderPayload, createAffiliatePayload } from '../../../lib/hostbill-config.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    client_id = '81', // Test Partner's client ID for affiliate ID 1
    product_id = '5', // Updated product ID from .env.local
    cycle = 'm',
    affiliate_id = '1' // Default affiliate ID 1
  } = req.body;

  console.log('🧪 Testing REAL HostBill order creation:', {
    client_id,
    product_id,
    cycle,
    affiliate_id,
    api_url: HOSTBILL_CONFIG.apiUrl
  });

  const testResult = {
    success: false,
    steps: [],
    api_calls: [],
    order_id: null,
    affiliate_assigned: false
  };

  try {
    // Step 1: Test API connectivity
    console.log('🔧 Step 1: Testing API connectivity...');
    const connectivityTest = await testAPIConnectivity();
    testResult.steps.push(connectivityTest);
    testResult.api_calls.push(connectivityTest);

    if (!connectivityTest.success) {
      return res.status(500).json({
        ...testResult,
        error: 'API connectivity failed'
      });
    }

    // Step 2: Verify affiliate exists
    console.log('🔧 Step 2: Verifying affiliate...');
    const affiliateTest = await verifyAffiliate(affiliate_id);
    testResult.steps.push(affiliateTest);
    testResult.api_calls.push(affiliateTest);

    // Step 3: Create order
    console.log('🔧 Step 3: Creating order...');
    const orderPayload = createOrderPayload(client_id, product_id, cycle, [], {}, affiliate_id);
    const orderTest = await createOrder(orderPayload);
    testResult.steps.push(orderTest);
    testResult.api_calls.push(orderTest);

    if (orderTest.success && orderTest.order_id) {
      testResult.order_id = orderTest.order_id;

      // Step 4: Wait a moment for order to be fully processed
      console.log('⏳ Waiting 2 seconds for order to be processed...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 5: Assign affiliate to order
      console.log('🔧 Step 5: Assigning affiliate to order...');
      const affiliatePayload = createAffiliatePayload(orderTest.order_id, affiliate_id);
      const affiliateAssignTest = await assignAffiliate(affiliatePayload);
      testResult.steps.push(affiliateAssignTest);
      testResult.api_calls.push(affiliateAssignTest);

      if (affiliateAssignTest.success) {
        testResult.affiliate_assigned = true;
        testResult.success = true;
      }
    }

    // Summary
    const successfulSteps = testResult.steps.filter(step => step.success).length;
    testResult.summary = {
      total_steps: testResult.steps.length,
      successful_steps: successfulSteps,
      success_rate: Math.round((successfulSteps / testResult.steps.length) * 100)
    };

    console.log('✅ Test completed:', testResult.summary);

    res.status(testResult.success ? 200 : 400).json(testResult);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    testResult.steps.push({
      step: 'error_handling',
      success: false,
      error: error.message
    });

    res.status(500).json(testResult);
  }
}

// Helper function to test API connectivity
async function testAPIConnectivity() {
  try {
    const payload = {
      call: 'getAffiliates',
      api_id: HOSTBILL_CONFIG.apiId,
      api_key: HOSTBILL_CONFIG.apiKey
    };

    const response = await makeHostBillAPICall(payload);
    
    return {
      step: 'api_connectivity',
      success: response.success,
      details: response.success ? 'API connection successful' : 'API connection failed',
      response: response.data || response.error
    };
  } catch (error) {
    return {
      step: 'api_connectivity',
      success: false,
      error: error.message
    };
  }
}

// Helper function to verify affiliate
async function verifyAffiliate(affiliateId) {
  try {
    const payload = {
      call: 'getAffiliate',
      api_id: HOSTBILL_CONFIG.apiId,
      api_key: HOSTBILL_CONFIG.apiKey,
      id: affiliateId
    };

    const response = await makeHostBillAPICall(payload);
    
    return {
      step: 'verify_affiliate',
      success: response.success && response.data?.success === true,
      affiliate_id: affiliateId,
      details: response.success ? `Affiliate ${affiliateId} verified` : `Affiliate ${affiliateId} not found`,
      affiliate_data: response.data?.affiliate || null
    };
  } catch (error) {
    return {
      step: 'verify_affiliate',
      success: false,
      affiliate_id: affiliateId,
      error: error.message
    };
  }
}

// Helper function to create order
async function createOrder(orderPayload) {
  try {
    console.log('📦 Creating order with payload:', orderPayload);
    const response = await makeHostBillAPICall(orderPayload);
    
    return {
      step: 'create_order',
      success: response.success && response.data?.success === true,
      order_id: response.data?.order_id || null,
      details: response.success ? 'Order created successfully' : 'Order creation failed',
      payload: orderPayload,
      response: response.data || response.error
    };
  } catch (error) {
    return {
      step: 'create_order',
      success: false,
      error: error.message,
      payload: orderPayload
    };
  }
}

// Helper function to assign affiliate
async function assignAffiliate(affiliatePayload) {
  try {
    console.log('🤝 Assigning affiliate with payload:', affiliatePayload);
    const response = await makeHostBillAPICall(affiliatePayload);
    
    return {
      step: 'assign_affiliate',
      success: response.success && response.data?.success === true,
      details: response.success ? 'Affiliate assigned successfully' : 'Affiliate assignment failed',
      payload: affiliatePayload,
      response: response.data || response.error
    };
  } catch (error) {
    return {
      step: 'assign_affiliate',
      success: false,
      error: error.message,
      payload: affiliatePayload
    };
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
    console.log('📥 API Response body (first 200 chars):', response.body.substring(0, 200));

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
        raw_response: response.body.substring(0, 500)
      };
    }

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
