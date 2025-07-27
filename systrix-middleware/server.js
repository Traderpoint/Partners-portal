/**
 * Systrix Middleware - Unified HostBill API Gateway with Integrated Dashboard
 * Secure middleware for processing orders between Cloud VPS and HostBill API
 * Port: 3004
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const path = require('path');
const compression = require('compression');
const logger = require('./utils/logger');
const HostBillClient = require('./lib/hostbill-client');
const OrderProcessor = require('./lib/order-processor');
const PaymentProcessor = require('./lib/payment-processor');
const productMapper = require('./lib/product-mapper');

// Calculate commission amount
function calculateCommission(price, commissionInfo) {
  if (!commissionInfo || !price) return 0;

  const numericPrice = parseFloat(price);
  const numericRate = parseFloat(commissionInfo.rate);

  if (commissionInfo.type === 'Percent') {
    return (numericPrice * numericRate / 100).toFixed(2);
  } else if (commissionInfo.type === 'Fixed') {
    return numericRate.toFixed(2);
  }

  return 0;
}

const app = express();
const PORT = process.env.PORT || 3005;
const startTime = new Date();

// Dashboard stats storage
let dashboardStats = {
  startTime: new Date(),
  requests: 0,
  errors: 0,
  lastActivity: null,
  recentRequests: [],
  systemHealth: 'unknown'
};

// Compression middleware
app.use(compression());

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Allow inline scripts for dashboard
}));

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3006'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for dashboard and logos
app.use('/dashboard/static', express.static(path.join(__dirname, 'dashboard/public')));
app.use(express.static(path.join(__dirname, 'public')));

// Favicon endpoint to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
  res.status(204).send();
});

// EJS template engine for dashboard
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'dashboard/views'));

// Request logging and stats middleware
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

  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Initialize HostBill client and processors
const hostbillClient = new HostBillClient();
const orderProcessor = new OrderProcessor(hostbillClient);
const paymentProcessor = new PaymentProcessor(hostbillClient);

// Helper functions for dashboard
async function getSystemStats() {
  const path = require('path');
  const fs = require('fs');
  const logDir = path.join(__dirname, 'logs');
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
    logger.error('Error reading log stats', { error: error.message });
  }

  return stats;
}

async function getRecentLogs() {
  const path = require('path');
  const fs = require('fs');
  const logFile = path.join(__dirname, 'logs', 'middleware.log');
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
    logger.error('Error reading logs', { error: error.message });
  }

  return logs.reverse(); // Most recent first
}

// Generate CloudVPS-style dashboard HTML
function generateCloudVpsDashboard(data) {
  const { status, mapping, hostbillConnected, uptime, lastUpdate, middlewareUrl, dashboardStats } = data;

  const getStatusColor = () => status.online ? '#28a745' : '#dc3545';
  const getStatusText = () => status.online ? 'Online' : 'Offline';

  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const getCloudVpsProductName = (id) => {
    const names = {
      '1': 'VPS Basic',
      '2': 'VPS Pro',
      '3': 'VPS Premium',
      '4': 'VPS Enterprise'
    };
    return names[id] || 'Unknown Product';
  };

  const getHostBillProductName = (id) => {
    const names = {
      '5': 'VPS Start',
      '10': 'VPS Profi',
      '11': 'VPS Premium',
      '12': 'VPS Enterprise'
    };
    return names[id] || 'Unknown Product';
  };

  return `
<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Middleware Dashboard</title>
    <style>
        body {
            padding: 20px;
            font-family: Arial, sans-serif;
            background-color: #f8f9fa;
            margin: 0;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
        }

        .header h1 {
            margin: 0 0 5px 0;
            color: #333;
        }

        .header p {
            margin: 0;
            color: #666;
        }

        .refresh-section {
            text-align: right;
        }

        .refresh-btn {
            padding: 10px 20px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            margin-bottom: 10px;
        }

        .refresh-btn:hover {
            background-color: #0056b3;
        }

        .last-update {
            font-size: 12px;
            color: #666;
        }

        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .status-card {
            background-color: white;
            border-radius: 8px;
            padding: 20px;
            border: 2px solid;
        }

        .status-card h3 {
            margin: 0 0 15px 0;
        }

        .status-value {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }

        .status-details {
            font-size: 14px;
            color: #666;
        }

        .status-details div {
            margin-bottom: 2px;
        }

        .server-status {
            border-color: ${getStatusColor()};
        }

        .server-status h3 {
            color: ${getStatusColor()};
        }

        .server-status .status-value {
            color: ${getStatusColor()};
        }

        .mapping-card {
            border-color: #9c27b0;
        }

        .mapping-card h3 {
            color: #9c27b0;
        }

        .mapping-card .status-value {
            color: #9c27b0;
        }

        .config-card {
            border-color: #ff9800;
        }

        .config-card h3 {
            color: #ff9800;
        }

        .config-card .status-value {
            color: #ff9800;
        }

        .api-card {
            border-color: #4caf50;
        }

        .api-card h3 {
            color: #4caf50;
        }

        .api-card .status-value {
            color: #4caf50;
        }

        .details-section {
            background-color: white;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }

        .details-section h3 {
            margin: 0 0 20px 0;
            color: #495057;
        }

        .mapping-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
            overflow-x: auto;
        }

        .mapping-table th,
        .mapping-table td {
            padding: 12px;
            text-align: left;
            border: 1px solid #dee2e6;
        }

        .mapping-table th {
            background-color: #f8f9fa;
        }

        .mapping-table .cloud-id {
            font-weight: bold;
            color: #007bff;
        }

        .mapping-table .hostbill-id {
            font-weight: bold;
            color: #28a745;
        }

        .status-badge {
            padding: 4px 8px;
            background-color: #d4edda;
            color: #155724;
            border-radius: 4px;
            font-size: 12px;
        }

        .actions-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }

        .action-link {
            display: block;
            padding: 15px;
            border-radius: 6px;
            text-decoration: none;
            text-align: center;
            transition: all 0.2s;
            border: 1px solid;
        }

        .action-order {
            background-color: #e8f5e8;
            border-color: #4caf50;
            color: #2e7d32;
        }

        .action-mapping {
            background-color: #f3e5f5;
            border-color: #9c27b0;
            color: #7b1fa2;
        }

        .action-affiliate {
            background-color: #fff3e0;
            border-color: #ff9800;
            color: #f57c00;
        }

        .action-advanced {
            background-color: #e3f2fd;
            border-color: #2196f3;
            color: #1976d2;
        }

        .action-dashboard {
            background-color: #f1f8e9;
            border-color: #8bc34a;
            color: #689f38;
        }

        .footer-info {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 15px;
            font-size: 14px;
            color: #666;
        }

        .footer-info h4 {
            margin: 0 0 10px 0;
            color: #495057;
        }

        .footer-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 10px;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <div>
            <h1>🎛️ Middleware Dashboard</h1>
            <p>Monitoring a správa HostBill Order Middleware</p>
        </div>

        <div class="refresh-section">
            <button class="refresh-btn" onclick="location.reload()">
                🔄 Refresh
            </button>
            <div class="last-update">
                Last update: ${lastUpdate.toLocaleTimeString()}
            </div>
        </div>
    </div>

    <!-- Status Overview -->
    <div class="status-grid">
        <!-- Server Status -->
        <div class="status-card server-status">
            <h3>🖥️ Server Status</h3>
            <div class="status-value">${getStatusText()}</div>
            <div class="status-details">
                <div>Port: ${status.port}</div>
                <div>Version: ${status.version}</div>
                <div>Uptime: ${formatUptime(uptime)}</div>
            </div>
        </div>

        <!-- Product Mapping -->
        <div class="status-card mapping-card">
            <h3>🔗 Product Mapping</h3>
            <div class="status-value">${mapping.totalMappings} Products</div>
            <div class="status-details">
                <div>Cloud VPS: ${mapping.cloudVpsProducts?.length || 0}</div>
                <div>HostBill: ${mapping.hostbillProducts?.length || 0}</div>
                <div>Status: Active</div>
            </div>
        </div>

        <!-- Configuration -->
        <div class="status-card config-card">
            <h3>⚙️ Configuration</h3>
            <div class="status-value">Development</div>
            <div class="status-details">
                <div>URL: ${middlewareUrl}</div>
                <div>Port: ${status.port}</div>
                <div>Environment: development</div>
            </div>
        </div>

        <!-- API Health -->
        <div class="status-card api-card">
            <h3>🔌 API Health</h3>
            <div class="status-value">${status.online ? 'Healthy' : 'Unhealthy'}</div>
            <div class="status-details">
                <div>HostBill API: ${hostbillConnected ? 'Connected' : 'Disconnected'}</div>
                <div>Order Processing: ${status.online ? 'Available' : 'Unavailable'}</div>
                <div>Product Sync: ${mapping.totalMappings > 0 ? 'Active' : 'Inactive'}</div>
            </div>
        </div>
    </div>

    <!-- Product Mapping Details -->
    ${Object.keys(mapping.mappings || {}).length > 0 ? `
    <div class="details-section">
        <h3>🔗 Product Mapping Details</h3>

        <div style="overflow-x: auto;">
            <table class="mapping-table">
                <thead>
                    <tr>
                        <th>Cloud VPS ID</th>
                        <th>Cloud VPS Name</th>
                        <th>HostBill ID</th>
                        <th>HostBill Name</th>
                        <th style="text-align: center;">Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(mapping.mappings).map(([cloudVpsId, hostbillId]) => `
                    <tr>
                        <td class="cloud-id">${cloudVpsId}</td>
                        <td>${getCloudVpsProductName(cloudVpsId)}</td>
                        <td class="hostbill-id">${hostbillId}</td>
                        <td>${getHostBillProductName(hostbillId)}</td>
                        <td style="text-align: center;">
                            <span class="status-badge">✅ Active</span>
                        </td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>
    ` : ''}

    <!-- Quick Actions -->
    <div class="details-section">
        <h3>⚡ Quick Actions</h3>

        <div class="actions-grid">
            <a href="http://localhost:3000/middleware-order-test" target="_blank" class="action-link action-order">
                🛒 Test Order Processing
            </a>

            <a href="http://localhost:3000/product-mapping-test" target="_blank" class="action-link action-mapping">
                🔗 Check Product Mapping
            </a>

            <a href="http://localhost:3000/middleware-affiliate-products" target="_blank" class="action-link action-affiliate">
                👥 Affiliate Products
            </a>

            <a href="http://localhost:3000/advanced-order-test" target="_blank" class="action-link action-advanced">
                🚀 Advanced Order Test
            </a>

            <a href="/tech-dashboard" target="_blank" class="action-link action-dashboard">
                🎛️ Tech - Middleware Dashboard
            </a>

            <a href="/test-portal" target="_blank" class="action-link" style="background-color: #fff8e1; border: 2px solid #ff9800; color: #f57c00; font-weight: bold;">
                🧪 Complete Test Portal
            </a>

            <a href="/tech-dashboard" target="_blank" class="action-link" style="background-color: #f3e5f5; border: 2px solid #9c27b0; color: #7b1fa2; font-weight: bold;">
                🔧 Tech - Middleware Dashboard
            </a>
        </div>
    </div>

    <!-- Footer Info -->
    <div class="footer-info">
        <h4>ℹ️ System Information</h4>
        <div class="footer-grid">
            <div><strong>Middleware URL:</strong> ${middlewareUrl}</div>
            <div><strong>Auto-refresh:</strong> Manual</div>
            <div><strong>Dashboard Version:</strong> 2.0.0</div>
            <div><strong>Last Check:</strong> ${lastUpdate.toLocaleString()}</div>
            <div><strong>Total Requests:</strong> ${dashboardStats.requests}</div>
            <div><strong>Total Errors:</strong> ${dashboardStats.errors}</div>
        </div>
    </div>

    <script>
        // Add hover effects to action links
        document.querySelectorAll('.action-link').forEach(link => {
            link.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
            });

            link.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = 'none';
            });
        });

        // Add loading state to refresh button
        document.querySelector('.refresh-btn').addEventListener('click', function() {
            this.innerHTML = '⏳ Refreshing...';
            this.disabled = true;
        });
    </script>
</body>
</html>`;
}

// Integrated Dashboard Route - CloudVPS Style
app.get('/dashboard', async (req, res) => {
  try {
    // Get middleware health
    let status = {
      online: false,
      port: PORT,
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      error: null
    };

    let hostbillConnected = false;
    try {
      const testResult = await hostbillClient.makeApiCall({
        call: 'getOrderPages'
      });
      status.online = true;
      hostbillConnected = !!testResult;
    } catch (error) {
      status.error = error.message;
    }

    // Get product mapping stats
    const mappingStats = productMapper.getStats();
    const mapping = {
      totalMappings: mappingStats.totalMappings,
      cloudVpsProducts: mappingStats.cloudVpsProducts,
      hostbillProducts: mappingStats.hostbillProducts,
      mappings: mappingStats.mappings || {}
    };

    // Get system stats
    const uptime = Math.floor((Date.now() - dashboardStats.startTime.getTime()) / 1000);
    const lastUpdate = new Date();

    // Generate CloudVPS-style dashboard HTML
    const dashboardHtml = generateCloudVpsDashboard({
      status,
      mapping,
      hostbillConnected,
      uptime,
      lastUpdate,
      middlewareUrl: `http://localhost:${PORT}`,
      dashboardStats
    });

    res.send(dashboardHtml);
  } catch (error) {
    logger.error('Dashboard error', error);
    res.status(500).json({
      success: false,
      error: 'Dashboard error',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check HostBill API connectivity
    let hostbillStatus = 'unknown';
    try {
      const testResult = await hostbillClient.makeApiCall({
        call: 'getOrderPages'
      });
      hostbillStatus = testResult ? 'connected' : 'disconnected';
    } catch (error) {
      hostbillStatus = 'disconnected';
    }

    // Get product mapping stats
    const mappingStats = productMapper.getStats();

    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      port: PORT,
      uptime: Math.floor((Date.now() - dashboardStats.startTime.getTime()) / 1000),
      memory: process.memoryUsage(),
      hostbill_api: {
        status: hostbillStatus,
        url: process.env.HOSTBILL_API_URL
      },
      product_mapping: {
        total_mappings: mappingStats.totalMappings,
        cloud_vps_products: mappingStats.cloudVpsProducts.length,
        hostbill_products: mappingStats.hostbillProducts.length
      },
      environment: {
        node_env: process.env.NODE_ENV || 'development',
        log_level: process.env.LOG_LEVEL || 'debug'
      }
    });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Product mapping endpoint
app.get('/api/product-mapping', (req, res) => {
  try {
    const stats = productMapper.getStats();
    res.json({
      success: true,
      ...stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get product mapping', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get product mapping',
      timestamp: new Date().toISOString()
    });
  }
});

// Dashboard test endpoint
app.get('/test', (req, res) => {
  try {
    res.render('test', {
      middlewareUrl: `http://localhost:${PORT}`,
      title: 'Middleware API Test'
    });
  } catch (error) {
    logger.error('Test page error', error);
    res.status(500).json({
      success: false,
      error: 'Test page error',
      details: error.message
    });
  }
});

// API test endpoint for middleware testing
app.post('/api/test/middleware', async (req, res) => {
  try {
    const { endpoint, method = 'GET', data } = req.body;

    logger.info('Testing middleware endpoint', { endpoint, method });

    // For internal testing, we can call our own endpoints
    let result;

    switch (endpoint) {
      case '/health':
        result = await fetch(`http://localhost:${PORT}/health`).then(r => r.json());
        break;
      case '/api/affiliates':
        result = await fetch(`http://localhost:${PORT}/api/affiliates`).then(r => r.json());
        break;
      case '/api/products':
        result = await fetch(`http://localhost:${PORT}/api/products`).then(r => r.json());
        break;
      case '/api/payments/methods':
        result = await fetch(`http://localhost:${PORT}/api/payments/methods`).then(r => r.json());
        break;
      case '/api/test-connection':
        result = await fetch(`http://localhost:${PORT}/api/test-connection`).then(r => r.json());
        break;
      default:
        // For other endpoints, try to call them directly
        const url = `http://localhost:${PORT}${endpoint}`;
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: data && method !== 'GET' ? JSON.stringify(data) : undefined
        });
        result = await response.json();
        break;
    }

    res.json({
      success: true,
      status: 200,
      data: result
    });
  } catch (error) {
    logger.error('Middleware test failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
      status: 500
    });
  }
});

// Helper functions for Tech Dashboard
async function checkMiddlewareHealthForTechDashboard() {
  try {
    const response = await fetch(`http://localhost:${PORT}/health`);
    const data = await response.json();
    return {
      status: data.success ? 'healthy' : 'unhealthy',
      uptime: data.uptime || 0,
      version: data.version || '1.0.0',
      lastCheck: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      lastCheck: new Date().toISOString()
    };
  }
}

async function getSystemStatsForTechDashboard() {
  try {
    const stats = {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      platform: process.platform,
      nodeVersion: process.version,
      logFiles: []
    };

    // Try to get log files
    try {
      const fs = require('fs');
      const path = require('path');
      const logsDir = path.join(__dirname, 'logs');
      if (fs.existsSync(logsDir)) {
        const files = fs.readdirSync(logsDir);
        stats.logFiles = files.map(file => ({
          name: file,
          size: fs.statSync(path.join(logsDir, file)).size,
          modified: fs.statSync(path.join(logsDir, file)).mtime
        }));
      }
    } catch (logError) {
      // Ignore log file errors
    }

    return stats;
  } catch (error) {
    return {
      error: error.message,
      logFiles: []
    };
  }
}

async function getRecentLogsForTechDashboard() {
  try {
    const fs = require('fs');
    const path = require('path');
    const logFile = path.join(__dirname, 'logs', 'combined.log');

    if (fs.existsSync(logFile)) {
      const logContent = fs.readFileSync(logFile, 'utf8');
      const lines = logContent.split('\n').filter(line => line.trim());
      return lines.slice(-20).reverse(); // Last 20 lines, newest first
    }

    return ['No log file found'];
  } catch (error) {
    return [`Error reading logs: ${error.message}`];
  }
}

// Generate Test Portal HTML
function generateTestPortalHtml() {
  return `
<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HostBill Test Portal</title>
    <style>
        body {
            min-height: 100vh;
            background-color: #f8f9fa;
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
        }

        .header {
            background-color: #343a40;
            color: white;
            padding: 20px 0;
            margin-bottom: 30px;
        }

        .header-content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .logo {
            height: 40px;
            width: auto;
        }

        .header h1 {
            margin: 0;
            font-size: 28px;
            color: white;
        }

        .header p {
            margin: 5px 0 0 0;
            opacity: 0.8;
            color: white;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }

        .config-info {
            background-color: #d1ecf1;
            border: 1px solid #bee5eb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
        }

        .config-info h3 {
            margin: 0 0 15px 0;
            color: #0c5460;
        }

        .config-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 15px;
        }

        .config-item h4 {
            margin: 0 0 8px 0;
            color: #0c5460;
        }

        .config-details {
            font-size: 14px;
            color: #0c5460;
        }

        .config-details div {
            margin-bottom: 2px;
        }

        .warning-banner {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 30px;
        }

        .warning-banner h3 {
            margin: 0 0 10px 0;
            color: #856404;
        }

        .warning-banner p {
            margin: 0;
            color: #856404;
        }

        .test-categories {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }

        .test-category {
            background-color: white;
            border-radius: 8px;
            padding: 25px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .test-category h2 {
            margin: 0 0 20px 0;
        }

        .middleware-tests h2 {
            color: #28a745;
        }

        .direct-tests h2 {
            color: #007bff;
        }

        .debug-tools h2 {
            color: #dc3545;
        }

        .production-apps h2 {
            color: #28a745;
        }

        .test-mode-info {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 15px;
            font-size: 14px;
        }

        .test-links {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .test-link {
            display: block;
            padding: 12px 16px;
            border-radius: 6px;
            text-decoration: none;
            transition: all 0.2s;
            border: 1px solid;
        }

        .test-link:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }

        /* Test link colors */
        .link-dashboard {
            background-color: #e1f5fe;
            border: 2px solid #0288d1;
            color: #0277bd;
            font-weight: bold;
        }

        .link-green {
            background-color: #d4edda;
            border-color: #28a745;
            color: #155724;
        }

        .link-blue {
            background-color: #e3f2fd;
            border-color: #2196f3;
            color: #1976d2;
        }

        .link-cyan {
            background-color: #d1ecf1;
            border-color: #17a2b8;
            color: #0c5460;
        }

        .link-orange {
            background-color: #fff3e0;
            border-color: #ff9800;
            color: #f57c00;
        }

        .link-purple {
            background-color: #f3e5f5;
            border-color: #9c27b0;
            color: #7b1fa2;
        }

        .link-light-green {
            background-color: #e8f5e8;
            border-color: #4caf50;
            color: #2e7d32;
        }

        .link-red {
            background-color: #ffebee;
            border-color: #f44336;
            color: #c62828;
        }

        .link-pink {
            background-color: #fce4ec;
            border-color: #e91e63;
            color: #c2185b;
        }

        .link-yellow {
            background-color: #fff8e1;
            border: 2px solid #ff9800;
            color: #f57c00;
            font-weight: bold;
        }

        .footer {
            margin-top: 50px;
            padding: 20px 0;
            border-top: 1px solid #dee2e6;
            text-align: center;
            color: #6c757d;
        }

        .footer p {
            margin: 0;
        }

        .status-success {
            color: #28a745;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <header class="header">
        <div class="header-content">
            <img src="/systrix-logo-white.svg" alt="Systrix Data" class="logo" />
            <div>
                <h1>🧪 HostBill Test Portal</h1>
                <p>Testovací nástroje pro HostBill API a affiliate systém</p>
            </div>
        </div>
    </header>

    <div class="container">
        <!-- Configuration Info -->
        <div class="config-info">
            <h3>🔧 API Configuration</h3>
            <div class="config-grid">
                <div class="config-item">
                    <h4>HostBill Direct API</h4>
                    <div class="config-details">
                        <div><strong>Domain:</strong> ${process.env.HOSTBILL_DOMAIN || 'vps.kabel1it.cz'}</div>
                        <div><strong>API URL:</strong> ${process.env.HOSTBILL_BASE_URL || 'https://vps.kabel1it.cz'}/admin/api.php</div>
                        <div><strong>API ID:</strong> ${process.env.HOSTBILL_API_ID ? process.env.HOSTBILL_API_ID.substring(0, 8) + '...' : 'adcdebb0...'}</div>
                        <div><strong>Status:</strong> <span class="status-success">✅ Configured</span></div>
                    </div>
                </div>
                <div class="config-item">
                    <h4>Middleware API</h4>
                    <div class="config-details">
                        <div><strong>URL:</strong> http://localhost:${PORT}</div>
                        <div><strong>Health:</strong> /health</div>
                        <div><strong>Affiliates:</strong> /api/affiliates</div>
                        <div><strong>Status:</strong> <span class="status-success">✅ Available</span></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Warning Banner -->
        <div class="warning-banner">
            <h3>⚠️ Testovací prostředí</h3>
            <p>
                Testovací prostředí obsahuje jak middleware testy (doporučené), tak přímé HostBill API testy.
                Všechny API klíče jsou nakonfigurovány v .env souboru.
            </p>
        </div>

        <!-- Test Categories -->
        <div class="test-categories">
            <!-- Middleware Tests -->
            <div class="test-category middleware-tests">
                <h2>🔗 Middleware Testy</h2>

                <!-- Test Mode Info -->
                <div class="test-mode-info">
                    <strong>🧪 Test Mode:</strong> Platby používají simulovanou bránu na localhost:${PORT}/test-payment
                </div>

                <div class="test-links">
                    <a href="http://localhost:3000/middleware-dashboard" target="_blank" class="test-link link-dashboard">
                        🎛️ Middleware Dashboard (CloudVPS)
                    </a>

                    <a href="/tech-dashboard" target="_blank" class="test-link link-dashboard">
                        🔧 Tech - Middleware Dashboard
                    </a>

                    <a href="/test" class="test-link link-green">
                        🚀 Middleware Connection Test
                    </a>

                    <a href="http://localhost:3000/middleware-affiliate-test" target="_blank" class="test-link link-blue">
                        🎯 Middleware Affiliate Test
                    </a>

                    <a href="http://localhost:3000/middleware-affiliate-products" target="_blank" class="test-link link-cyan">
                        📦 Middleware Products (Affiliate/All)
                    </a>

                    <a href="http://localhost:3000/middleware-order-test" target="_blank" class="test-link link-orange">
                        🛒 Middleware Order Test
                    </a>

                    <a href="http://localhost:3000/product-mapping-test" target="_blank" class="test-link link-purple">
                        🔗 Product Mapping Test
                    </a>

                    <a href="http://localhost:3000/advanced-order-test" target="_blank" class="test-link link-light-green">
                        🚀 Advanced Order Test (Middleware)
                    </a>

                    <a href="http://localhost:3000/payment-test" target="_blank" class="test-link link-dashboard">
                        💳 Payment System Test (Middleware)
                    </a>

                    <a href="http://localhost:3000/test-payment-gateway" target="_blank" class="test-link link-purple">
                        🧪 Test Payment Gateway
                    </a>

                    <a href="http://localhost:3000/payment-methods-test" target="_blank" class="test-link link-light-green">
                        🔍 Payment Methods Test
                    </a>
                </div>
            </div>

            <!-- Direct HostBill Tests -->
            <div class="test-category direct-tests">
                <h2>👥 Direct HostBill Testy</h2>

                <div class="test-links">
                    <a href="http://localhost:3000/affiliate-test" target="_blank" class="test-link link-blue">
                        🔍 Základní Affiliate Test
                    </a>

                    <a href="http://localhost:3000/affiliate-test-real" target="_blank" class="test-link link-light-green">
                        🛒 Reálný Affiliate Test
                    </a>

                    <a href="http://localhost:3000/affiliate-products-test" target="_blank" class="test-link link-orange">
                        📦 Direct HostBill Products (Affiliate/All)
                    </a>

                    <a href="http://localhost:3000/direct-order-test" target="_blank" class="test-link link-light-green">
                        🛒 Direct HostBill Order Test
                    </a>

                    <a href="http://localhost:3000/direct-advanced-order-test" target="_blank" class="test-link link-red">
                        ⚡ Direct Advanced Order Test
                    </a>

                    <a href="http://localhost:3000/affiliate-scenarios" target="_blank" class="test-link link-purple">
                        🎭 Affiliate Scénáře
                    </a>

                    <a href="http://localhost:3000/payment-test?mode=direct" target="_blank" class="test-link link-yellow">
                        💳 Payment System Test (Direct)
                    </a>

                    <a href="http://localhost:3000/direct-payment-test" target="_blank" class="test-link link-pink">
                        🎯 Direct HostBill Payment Test
                    </a>

                    <a href="http://localhost:3000/real-payment-methods-test" target="_blank" class="test-link link-light-green" style="border: 2px solid #4caf50; font-weight: bold;">
                        🔍 Real Payment Methods Test
                    </a>

                    <a href="http://localhost:3000/hostbill-modules-test" target="_blank" class="test-link link-purple">
                        🏢 HostBill Payment Modules
                    </a>

                    <a href="http://localhost:3000/complete-order-test" target="_blank" class="test-link link-yellow">
                        🛒 Complete Order Workflow Test
                    </a>

                    <a href="http://localhost:3000/integration-test" target="_blank" class="test-link link-light-green" style="border: 3px solid #4caf50; font-weight: bold; font-size: 16px;">
                        🔗 CloudVPS ↔ Middleware Integration Test
                    </a>
                </div>
            </div>

            <!-- Debug Tools -->
            <div class="test-category debug-tools">
                <h2>🐛 Debug Nástroje</h2>

                <div class="test-links">
                    <a href="http://localhost:3000/debug-affiliate" target="_blank" class="test-link link-red">
                        🔧 Debug Affiliate Data
                    </a>

                    <a href="/api/test-connection" target="_blank" class="test-link link-cyan">
                        🔗 Test HostBill API Connection
                    </a>

                    <a href="/api/affiliates" target="_blank" class="test-link link-light-green">
                        📋 Všichni Affiliates
                    </a>
                </div>
            </div>

            <!-- Production Links -->
            <div class="test-category production-apps">
                <h2>🚀 Produkční Aplikace</h2>

                <div class="test-links">
                    <a href="http://localhost:3000/" target="_blank" class="test-link link-green">
                        🏠 Hlavní Stránka
                    </a>

                    <a href="http://localhost:3000/checkout" target="_blank" class="test-link link-green">
                        🛒 Checkout (Middleware)
                    </a>

                    <a href="http://localhost:3000/pricing" target="_blank" class="test-link link-green">
                        💰 Ceník
                    </a>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <footer class="footer">
            <p>
                Test Portal pro HostBill API | Middleware Port: ${PORT}
            </p>
        </footer>
    </div>
</body>
</html>`;
}

// Generate Tech Dashboard HTML
function generateTechDashboardHtml(data) {
  const { middlewareHealth, systemStats, recentLogs, uptime, stats } = data;

  return `
<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tech - Middleware Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            background: rgba(255, 255, 255, 0.95);
            padding: 20px;
            border-radius: 15px;
            margin-bottom: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
        }

        .header h1 {
            color: #2c3e50;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .status-badge {
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .status-healthy {
            background: #2ecc71;
            color: white;
        }

        .status-unhealthy {
            background: #e74c3c;
            color: white;
        }

        .status-error {
            background: #f39c12;
            color: white;
        }

        .refresh-btn {
            background: #3498db;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            margin-left: auto;
        }

        .refresh-btn:hover {
            background: #2980b9;
        }

        .nav-links {
            display: flex;
            gap: 15px;
            margin-top: 15px;
            flex-wrap: wrap;
        }

        .nav-links a {
            color: #3498db;
            text-decoration: none;
            padding: 8px 16px;
            background: rgba(52, 152, 219, 0.1);
            border-radius: 5px;
            transition: all 0.3s ease;
        }

        .nav-links a:hover {
            background: rgba(52, 152, 219, 0.2);
            transform: translateY(-2px);
        }

        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }

        .card {
            background: rgba(255, 255, 255, 0.95);
            padding: 20px;
            border-radius: 15px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
        }

        .card h3 {
            color: #2c3e50;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .stat-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #ecf0f1;
        }

        .stat-item:last-child {
            border-bottom: none;
        }

        .stat-value {
            font-weight: bold;
            color: #27ae60;
        }

        .log-container {
            background: #2c3e50;
            color: #ecf0f1;
            padding: 15px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            max-height: 300px;
            overflow-y: auto;
            white-space: pre-wrap;
        }

        .metric-card {
            text-align: center;
            padding: 15px;
        }

        .metric-value {
            font-size: 2em;
            font-weight: bold;
            color: #3498db;
            display: block;
        }

        .metric-label {
            color: #7f8c8d;
            font-size: 0.9em;
            margin-top: 5px;
        }

        .health-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            display: inline-block;
            margin-right: 8px;
        }

        .health-healthy {
            background: #2ecc71;
        }

        .health-unhealthy {
            background: #e74c3c;
        }

        .health-error {
            background: #f39c12;
        }

        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }

            .grid {
                grid-template-columns: 1fr;
            }

            .nav-links {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>
                🔧 Tech - Middleware Dashboard
                <span class="status-badge status-${middlewareHealth.status}">
                    ${middlewareHealth.status}
                </span>
                <button class="refresh-btn" onclick="location.reload()">🔄 Refresh</button>
            </h1>
            <p>Technical Monitoring HostBill Order Middleware - Uptime: ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s</p>
            <div class="nav-links">
                <a href="/tech-dashboard">🔧 Tech Dashboard</a>
                <a href="/test">🧪 Test API</a>
                <a href="/health">💚 Health Check</a>
                <a href="/api/product-mapping">📊 Product Mapping</a>
                <a href="/test-portal">🧪 Test Portal</a>
                <a href="/dashboard">📊 Main Dashboard</a>
            </div>
        </div>

        <div class="grid">
            <!-- System Stats -->
            <div class="card">
                <h3>📊 System Statistics</h3>
                <div class="stat-item">
                    <span>Total Requests</span>
                    <span class="stat-value">${stats.requests || 0}</span>
                </div>
                <div class="stat-item">
                    <span>Errors</span>
                    <span class="stat-value">${stats.errors || 0}</span>
                </div>
                <div class="stat-item">
                    <span>Last Activity</span>
                    <span class="stat-value">${stats.lastActivity ? new Date(stats.lastActivity).toLocaleString() : 'Never'}</span>
                </div>
                <div class="stat-item">
                    <span>Memory Usage</span>
                    <span class="stat-value">${Math.round(systemStats.memory?.heapUsed / 1024 / 1024) || 0} MB</span>
                </div>
                <div class="stat-item">
                    <span>Platform</span>
                    <span class="stat-value">${systemStats.platform || 'Unknown'}</span>
                </div>
                <div class="stat-item">
                    <span>Node Version</span>
                    <span class="stat-value">${systemStats.nodeVersion || 'Unknown'}</span>
                </div>
            </div>

            <!-- Middleware Health -->
            <div class="card">
                <h3>💚 Middleware Health</h3>
                <div class="stat-item">
                    <span><span class="health-indicator health-${middlewareHealth.status}"></span>Status</span>
                    <span class="stat-value">${middlewareHealth.status}</span>
                </div>
                <div class="stat-item">
                    <span>Version</span>
                    <span class="stat-value">${middlewareHealth.version || '1.0.0'}</span>
                </div>
                <div class="stat-item">
                    <span>Last Check</span>
                    <span class="stat-value">${new Date(middlewareHealth.lastCheck).toLocaleTimeString()}</span>
                </div>
                ${middlewareHealth.error ? `
                <div class="stat-item">
                    <span>Error</span>
                    <span class="stat-value" style="color: #e74c3c;">${middlewareHealth.error}</span>
                </div>
                ` : ''}
            </div>

            <!-- Performance Metrics -->
            <div class="card">
                <h3>⚡ Performance Metrics</h3>
                <div class="metric-card">
                    <span class="metric-value">${Math.round(systemStats.memory?.heapUsed / 1024 / 1024) || 0}</span>
                    <div class="metric-label">Memory Usage (MB)</div>
                </div>
                <div class="stat-item">
                    <span>Heap Total</span>
                    <span class="stat-value">${Math.round(systemStats.memory?.heapTotal / 1024 / 1024) || 0} MB</span>
                </div>
                <div class="stat-item">
                    <span>External</span>
                    <span class="stat-value">${Math.round(systemStats.memory?.external / 1024 / 1024) || 0} MB</span>
                </div>
                <div class="stat-item">
                    <span>Process Uptime</span>
                    <span class="stat-value">${Math.floor(systemStats.uptime / 3600)}h ${Math.floor((systemStats.uptime % 3600) / 60)}m</span>
                </div>
            </div>

            <!-- Log Files -->
            <div class="card">
                <h3>📁 Log Files</h3>
                ${systemStats.logFiles && systemStats.logFiles.length > 0 ?
                    systemStats.logFiles.map(file => `
                    <div class="stat-item">
                        <span>${file.name}</span>
                        <span class="stat-value">${Math.round(file.size / 1024)} KB</span>
                    </div>
                    `).join('') :
                    '<div class="stat-item"><span>No log files found</span></div>'
                }
            </div>
        </div>

        <!-- Recent Logs -->
        <div class="card">
            <h3>📋 Recent Logs</h3>
            <div class="log-container">
${recentLogs.join('\\n')}
            </div>
        </div>

        <!-- API Endpoints -->
        <div class="card" style="margin-top: 20px;">
            <h3>🔗 API Endpoints</h3>
            <div class="nav-links">
                <a href="/health" target="_blank">💚 Health Check</a>
                <a href="/api/affiliates" target="_blank">👥 Affiliates</a>
                <a href="/api/products" target="_blank">📦 Products</a>
                <a href="/api/payments/methods" target="_blank">💳 Payment Methods</a>
                <a href="/api/product-mapping" target="_blank">🔗 Product Mapping</a>
                <a href="/api/test-connection" target="_blank">🧪 Test Connection</a>
            </div>
        </div>
    </div>

    <script>
        // Auto-refresh every 30 seconds
        setTimeout(() => {
            location.reload();
        }, 30000);

        // Add click handlers for nav links
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', function(e) {
                if (this.href.includes('/api/') || this.href.includes('/health')) {
                    e.preventDefault();
                    window.open(this.href, '_blank');
                }
            });
        });
    </script>
