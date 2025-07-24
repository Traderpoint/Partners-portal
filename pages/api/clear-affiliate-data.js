// API endpoint to clear affiliate data from browser
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set headers to clear cookies
  res.setHeader('Set-Cookie', [
    'hb_affiliate=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax',
    'affiliate_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax'
  ]);

  res.status(200).json({
    success: true,
    message: 'Affiliate data cleared',
    instructions: [
      'Clear localStorage: affiliate_data',
      'Clear localStorage: cart', 
      'Clear cookies: hb_affiliate',
      'Refresh page'
    ]
  });
}
