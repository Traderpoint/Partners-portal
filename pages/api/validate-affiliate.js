// API endpoint for validating affiliate IDs with HostBill
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, code } = req.query;

  if (!id && !code) {
    return res.status(400).json({ error: 'Affiliate ID or code is required' });
  }

  try {
    // HostBill configuration
    const HOSTBILL_URL = process.env.HOSTBILL_URL || 'https://vas-hostbill.cz';
    const HOSTBILL_API_ID = process.env.HOSTBILL_API_ID;
    const HOSTBILL_API_KEY = process.env.HOSTBILL_API_KEY;

    if (!HOSTBILL_API_ID || !HOSTBILL_API_KEY) {
      console.error('HostBill API credentials not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Validate affiliate with HostBill API
    const affiliateData = {
      call: 'affiliate_details',
      id: HOSTBILL_API_ID,
      key: HOSTBILL_API_KEY,
      ...(id && { affiliate_id: id }),
      ...(code && { affiliate_code: code })
    };

    const response = await fetch(`${HOSTBILL_URL}/api/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(affiliateData)
    });

    const result = await response.json();

    if (result.success && result.affiliate) {
      // Affiliate is valid
      res.status(200).json({
        valid: true,
        affiliate: {
          id: result.affiliate.id,
          name: result.affiliate.name || result.affiliate.firstname + ' ' + result.affiliate.lastname,
          email: result.affiliate.email,
          status: result.affiliate.status,
          commission_rate: result.affiliate.commission_rate || 0
        }
      });
    } else {
      // Affiliate not found or invalid
      res.status(200).json({
        valid: false,
        error: result.error || 'Affiliate not found'
      });
    }

  } catch (error) {
    console.error('Error validating affiliate:', error);
    res.status(500).json({ 
      error: 'Failed to validate affiliate',
      details: error.message 
    });
  }
}
