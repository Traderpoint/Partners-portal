// HostBill Affiliate Conversion Tracking API
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const conversionData = req.body;
    
    // 🔧 KONFIGURACE - ZMĚŇTE NA VAŠE HODNOTY
    const HOSTBILL_CONFIG = {
      apiUrl: process.env.HOSTBILL_API_URL || 'https://your-hostbill-domain.com/api',
      apiKey: process.env.HOSTBILL_API_KEY || 'your-api-key',
      apiSecret: process.env.HOSTBILL_API_SECRET || 'your-api-secret',
      affiliateEndpoint: '/affiliate/conversion'
    };

    console.log('📊 Processing HostBill conversion:', {
      orderId: conversionData.order_id,
      affiliateId: conversionData.affiliate_id,
      amount: conversionData.amount
    });

    // Validate required fields
    if (!conversionData.affiliate_id || !conversionData.order_id || !conversionData.amount) {
      return res.status(400).json({ 
        error: 'Missing required fields: affiliate_id, order_id, amount' 
      });
    }

    // Prepare HostBill API payload
    const hostbillPayload = {
      // Standard HostBill affiliate fields
      affiliate_id: conversionData.affiliate_id,
      order_id: conversionData.order_id,
      amount: parseFloat(conversionData.amount),
      currency: conversionData.currency || 'CZK',
      
      // Customer information
      customer_email: conversionData.customer_email,
      
      // Order details
      products: Array.isArray(conversionData.products) ? conversionData.products : [],
      
      // Timestamps
      conversion_time: conversionData.conversion_time || new Date().toISOString(),
      
      // Additional metadata
      metadata: {
        os: conversionData.os,
        applications: conversionData.applications,
        period: conversionData.period,
        server_specs: conversionData.server_specs,
        source: 'systrix-vps-configurator'
      }
    };

    // Method 1: Direct HostBill API call
    let hostbillResponse = null;
    if (HOSTBILL_CONFIG.apiKey !== 'your-api-key') {
      try {
        const response = await fetch(`${HOSTBILL_CONFIG.apiUrl}${HOSTBILL_CONFIG.affiliateEndpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${HOSTBILL_CONFIG.apiKey}`,
            'X-API-Secret': HOSTBILL_CONFIG.apiSecret
          },
          body: JSON.stringify(hostbillPayload)
        });

        if (response.ok) {
          hostbillResponse = await response.json();
          console.log('✅ HostBill API: Conversion tracked successfully');
        } else {
          const errorText = await response.text();
          console.error('❌ HostBill API Error:', response.status, errorText);
        }
      } catch (apiError) {
        console.error('❌ HostBill API Request Failed:', apiError.message);
      }
    }

    // Method 2: Database storage (for your own tracking)
    // In production, store this in your database
    const conversionRecord = {
      id: `conv_${Date.now()}`,
      ...hostbillPayload,
      processed_at: new Date().toISOString(),
      hostbill_response: hostbillResponse,
      status: hostbillResponse ? 'success' : 'pending'
    };

    // Log for debugging (in production, save to database)
    console.log('💾 Conversion record created:', conversionRecord);

    // Method 3: Email notification to admin
    if (process.env.ADMIN_EMAIL) {
      try {
        await fetch('/api/send-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'affiliate_conversion',
            to: process.env.ADMIN_EMAIL,
            subject: `New Affiliate Conversion - ${conversionData.order_id}`,
            data: conversionRecord
          })
        });
      } catch (emailError) {
        console.error('❌ Email notification failed:', emailError.message);
      }
    }

    // Calculate commission (example calculation)
    const commissionRate = 0.10; // 10%
    const commissionAmount = parseFloat(conversionData.amount) * commissionRate;

    // Response
    res.status(200).json({
      success: true,
      message: 'Conversion tracked successfully',
      data: {
        conversion_id: conversionRecord.id,
        affiliate_id: conversionData.affiliate_id,
        order_id: conversionData.order_id,
        amount: conversionData.amount,
        commission_amount: commissionAmount.toFixed(2),
        currency: conversionData.currency || 'CZK',
        status: conversionRecord.status,
        processed_at: conversionRecord.processed_at
      },
      hostbill_response: hostbillResponse
    });

  } catch (error) {
    console.error('❌ Conversion tracking error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}
