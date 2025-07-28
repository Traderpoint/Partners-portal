// Mock data for middleware status
let dashboardStats = {
  requests: 0,
  errors: 0,
  startTime: Date.now()
};

export default function handler(req, res) {
  // Increment request counter
  dashboardStats.requests++;

  const uptime = Math.floor((Date.now() - dashboardStats.startTime) / 1000);
  
  const status = {
    online: true,
    port: 3005,
    version: '2.0.0',
    uptime: uptime
  };

  const mapping = {
    totalMappings: 4,
    cloudVpsProducts: [
      { id: '1', name: 'VPS Basic' },
      { id: '2', name: 'VPS Pro' },
      { id: '3', name: 'VPS Premium' },
      { id: '4', name: 'VPS Enterprise' }
    ],
    hostbillProducts: [
      { id: '5', name: 'VPS Start' },
      { id: '10', name: 'VPS Profi' },
      { id: '11', name: 'VPS Premium' },
      { id: '12', name: 'VPS Enterprise' }
    ],
    mappings: {
      '1': '5',
      '2': '10',
      '3': '11',
      '4': '12'
    }
  };

  const response = {
    status,
    mapping,
    uptime,
    hostbillConnected: true,
    middlewareUrl: process.env.MIDDLEWARE_URL || 'http://localhost:3005',
    lastUpdate: new Date().toISOString(),
    dashboardStats
  };

  res.status(200).json(response);
}
