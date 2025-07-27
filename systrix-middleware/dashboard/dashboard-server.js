// Middleware Dashboard Server - Port 3010
const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const app = express();
const PORT = 3010;
const MIDDLEWARE_URL = process.env.MIDDLEWARE_URL || 'http://localhost:3005';

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Dashboard stats storage
let dashboardStats = {
  startTime: new Date(),
  requests: 0,
  errors: 0,
  lastActivity: null,
  recentRequests: [],
  systemHealth: 'unknown'
};

// Middleware to track requests
app.use((req, res, next) => {
  dashboardStats.requests++;
  dashboardStats.lastActivity = new Date();
  
  // Store recent requests (keep last 50)
  dashboardStats.recentRequests.unshift({
    method: req.method,
    url: req.url,
    timestamp: new Date(),
    ip: req.ip
  });
  
  if (dashboardStats.recentRequests.length > 50) {
    dashboardStats.recentRequests = dashboardStats.recentRequests.slice(0, 50);
  }
  
  next();
});

// Main dashboard route
app.get('/', async (req, res) => {
  try {
    // Get middleware health
    const middlewareHealth = await checkMiddlewareHealth();
    
    // Get system stats
    const systemStats = await getSystemStats();
    
    // Get recent logs
    const recentLogs = await getRecentLogs();
    
    res.render('dashboard', {
      stats: dashboardStats,
      middlewareHealth,
      systemStats,
      recentLogs,
      uptime: Math.floor((new Date() - dashboardStats.startTime) / 1000)
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render('error', { error: error.message });
  }
});

// API Routes
app.get('/api/health', async (req, res) => {
  try {
    const middlewareHealth = await checkMiddlewareHealth();
    res.json({
      success: true,
      dashboard: {
        status: 'healthy',
        uptime: Math.floor((new Date() - dashboardStats.startTime) / 1000),
        requests: dashboardStats.requests,
        errors: dashboardStats.errors
      },
      middleware: middlewareHealth
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/stats', (req, res) => {
  res.json({
    success: true,
    stats: dashboardStats,
    uptime: Math.floor((new Date() - dashboardStats.startTime) / 1000)
  });
});

app.get('/api/logs', async (req, res) => {
  try {
    const logs = await getRecentLogs();
    res.json({
      success: true,
      logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test endpoints
app.get('/test', (req, res) => {
  res.render('test', { middlewareUrl: MIDDLEWARE_URL });
});

app.post('/api/test/middleware', async (req, res) => {
  try {
    const { endpoint, method = 'GET', data } = req.body;
    
    const config = {
      method,
      url: `${MIDDLEWARE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data && method !== 'GET') {
      config.data = data;
    }
    
    const response = await axios(config);
    
    res.json({
      success: true,
      status: response.status,
      data: response.data
    });
  } catch (error) {
    dashboardStats.errors++;
    res.status(500).json({
      success: false,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
});

// Helper functions
async function checkMiddlewareHealth() {
  try {
    const response = await axios.get(`${MIDDLEWARE_URL}/health`, { timeout: 5000 });
    dashboardStats.systemHealth = 'healthy';
    return {
      status: 'healthy',
      data: response.data,
      responseTime: response.headers['x-response-time'] || 'unknown'
    };
  } catch (error) {
    dashboardStats.systemHealth = 'unhealthy';
    return {
      status: 'unhealthy',
      error: error.message,
      code: error.code
    };
  }
}

async function getSystemStats() {
  const logDir = path.join(__dirname, '..', 'logs');
  const stats = {
    logFiles: [],
    totalLogSize: 0
  };
  
  try {
    if (fs.existsSync(logDir)) {
      const files = fs.readdirSync(logDir);
      for (const file of files) {
        const filePath = path.join(logDir, file);
        const stat = fs.statSync(filePath);
        stats.logFiles.push({
          name: file,
          size: stat.size,
          modified: stat.mtime
        });
        stats.totalLogSize += stat.size;
      }
    }
  } catch (error) {
    console.error('Error reading log stats:', error);
  }
  
  return stats;
}

async function getRecentLogs() {
  const logFile = path.join(__dirname, '..', 'logs', 'middleware.log');
  const logs = [];
  
  try {
    if (fs.existsSync(logFile)) {
      const content = fs.readFileSync(logFile, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      
      // Get last 100 lines
      const recentLines = lines.slice(-100);
      
      for (const line of recentLines) {
        try {
          const logEntry = JSON.parse(line);
          logs.push(logEntry);
        } catch (e) {
          // Skip invalid JSON lines
        }
      }
    }
  } catch (error) {
    console.error('Error reading logs:', error);
  }
  
  return logs.reverse(); // Most recent first
}

// Error handling
app.use((error, req, res, next) => {
  dashboardStats.errors++;
  console.error('Dashboard error:', error);
  res.status(500).render('error', { error: error.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎛️  Middleware Dashboard running on http://localhost:${PORT}`);
  console.log(`📊 Monitoring middleware at: ${MIDDLEWARE_URL}`);
  console.log(`🔍 Dashboard features:`);
  console.log(`   - Real-time monitoring`);
  console.log(`   - System health checks`);
  console.log(`   - Log viewer`);
  console.log(`   - API testing`);
});