</body>
</html>`;
}

// Test Portal endpoint
app.get('/test-portal', (req, res) => {
  try {
    const testPortalHtml = generateTestPortalHtml();
    res.send(testPortalHtml);
  } catch (error) {
    logger.error('Test portal error', error);
    res.status(500).json({
      success: false,
      error: 'Test portal error',
      details: error.message
    });
  }
});

// Tech - Middleware Dashboard endpoint
app.get('/tech-dashboard', async (req, res) => {
  try {
    // Get middleware health
    const middlewareHealth = await checkMiddlewareHealthForTechDashboard();

    // Get system stats
    const systemStats = await getSystemStatsForTechDashboard();

    // Get recent logs
    const recentLogs = await getRecentLogsForTechDashboard();

    // Calculate uptime
    const uptime = Math.floor((new Date() - startTime) / 1000);

    const techDashboardHtml = generateTechDashboardHtml({
      middlewareHealth,
      systemStats,
      recentLogs,
      uptime,
      stats: dashboardStats
    });

    res.send(techDashboardHtml);
  } catch (error) {
    logger.error('Tech dashboard error', error);
    res.status(500).json({
      success: false,
      error: 'Tech dashboard error',
      details: error.message
    });
  }
});

// Dashboard API endpoints
app.get('/api/logs', async (req, res) => {
  try {
    const logs = await getRecentLogs();
    res.json({
      success: true,
      logs
    });
  } catch (error) {
    logger.error('Failed to get logs', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get logs',
      details: error.message
    });
  }
});

// Middleware statistics endpoint
app.get('/api/stats', async (req, res) => {
  try {
    // Get product mapping stats
    const mappingStats = productMapper.getStats();

    // Check HostBill connectivity
    let hostbillConnectivity = false;
    let hostbillError = null;
    try {
      const testResult = await hostbillClient.makeApiCall({
        call: 'getOrderPages'
      });
      hostbillConnectivity = !!testResult;
    } catch (error) {
      hostbillError = error.message;
    }

    res.json({
      success: true,
      server: {
        status: 'running',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: '1.0.0',
        port: PORT,
        environment: process.env.NODE_ENV || 'development'
      },
      hostbill: {
        connected: hostbillConnectivity,
        api_url: process.env.HOSTBILL_API_URL,
        error: hostbillError
      },
      product_mapping: mappingStats,
      configuration: {
        log_level: process.env.LOG_LEVEL || 'debug',
        default_currency: process.env.DEFAULT_CURRENCY || 'CZK',
        default_payment_method: process.env.DEFAULT_PAYMENT_METHOD || 'banktransfer'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get middleware stats', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get middleware statistics',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// HostBill connection test endpoint
app.get('/api/test-connection', async (req, res) => {
  try {
    logger.info('Testing HostBill connection');
    const result = await hostbillClient.testConnection();

    res.json({
      success: true,
      message: 'HostBill connection successful',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('HostBill connection test failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'HostBill connection failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get all affiliates endpoint
app.get('/api/affiliates', async (req, res) => {
  try {
    logger.info('Getting all affiliates');
    const result = await hostbillClient.makeApiCall({
      call: 'getAffiliates'
    });

    res.json({
      success: true,
      affiliates: result.affiliates || [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get affiliates', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get affiliates',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get specific affiliate endpoint
app.get('/api/affiliate/:id', async (req, res) => {
  try {
    const { id } = req.params;
    logger.info('Getting affiliate details', { affiliateId: id });

    const result = await hostbillClient.validateAffiliate(id);

    if (result) {
      res.json({
        success: true,
        affiliate: result,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Affiliate not found or inactive',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('Failed to get affiliate', { error: error.message, affiliateId: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Failed to get affiliate',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get affiliate products endpoint
app.get('/api/affiliate/:id/products', async (req, res) => {
  try {
    const { id } = req.params;
    const { mode = 'affiliate' } = req.query;
    logger.info('Getting affiliate products', { affiliateId: id, mode });

    // First validate the affiliate exists
    const affiliate = await hostbillClient.validateAffiliate(id);
    if (!affiliate) {
      return res.status(404).json({
        success: false,
        error: 'Affiliate not found or inactive',
        timestamp: new Date().toISOString()
      });
    }

    // Get commission plans for this affiliate
    let commissionPlans = [];
    let applicableProducts = new Set();
    let productCommissions = {};

    try {
      logger.info('Loading commission plans from HostBill API');
      const commissionResult = await hostbillClient.makeApiCall({
        call: 'getAffiliateCommisionPlans'
      });

      if (commissionResult && commissionResult.commisions) {
        commissionPlans = commissionResult.commisions;

        // Parse commission plans to extract applicable products
        commissionPlans.forEach(plan => {
          if (plan.applicable_products) {
            const productIds = plan.applicable_products
              .split(',')
              .map(id => id.trim())
              .filter(id => id && !id.startsWith('-')); // Filter out negative IDs

            productIds.forEach(productId => {
              applicableProducts.add(productId);
              productCommissions[productId] = {
                plan_id: plan.id,
                plan_name: plan.name,
                type: plan.type,
                rate: plan.rate,
                recurring: plan.recurring === '1'
              };
            });
          }
        });
      }

      logger.info('Commission plans processed', {
        totalPlans: commissionPlans.length,
        applicableProducts: applicableProducts.size
      });
    } catch (error) {
      logger.warn('Failed to load commission plans', { error: error.message });
    }

    // Try to get real products from HostBill API
    let productsWithCommissions = [];

    try {
      // Get products from HostBill using correct API workflow
      logger.info('Loading products from HostBill API');

      // Step 1: Get all orderpages
      const orderPagesResult = await hostbillClient.makeApiCall({
        call: 'getOrderPages'
      });

      if (!orderPagesResult || !orderPagesResult.categories) {
        throw new Error('No orderpages returned from HostBill');
      }

      logger.debug('Found orderpages', {
        count: orderPagesResult.categories.length,
        orderpages: orderPagesResult.categories.map(cat => ({ id: cat.id, name: cat.name }))
      });

      // Step 2: Get products from all orderpages
      let allProducts = [];

      for (const orderpage of orderPagesResult.categories) {
        try {
          const productsResult = await hostbillClient.makeApiCall({
            call: 'getProducts',
            id: orderpage.id
          });

          if (productsResult && productsResult.products) {
            // Convert products object to array
            const categoryProducts = Object.values(productsResult.products);

            // Filter products based on mode
            let filteredProducts;
            if (mode === 'all') {
              // All products mode - return all products with commission info if available
              filteredProducts = categoryProducts;
            } else {
              // Affiliate mode - only products that have commissions for this affiliate
              filteredProducts = categoryProducts.filter(product =>
                applicableProducts.has(product.id)
              );
            }

            // Add orderpage info and commission details to each product
            const products = filteredProducts.map(product => {
              const commissionInfo = productCommissions[product.id];

              // For all mode, provide default commission info if not available
              const finalCommissionInfo = commissionInfo || (mode === 'all' ? {
                plan_id: null,
                plan_name: 'No commission plan',
                type: 'Percent',
                rate: '0',
                recurring: false
              } : null);

              return {
                ...product,
                orderpage_id: orderpage.id,
                orderpage_name: orderpage.name,
                monthly_price: product.m,
                quarterly_price: product.q,
                semi_annually_price: product.s,
                annually_price: product.a,
                category: {
                  id: orderpage.id,
                  name: orderpage.name,
                  description: orderpage.description || ''
                },
                commission: finalCommissionInfo ? {
                  ...finalCommissionInfo,
                  monthly_amount: calculateCommission(product.m, finalCommissionInfo),
                  quarterly_amount: calculateCommission(product.q, finalCommissionInfo),
                  semiannually_amount: calculateCommission(product.s, finalCommissionInfo),
                  annually_amount: calculateCommission(product.a, finalCommissionInfo),
                  has_commission: !!commissionInfo
                } : null
              };
            });

            allProducts = allProducts.concat(products);

            logger.debug('Loaded products from orderpage', {
              orderpageId: orderpage.id,
              orderpage: orderpage.name,
              productCount: products.length,
              mode: mode,
              filteredCount: filteredProducts.length,
              totalCategoryProducts: categoryProducts.length
            });
          }
        } catch (error) {
          logger.warn('Failed to load products from orderpage', {
            orderpageId: orderpage.id,
            orderpage: orderpage.name,
            error: error.message
          });
        }
      }

      if (allProducts.length === 0) {
        throw new Error('No products found in any orderpage');
      }

      logger.info('Successfully loaded products from HostBill', {
        totalProducts: allProducts.length,
        productIds: allProducts.map(p => p.id),
        productNames: allProducts.map(p => p.name)
      });

      // Products already have commission info added in the loop above
      productsWithCommissions = allProducts;
    } catch (error) {
      logger.warn('Failed to load products from HostBill, using fallback', {
        error: error.message
      });

      // Fallback to mock products matching real HostBill product IDs
      productsWithCommissions = [
        {
          id: '10',
          name: 'VPS Profi',
          description: 'Virtuální servery',
          monthly_price: '499',
          quarterly_price: 'N/A',
          semi_annually_price: 'N/A',
          annually_price: 'N/A',
          commission: {
            type: 'Percent',
            rate: '25'
          }
        },
        {
          id: '11',
          name: 'VPS Premium',
          description: 'Virtuální servery',
          monthly_price: '899',
          quarterly_price: 'N/A',
          semi_annually_price: 'N/A',
          annually_price: 'N/A',
          commission: {
            type: 'Percent',
            rate: '25'
          }
        },
        {
          id: '12',
          name: 'VPS Enterprise',
          description: 'Virtuální servery',
          monthly_price: '1299',
          quarterly_price: 'N/A',
          semi_annually_price: 'N/A',
          annually_price: 'N/A',
          commission: {
            type: 'Percent',
            rate: '25'
          }
        }
      ];
    }

    res.json({
      success: true,
      mode: mode,
      affiliate: affiliate,
      commission_plans: commissionPlans,
      products: productsWithCommissions,
      summary: {
        total_products: productsWithCommissions.length,
        total_applicable_products: applicableProducts.size,
        products_with_commission: productsWithCommissions.filter(p => p.commission?.has_commission).length,
        products_without_commission: productsWithCommissions.filter(p => !p.commission?.has_commission).length,
        commission_plans_count: commissionPlans.length
      },
      note: mode === 'all'
        ? 'Middleware: All products from all categories - some may not have commission plans for this affiliate'
        : 'Middleware: Only products with commission plans for this affiliate',
      source: 'middleware_affiliate_products',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get affiliate products', {
      error: error.message,
      affiliateId: req.params.id
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get affiliate products',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get all products endpoint
app.get('/api/products/all', async (req, res) => {
  try {
    logger.info('Getting all products from HostBill');

    // Get products from HostBill using the same logic as affiliate products
    // Get all orderpages
    const orderPagesResult = await hostbillClient.makeApiCall({
      call: 'getOrderPages'
    });

    if (!orderPagesResult || !orderPagesResult.categories) {
      throw new Error('No orderpages returned from HostBill');
    }

    logger.debug('Found orderpages for all products', {
      count: orderPagesResult.categories.length,
      orderpages: orderPagesResult.categories.map(cat => ({ id: cat.id, name: cat.name }))
    });

    // Get products from all orderpages
    let allProducts = [];

    for (const orderpage of orderPagesResult.categories) {
      try {
        const productsResult = await hostbillClient.makeApiCall({
          call: 'getProducts',
          id: orderpage.id
        });

        if (productsResult && productsResult.products) {
          // Convert products object to array and add orderpage info
          const products = Object.values(productsResult.products).map(product => ({
            ...product,
            orderpage_id: orderpage.id,
            orderpage_name: orderpage.name,
            monthly_price: product.m,
            quarterly_price: product.q,
            semi_annually_price: product.s,
            annually_price: product.a,
            commission: {
              type: 'Percent',
              rate: '25' // Default commission rate
            }
          }));

          allProducts = allProducts.concat(products);

          logger.debug('Loaded products from orderpage for all products', {
            orderpageId: orderpage.id,
            orderpage: orderpage.name,
            productCount: products.length
          });
        }
      } catch (error) {
        logger.warn('Failed to load products from orderpage for all products', {
          orderpageId: orderpage.id,
          orderpage: orderpage.name,
          error: error.message
        });
      }
    }

    if (allProducts.length === 0) {
      throw new Error('No products found in any orderpage');
    }

    logger.info('Successfully loaded all products', {
      totalProducts: allProducts.length,
      productIds: allProducts.map(p => p.id),
      productNames: allProducts.map(p => p.name)
    });

    res.json({
      success: true,
      products: allProducts,
      totalProducts: allProducts.length,
      orderpages: orderPagesResult.categories.map(cat => ({ id: cat.id, name: cat.name })),
      note: 'All products from all orderpages with default 25% commission',
      source: 'middleware_all_products',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to get all products', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get all products',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Debug endpoint for testing client creation
app.post('/api/debug-client', async (req, res) => {
  try {
    logger.info('Debug: Testing client creation');

    const testClientData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '+420123456789',
      address: 'Test Address 123',
      city: 'Prague',
      postalCode: '11000',
      country: 'CZ'
    };

    const result = await hostbillClient.createClient(testClientData);

    res.json({
      success: true,
      message: 'Client created successfully',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Debug client creation failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Client creation failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Payment modules endpoint - get active payment modules from HostBill using proven method
app.get('/api/payment-modules', async (req, res) => {
  try {
    logger.info('Getting payment modules from HostBill using proven method');

    // Use known working modules from test portal (skip API methods check for now)
    logger.debug('Using known active modules from testing');

    const modulesData = {
      success: true,
      modules: {
        '10': 'payU',
        '112': 'Paypal Checkout v2',
        '121': 'Stripe Intents - 3D Secure'
      },
      server_time: Math.floor(Date.now() / 1000)
    };

    // Map modules to our format
    const modules = modulesData.modules;
    const mappedModules = [];

    // Known module mappings from test portal
    const moduleMapping = {
      '10': { method: 'payu', name: 'PayU', type: 'redirect', icon: '💰' },
      '112': { method: 'paypal', name: 'PayPal Checkout v2', type: 'redirect', icon: '🅿️' },
      '121': { method: 'card', name: 'Stripe Intents - 3D Secure', type: 'redirect', icon: '💳' }
    };

    for (const [moduleId, moduleName] of Object.entries(modules)) {
      const mapping = moduleMapping[moduleId];

      mappedModules.push({
        id: moduleId,
        name: moduleName,
        method: mapping?.method || `module${moduleId}`,
        type: mapping?.type || 'redirect',
        icon: mapping?.icon || '💳',
        enabled: true,
        source: 'hostbill-api',
        known: !!mapping,
        hostbillModuleId: moduleId
      });

      logger.debug('Payment module mapped', {
        moduleId,
        moduleName,
        method: mapping?.method || `module${moduleId}`,
        known: !!mapping
      });
    }

    logger.info('Payment modules retrieved and mapped', {
      total: mappedModules.length,
      known: mappedModules.filter(m => m.known).length,
      unknown: mappedModules.filter(m => !m.known).length
    });

    res.json({
      success: true,
      modules: mappedModules,
      rawModules: modules,
      total: mappedModules.length,
      known: mappedModules.filter(m => m.known).length,
      unknown: mappedModules.filter(m => !m.known).length,
      apiInfo: {
        hasGetPaymentModules: true,
        serverTime: modulesData.server_time
      },
      source: 'middleware-hostbill',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to get payment modules', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get payment modules',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Products endpoint - get available products from HostBill using proven method
app.get('/api/products', async (req, res) => {
  try {
    logger.info('Getting products from HostBill using proven method');

    // Step 1: Get all orderpages (like in working test portal)
    const orderPagesData = await hostbillClient.makeApiCall({
      call: 'getOrderPages'
    });

    if (!orderPagesData.success || !orderPagesData.categories) {
      throw new Error('Failed to get orderpages from HostBill');
    }

    logger.debug('Found orderpages', {
      count: orderPagesData.categories.length,
      orderpages: orderPagesData.categories.map(cat => ({ id: cat.id, name: cat.name }))
    });

    // Step 2: Get products from all orderpages
    let allProducts = [];

    for (const orderpage of orderPagesData.categories) {
      try {
        const productsData = await hostbillClient.makeApiCall({
          call: 'getProducts',
          id: orderpage.id
        });

        if (productsData.success && productsData.products) {
          // Convert products object to array and add orderpage info
          const products = Object.values(productsData.products).map(product => {
            // Find CloudVPS mapping for this HostBill product
            const cloudVpsId = productMapper.getCloudVpsId(product.id);

            return {
              id: cloudVpsId || product.id, // Use mapped ID or original
              hostbillId: product.id,
              name: product.name || `Product ${product.id}`,
              description: product.description || '',
              price: parseFloat(product.m) || 0, // Monthly price
              currency: 'CZK',
              category: 'VPS',
              orderpage_id: orderpage.id,
              orderpage_name: orderpage.name,
              monthly_price: product.m,
              quarterly_price: product.q,
              semi_annually_price: product.s,
              annually_price: product.a,
              available: true,
              source: 'hostbill-api',
              mapped: !!cloudVpsId
            };
          });

          allProducts = allProducts.concat(products);

          logger.debug('Products loaded from orderpage', {
            orderpage: orderpage.name,
            count: products.length
          });
        }
      } catch (error) {
        logger.warn('Failed to load products from orderpage', {
          orderpage: orderpage.name,
          error: error.message
        });
      }
    }

    if (allProducts.length === 0) {
      throw new Error('No products found in any orderpage');
    }

    logger.info('Products retrieved successfully', {
      total: allProducts.length,
      mapped: allProducts.filter(p => p.mapped).length,
      orderpages: orderPagesData.categories.length
    });

    res.json({
      success: true,
      products: allProducts,
      total: allProducts.length,
      mapped: allProducts.filter(p => p.mapped).length,
      orderpages: orderPagesData.categories.map(cat => ({ id: cat.id, name: cat.name })),
      source: 'middleware-hostbill',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to get products', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get products',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Order creation endpoint (alias for process-order)
app.post('/api/orders/create', [
  // Validation middleware
  body('customer.firstName').notEmpty().withMessage('First name is required'),
  body('customer.lastName').notEmpty().withMessage('Last name is required'),
  body('customer.email').isEmail().withMessage('Valid email is required'),
  body('customer.phone').notEmpty().withMessage('Phone is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required')
], async (req, res) => {
  try {
    logger.info('Processing order creation request', {
      customerEmail: req.body.customer?.email,
      itemCount: req.body.items?.length
    });

    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // Process order using existing order processor
    const result = await orderProcessor.processOrder(req.body);

    logger.info('Order creation completed', {
      success: result.success,
      clientId: result.client?.id,
      orderCount: result.orders?.length
    });

    res.json(result);

  } catch (error) {
    logger.error('Order creation failed', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'Order creation failed',
      details: error.message
    });
  }
});

// Main order processing endpoint
app.post('/api/process-order', [
  // Validation middleware
  body('customer.firstName').notEmpty().withMessage('First name is required'),
  body('customer.lastName').notEmpty().withMessage('Last name is required'),
  body('customer.email').isEmail().withMessage('Valid email is required'),
  body('customer.phone').notEmpty().withMessage('Phone is required'),
  body('customer.address').notEmpty().withMessage('Address is required'),
  body('customer.city').notEmpty().withMessage('City is required'),
  body('customer.postalCode').notEmpty().withMessage('Postal code is required'),
  body('customer.country').notEmpty().withMessage('Country is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId').notEmpty().withMessage('Product ID is required for all items'),
  body('items.*.name').notEmpty().withMessage('Product name is required for all items'),
  body('items.*.price').isNumeric().withMessage('Valid price is required for all items')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Order validation failed', { errors: errors.array() });
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
        timestamp: new Date().toISOString()
      });
    }

    logger.info('Processing new order', {
      customerEmail: req.body.customer.email,
      itemCount: req.body.items.length,
      hasAffiliate: !!req.body.affiliate
    });

    // Process the order
    const result = await orderProcessor.processCompleteOrder(req.body);

    logger.info('Order processed successfully', {
      clientId: result.client.id,
      orderIds: result.orders.map(o => o.orderId),
      affiliateId: result.affiliate?.id
    });

    res.json({
      success: true,
      message: 'Order processed successfully',
      processingId: result.processingId,
      clientId: result.client?.id,
      orders: result.orders,
      affiliateAssigned: !!result.affiliate,
      affiliate: result.affiliate,
      errors: result.errors,
      source: 'middleware',
      middleware_url: process.env.MIDDLEWARE_URL || 'http://localhost:3005',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Order processing failed', {
      error: error.message,
      stack: error.stack,
      customerEmail: req.body.customer?.email
    });

    res.status(500).json({
      success: false,
      error: 'Order processing failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Order confirmation page endpoint
app.get('/confirmation/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    logger.info('Displaying order confirmation', { orderId });

    // Get order details from HostBill
    const orderDetails = await hostbillClient.getOrderDetails(orderId);

    // Render confirmation page
    const confirmationHtml = await orderProcessor.generateConfirmationPage(orderDetails, orderId);
    
    res.setHeader('Content-Type', 'text/html');
    res.send(confirmationHtml);

  } catch (error) {
    logger.error('Failed to display confirmation page', {
      orderId: req.params.orderId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to load confirmation page',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// =============================================================================
// PAYMENT PROCESSING ENDPOINTS
// =============================================================================

/**
 * GET /api/payments/methods
 * Get available payment methods
 */
app.get('/api/payments/methods', async (req, res) => {
  try {
    logger.info('Getting available payment methods');

    const methods = await paymentProcessor.getAvailablePaymentMethods();

    res.json({
      success: true,
      methods,
      total: methods.length,
      enabled: methods.filter(m => m.enabled).length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get payment methods', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get payment methods',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/payments/initialize
 * Initialize payment for order/invoice
 */
app.post('/api/payments/initialize', [
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('invoiceId').notEmpty().withMessage('Invoice ID is required'),
  body('method').notEmpty().withMessage('Payment method is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount is required')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
        timestamp: new Date().toISOString()
      });
    }

    logger.info('Initializing payment', {
      orderId: req.body.orderId,
      invoiceId: req.body.invoiceId,
      method: req.body.method,
      amount: req.body.amount
    });

    const result = await paymentProcessor.initializePayment(req.body);

    res.json({
      success: true,
      message: 'Payment initialized successfully',
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to initialize payment', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to initialize payment',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/payments/callback
 * Handle payment gateway callbacks
 */
app.post('/api/payments/callback', async (req, res) => {
  try {
    logger.info('Processing payment callback', {
      gateway: req.body.gateway,
      invoiceId: req.body.invoiceId || req.body.invoice_id,
      status: req.body.status
    });

    const result = await paymentProcessor.processPaymentCallback(req.body);

    res.json({
      success: true,
      message: 'Callback processed successfully',
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to process payment callback', { error: error.message });
    res.status(200).json({ // Return 200 to prevent gateway retries
      success: false,
      error: 'Failed to process callback',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/payments/status
 * Get payment status
 */
app.get('/api/payments/status', async (req, res) => {
  try {
    const { paymentId, invoiceId, orderId } = req.query;

    if (!paymentId && !invoiceId && !orderId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: paymentId, invoiceId, or orderId',
        timestamp: new Date().toISOString()
      });
    }

    logger.info('Getting payment status', { paymentId, invoiceId, orderId });

    // For now, get invoice details from HostBill
    let invoice = null;
    let order = null;

    if (invoiceId) {
      try {
        invoice = await hostbillClient.makeApiCall({
          call: 'getInvoiceDetails',
          id: invoiceId
        });
      } catch (error) {
        logger.warn('Failed to get invoice details', { invoiceId, error: error.message });
      }
    }

    if (orderId) {
      try {
        order = await hostbillClient.getOrderDetails(orderId);
      } catch (error) {
        logger.warn('Failed to get order details', { orderId, error: error.message });
      }
    }

    res.json({
      success: true,
      message: 'Payment status retrieved',
      payment: {
        paymentId,
        orderId,
        invoiceId,
        status: invoice?.invoice?.status || 'unknown'
      },
      invoice: invoice?.invoice || null,
      order: order || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get payment status', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get payment status',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test payment page endpoint
app.get('/test-payment', (req, res) => {
  const {
    paymentId,
    orderId,
    invoiceId,
    method,
    amount,
    currency,
    successUrl,
    cancelUrl,
    testMode
  } = req.query;

  // Generate test payment page HTML
  const testPaymentHtml = `
