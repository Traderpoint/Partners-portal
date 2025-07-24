// API endpoint for creating orders with HostBill integration
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customer, items, paymentMethod, total, affiliate, newsletterSubscribe } = req.body;

    // Validate required fields
    if (!customer.firstName || !customer.lastName || !customer.email || !customer.address || !customer.city || !customer.postalCode) {
      return res.status(400).json({ error: 'Missing required customer information' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in order' });
    }

    // HostBill configuration (these should be environment variables)
    const HOSTBILL_URL = process.env.HOSTBILL_URL || 'https://vas-hostbill.cz';
    const HOSTBILL_API_ID = process.env.HOSTBILL_API_ID;
    const HOSTBILL_API_KEY = process.env.HOSTBILL_API_KEY;

    if (!HOSTBILL_API_ID || !HOSTBILL_API_KEY) {
      console.error('HostBill API credentials not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Step 1: Create or find customer in HostBill
    const customerData = {
      call: 'client_add',
      id: HOSTBILL_API_ID,
      key: HOSTBILL_API_KEY,
      firstname: customer.firstName,
      lastname: customer.lastName,
      email: customer.email,
      phone: customer.phone || '',
      company: customer.company || '',
      address1: customer.address,
      city: customer.city,
      postcode: customer.postalCode,
      country: customer.country || 'CZ',
      password: generateRandomPassword(),
      // Add affiliate information if present
      ...(affiliate.id && { affiliate_id: affiliate.id }),
      ...(affiliate.code && { affiliate_code: affiliate.code })
    };

    const customerResponse = await fetch(`${HOSTBILL_URL}/api/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(customerData)
    });

    const customerResult = await customerResponse.json();
    
    if (!customerResult.success) {
      // If customer already exists, try to get their ID
      if (customerResult.error && customerResult.error.includes('already exists')) {
        const getClientData = {
          call: 'client_details',
          id: HOSTBILL_API_ID,
          key: HOSTBILL_API_KEY,
          email: customer.email
        };

        const getClientResponse = await fetch(`${HOSTBILL_URL}/api/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams(getClientData)
        });

        const clientResult = await getClientResponse.json();
        if (clientResult.success) {
          customerResult.client_id = clientResult.client.id;
        } else {
          throw new Error('Failed to create or find customer');
        }
      } else {
        throw new Error(customerResult.error || 'Failed to create customer');
      }
    }

    const clientId = customerResult.client_id;

    // Step 2: Create order in HostBill
    const orderItems = items.map(item => ({
      product_id: item.productId,
      quantity: item.quantity,
      // Add affiliate tracking to each item if present
      ...(affiliate.id && { affiliate_id: affiliate.id })
    }));

    const orderData = {
      call: 'order_add',
      id: HOSTBILL_API_ID,
      key: HOSTBILL_API_KEY,
      client_id: clientId,
      payment_method: paymentMethod === 'card' ? 'stripe' : 'banktransfer',
      items: JSON.stringify(orderItems),
      // Add affiliate information to order
      ...(affiliate.id && { affiliate_id: affiliate.id }),
      ...(affiliate.code && { affiliate_code: affiliate.code })
    };

    const orderResponse = await fetch(`${HOSTBILL_URL}/api/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(orderData)
    });

    const orderResult = await orderResponse.json();

    if (!orderResult.success) {
      throw new Error(orderResult.error || 'Failed to create order');
    }

    // Step 3: If affiliate tracking is enabled, record the referral
    if (affiliate.id || affiliate.code) {
      try {
        const affiliateData = {
          call: 'affiliate_add_referral',
          id: HOSTBILL_API_ID,
          key: HOSTBILL_API_KEY,
          order_id: orderResult.order_id,
          client_id: clientId,
          ...(affiliate.id && { affiliate_id: affiliate.id }),
          ...(affiliate.code && { affiliate_code: affiliate.code })
        };

        await fetch(`${HOSTBILL_URL}/api/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams(affiliateData)
        });
      } catch (affiliateError) {
        console.error('Failed to record affiliate referral:', affiliateError);
        // Don't fail the order if affiliate tracking fails
      }
    }

    // Step 4: Handle newsletter subscription
    if (newsletterSubscribe) {
      try {
        // This would depend on your newsletter service (e.g., Mailchimp, SendGrid)
        // For now, we'll just log it
        console.log(`Newsletter subscription requested for: ${customer.email}`);
      } catch (newsletterError) {
        console.error('Failed to subscribe to newsletter:', newsletterError);
        // Don't fail the order if newsletter subscription fails
      }
    }

    // Return success response
    res.status(200).json({
      success: true,
      orderId: orderResult.order_id,
      clientId: clientId,
      message: 'Order created successfully'
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      error: 'Failed to create order',
      details: error.message 
    });
  }
}

// Helper function to generate random password
function generateRandomPassword(length = 12) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

// Alternative approach: Direct cart redirect with affiliate tracking
export async function createHostBillCartUrl(items, affiliateId, affiliateCode) {
  const HOSTBILL_URL = process.env.HOSTBILL_URL || 'https://vas-hostbill.cz';
  
  // Build cart URL with products
  let cartUrl = `${HOSTBILL_URL}/cart.php?`;
  
  // Add products to cart
  items.forEach((item, index) => {
    if (index === 0) {
      cartUrl += `a=add&pid=${item.hostbillPid}`;
    } else {
      cartUrl += `&pid[]=${item.hostbillPid}`;
    }
    
    if (item.quantity > 1) {
      cartUrl += `&qty${index === 0 ? '' : `[${item.hostbillPid}]`}=${item.quantity}`;
    }
  });
  
  // Add affiliate tracking
  if (affiliateId) {
    cartUrl += `&aff=${affiliateId}`;
  }
  
  if (affiliateCode) {
    cartUrl += `&aff_code=${affiliateCode}`;
  }
  
  return cartUrl;
}
