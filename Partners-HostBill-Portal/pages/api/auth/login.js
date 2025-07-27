const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'partners-portal-secret-2024';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { affiliateId, password } = req.body;

  if (!affiliateId) {
    return res.status(400).json({ 
      success: false, 
      error: 'Affiliate ID is required' 
    });
  }

  try {
    console.log(`🔐 Login attempt for affiliate: ${affiliateId}`);

    // Validate affiliate using HostBill API - EXACT COPY from working method
    const hostbillUrl = 'http://vps.kabel1it.cz';
    const apiId = process.env.HOSTBILL_API_ID || 'adcdebb0e3b6f583052d';
    const apiKey = process.env.HOSTBILL_API_KEY || '341697c41aeb1c842f0d';

    const apiUrl = new URL(`${hostbillUrl}/admin/api.php`);
    apiUrl.searchParams.append('api_id', apiId);
    apiUrl.searchParams.append('api_key', apiKey);
    apiUrl.searchParams.append('call', 'getAffiliate');
    apiUrl.searchParams.append('id', affiliateId);

    console.log(`🌐 Validating affiliate: ${apiUrl.toString()}`);

    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Partners-HostBill-Portal/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`📊 Affiliate validation response: ${data.success}`);

    if (!data.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid affiliate ID'
      });
    }

    const affiliate = data.affiliate;

    // Generate JWT token
    const token = jwt.sign(
      {
        affiliateId: affiliateId,
        affiliate_id: affiliateId,
        id: affiliateId,
        firstname: affiliate.firstname,
        lastname: affiliate.lastname,
        status: affiliate.status,
        email: affiliate.email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      },
      JWT_SECRET
    );

    console.log(`✅ Login successful for: ${affiliate.firstname} ${affiliate.lastname}`);

    // Set HTTP-only cookie for security
    res.setHeader('Set-Cookie', [
      `auth-token=${token}; HttpOnly; Path=/; Max-Age=${24 * 60 * 60}; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
    ]);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: token,
      user: {
        id: affiliateId,
        name: `${affiliate.firstname} ${affiliate.lastname}`,
        firstname: affiliate.firstname,
        lastname: affiliate.lastname,
        email: affiliate.email,
        status: affiliate.status
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Authentication service temporarily unavailable'
    });
  }
}
