// HostBill Create Order s affiliate assignment
import https from 'https';
import { URL } from 'url';

const HOSTBILL_CONFIG = {
  apiUrl: process.env.HOSTBILL_API_URL || 'https://vps.kabel1it.cz/admin/api.php',
  apiId: process.env.HOSTBILL_API_ID || 'adcdebb0e3b6f583052d',
  apiKey: process.env.HOSTBILL_API_KEY || '341697c41aeb1c842f0d'
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    client_id, 
    product_id, 
    cycle = 'm', // monthly by default
    affiliate_id,
    confirm = 1,
    invoice_generate = 1,
    invoice_info = 1
  } = req.body;

  if (!client_id || !product_id) {
    return res.status(400).json({ 
      success: false, 
      error: 'client_id and product_id are required' 
    });
  }

  console.log('🛒 Creating order with affiliate:', {
    client_id,
    product_id,
    cycle,
    affiliate_id
  });

  const orderResult = {
    success: false,
    order_id: null,
    affiliate_assigned: false,
    steps: []
  };

  try {
    // Step 1: Create the order
    const orderPayload = {
      call: 'addOrder',
      api_id: HOSTBILL_CONFIG.apiId,
      api_key: HOSTBILL_CONFIG.apiKey,
      client_id: client_id,
      product: product_id,
      cycle: cycle,
      confirm: confirm,
      invoice_generate: invoice_generate,
      invoice_info: invoice_info
    };

    const orderResponse = await makeHostBillAPICall(orderPayload);
    
    if (orderResponse.success && orderResponse.data.success === true) {
      orderResult.order_id = orderResponse.data.order_id;
      orderResult.steps.push({
        step: 'create_order',
        status: 'success',
        order_id: orderResponse.data.order_id,
        message: 'Order created successfully'
      });

      console.log('✅ Order created:', orderResponse.data.order_id);

      // Step 2: Assign affiliate to the order (if affiliate_id provided)
      if (affiliate_id && orderResult.order_id) {
        try {
          const affiliatePayload = {
            call: 'setOrderReferrer',
            api_id: HOSTBILL_CONFIG.apiId,
            api_key: HOSTBILL_CONFIG.apiKey,
            id: orderResult.order_id,
            referral: affiliate_id
          };

          const affiliateResponse = await makeHostBillAPICall(affiliatePayload);
          
          if (affiliateResponse.success && affiliateResponse.data.success === true) {
            orderResult.affiliate_assigned = true;
            orderResult.steps.push({
              step: 'assign_affiliate',
              status: 'success',
              affiliate_id: affiliate_id,
              message: 'Affiliate assigned to order'
            });

            console.log('✅ Affiliate assigned to order:', affiliate_id);
          } else {
            orderResult.steps.push({
              step: 'assign_affiliate',
              status: 'failed',
              affiliate_id: affiliate_id,
              error: affiliateResponse.error || 'Failed to assign affiliate'
            });

            console.log('❌ Failed to assign affiliate:', affiliate_id);
          }
        } catch (affiliateError) {
          orderResult.steps.push({
            step: 'assign_affiliate',
            status: 'error',
            affiliate_id: affiliate_id,
            error: affiliateError.message
          });

          console.log('❌ Affiliate assignment error:', affiliateError.message);
        }
      }

      orderResult.success = true;
      orderResult.message = 'Order created successfully';

    } else {
      orderResult.steps.push({
        step: 'create_order',
        status: 'failed',
        error: orderResponse.error || 'Failed to create order'
      });

      console.log('❌ Order creation failed:', orderResponse.error);
    }

  } catch (error) {
    orderResult.steps.push({
      step: 'create_order',
      status: 'error',
      error: error.message
    });

    console.log('❌ Order creation error:', error.message);
  }

  // Add summary
  orderResult.summary = {
    order_created: !!orderResult.order_id,
    affiliate_assigned: orderResult.affiliate_assigned,
    total_steps: orderResult.steps.length,
    successful_steps: orderResult.steps.filter(s => s.status === 'success').length
  };

  const statusCode = orderResult.success ? 200 : 400;
  res.status(statusCode).json(orderResult);
}

// Helper function to make HostBill API calls
async function makeHostBillAPICall(payload) {
  try {
    const postData = new URLSearchParams(payload).toString();
    const apiUrl = new URL(HOSTBILL_CONFIG.apiUrl);

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
        raw_response: response.body
      };
    }

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Helper endpoint to get order details with affiliate info
export async function getOrderWithAffiliate(orderId) {
  try {
    const orderPayload = {
      call: 'getOrderDetails',
      api_id: HOSTBILL_CONFIG.apiId,
      api_key: HOSTBILL_CONFIG.apiKey,
      id: orderId
    };

    const response = await makeHostBillAPICall(orderPayload);
    
    if (response.success && response.data.success === true) {
      const order = response.data.order;
      
      return {
        success: true,
        order: {
          id: order.id,
          client_id: order.client_id,
          product_id: order.product_id,
          status: order.status,
          total: order.total,
          affiliate_id: order.referral_id || null,
          created_date: order.date_created
        }
      };
    } else {
      return {
        success: false,
        error: 'Order not found'
      };
    }

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
