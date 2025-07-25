/**
 * API endpoint for creating orders with affiliate tracking
 * POST /api/orders/create
 */

import HostBillOrderService from '../../../lib/hostbill-order';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    console.log('📥 Order creation request received');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const orderService = new HostBillOrderService();
    
    // Validate required fields
    const { customer, items, affiliate } = req.body;
    
    if (!customer || !customer.email || !customer.firstName || !customer.lastName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required customer information'
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No items in order'
      });
    }

    // Validate each item has required fields
    for (const item of items) {
      if (!item.productId || !item.name) {
        return res.status(400).json({
          success: false,
          error: 'Invalid item data - missing productId or name'
        });
      }
    }

    // Process the complete order
    const result = await orderService.processCompleteOrder({
      customer,
      items,
      affiliate: affiliate || null,
      paymentMethod: req.body.paymentMethod || 'card',
      newsletterSubscribe: req.body.newsletterSubscribe || false
    });

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Order processed successfully',
      data: {
        client: {
          id: result.client.id,
          name: `${result.client.firstname} ${result.client.lastname}`,
          email: result.client.email
        },
        affiliate: result.affiliate ? {
          id: result.affiliate.id,
          name: result.affiliate.name
        } : null,
        orders: result.orders.map(order => ({
          orderId: order.orderId,
          invoiceId: order.invoiceId,
          productName: order.productName
        })),
        errors: result.errors
      }
    });

  } catch (error) {
    console.error('❌ Order creation error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to process order',
      details: error.message
    });
  }
}
