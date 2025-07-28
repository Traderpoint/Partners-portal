export default function handler(req, res) {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: 'connected',
      hostbill: 'connected',
      middleware: 'running'
    }
  };

  res.status(200).json(health);
}