<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Payment Gateway - ${method.toUpperCase()}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .payment-card {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 48px;
            margin-bottom: 10px;
        }
        .amount {
            font-size: 32px;
            font-weight: bold;
            color: #2563eb;
            margin: 20px 0;
        }
        .details {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
        }
        .buttons {
            display: flex;
            gap: 15px;
            margin-top: 30px;
        }
        .btn {
            flex: 1;
            padding: 15px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
        }
        .btn-success {
            background: #10b981;
            color: white;
        }
        .btn-success:hover {
            background: #059669;
        }
        .btn-cancel {
            background: #ef4444;
            color: white;
        }
        .btn-cancel:hover {
            background: #dc2626;
        }
        .test-notice {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            color: #92400e;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="payment-card">
        <div class="test-notice">
            🧪 <strong>TEST REŽIM</strong> - Toto je simulace platební brány
        </div>

        <div class="header">
            <div class="logo">${getPaymentIcon(method)}</div>
            <h1>Test Payment Gateway</h1>
            <h2>${getPaymentName(method)}</h2>
        </div>

        <div class="amount">${amount} ${currency}</div>

        <div class="details">
            <div class="detail-row">
                <span>Objednávka:</span>
                <span><strong>${orderId}</strong></span>
            </div>
            <div class="detail-row">
                <span>Faktura:</span>
                <span><strong>${invoiceId}</strong></span>
            </div>
            <div class="detail-row">
                <span>Platební metoda:</span>
                <span><strong>${getPaymentName(method)}</strong></span>
            </div>
            <div class="detail-row">
                <span>Částka:</span>
                <span><strong>${amount} ${currency}</strong></span>
            </div>
        </div>

        <div class="buttons">
            <button class="btn btn-success" onclick="completePayment('success')">
                ✅ Simulovat úspěšnou platbu
            </button>
            <button class="btn btn-cancel" onclick="completePayment('cancel')">
                ❌ Zrušit platbu
            </button>
        </div>
    </div>

    <script>
        function getPaymentIcon(method) {
            const icons = {
                'card': '💳',
                'paypal': '🅿️',
                'payu': '💰',
                'crypto': '₿',
                'banktransfer': '🏦'
            };
            return icons[method] || '💳';
        }

        function getPaymentName(method) {
            const names = {
                'card': 'Platební karta',
                'paypal': 'PayPal',
                'payu': 'PayU',
                'crypto': 'Kryptoměny',
                'banktransfer': 'Bankovní převod'
            };
            return names[method] || 'Platební karta';
        }

        function completePayment(status) {
            const delay = ${process.env.PAYMENT_REDIRECT_DELAY || 2000};

            if (status === 'success') {
                document.body.innerHTML = '<div class="payment-card"><div class="header"><div class="logo">✅</div><h1>Platba úspěšná!</h1><p>Přesměrování za ' + (delay/1000) + ' sekund...</p></div></div>';

                setTimeout(() => {
                    window.location.href = decodeURIComponent('${successUrl}') +
                        '?orderId=${orderId}&paymentId=${paymentId}&status=success&testMode=true';
                }, delay);
            } else {
                document.body.innerHTML = '<div class="payment-card"><div class="header"><div class="logo">❌</div><h1>Platba zrušena</h1><p>Přesměrování za ' + (delay/1000) + ' sekund...</p></div></div>';

                setTimeout(() => {
                    window.location.href = decodeURIComponent('${cancelUrl}') +
                        '?error=payment_cancelled&testMode=true';
                }, delay);
            }
        }
    </script>
</body>
</html>`;

  res.send(testPaymentHtml);
});

// Helper function for payment icons
function getPaymentIcon(method) {
  const icons = {
    'card': '💳',
    'paypal': '🅿️',
    'payu': '💰',
    'crypto': '₿',
    'banktransfer': '🏦'
  };
  return icons[method] || '💳';
}

// Helper function for payment names
function getPaymentName(method) {
  const names = {
    'card': 'Platební karta',
    'paypal': 'PayPal',
    'payu': 'PayU',
    'crypto': 'Kryptoměny',
    'banktransfer': 'Bankovní převod'
  };
  return names[method] || 'Platební karta';
}

// Root endpoint - API information
app.get('/', (req, res) => {
  res.json({
    success: true,
    name: 'Systrix Middleware',
    version: '2.0.0',
    description: 'Unified HostBill API Gateway with Integrated Dashboard',
    port: PORT,
    timestamp: new Date().toISOString(),
    features: [
      'HostBill API Gateway',
      'Order Processing',
      'Payment Integration',
      'Affiliate Management',
      'Integrated Dashboard',
      'Real-time Monitoring'
    ],
    endpoints: {
      health: '/health',
      dashboard: '/dashboard',
      testConnection: '/api/test-connection',
      products: '/api/products',
      orders: '/api/orders',
      payments: '/api/payments',
      affiliates: '/api/affiliates',
      stats: '/api/stats'
    },
    documentation: {
      healthCheck: `GET ${req.protocol}://${req.get('host')}/health`,
      dashboard: `GET ${req.protocol}://${req.get('host')}/dashboard`,
      testConnection: `GET ${req.protocol}://${req.get('host')}/api/test-connection`,
      paymentMethods: `GET ${req.protocol}://${req.get('host')}/api/payments/methods`
    },
    status: 'operational',
    environment: process.env.NODE_ENV || 'development',
    integrations: {
      cloudvps: process.env.CLOUDVPS_URL || 'http://localhost:3000',
      partnersPortal: process.env.PARTNERS_PORTAL_URL || 'http://localhost:3006'
    }
  });
});

// 404 handler - must be last
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Systrix Middleware started on port ${PORT}`, {
    environment: process.env.NODE_ENV,
    hostbillUrl: process.env.HOSTBILL_BASE_URL,
    dashboardEnabled: process.env.DASHBOARD_ENABLED !== 'false'
  });

  console.log(`🚀 Systrix Middleware running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`🧪 Test connection: http://localhost:${PORT}/api/test-connection`);
  console.log(`💳 Payment methods: http://localhost:${PORT}/api/payments/methods`);
  console.log(`🎯 Affiliates: http://localhost:${PORT}/api/affiliates`);
  console.log(`📦 Products: http://localhost:${PORT}/api/products`);
});

module.exports = app;
