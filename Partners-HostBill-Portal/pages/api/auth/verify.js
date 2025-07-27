const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'partners-portal-secret-2024';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get token from cookie or Authorization header
    let token = null;
    
    if (req.headers.cookie) {
      const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {});
      token = cookies['auth-token'];
    }
    
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'No authentication token provided' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if token is expired
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({ 
        success: false, 
        error: 'Token has expired' 
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: decoded.affiliateId || decoded.affiliate_id || decoded.id,
        name: `${decoded.firstname || ''} ${decoded.lastname || ''}`.trim(),
        firstname: decoded.firstname,
        lastname: decoded.lastname,
        email: decoded.email,
        status: decoded.status
      }
    });

  } catch (error) {
    console.error('Token verification error:', error.message);
    
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
}
