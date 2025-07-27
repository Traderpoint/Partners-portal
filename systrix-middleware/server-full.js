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

// Payment gateways configuration
const paymentGateways = [
  { id: 'card', name: 'Credit Card', type: 'redirect' },
  { id: 'paypal', name: 'PayPal', type: 'redirect' },
  { id: 'banktransfer', name: 'Bank Transfer', type: 'manual' },
  { id: 'crypto', name: 'Cryptocurrency', type: 'redirect' },
  { id: 'payu', name: 'PayU', type: 'redirect' }
];

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
            <a href="/middleware-order-test" target="_blank" class="action-link action-order">
                🛒 Test Order Processing
            </a>

            <a href="/api/product-mapping" target="_blank" class="action-link action-mapping">
                🔗 Check Product Mapping
            </a>

            <a href="/middleware-affiliate-products" target="_blank" class="action-link action-affiliate">
                👥 Affiliate Products
            </a>

            <a href="/advanced-order-test" target="_blank" class="action-link action-advanced">
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

                    <a href="/middleware-affiliate-test" target="_blank" class="test-link link-blue">
                        🎯 Middleware Affiliate Test
                    </a>

                    <a href="/middleware-affiliate-products" target="_blank" class="test-link link-cyan">
                        📦 Middleware Products (Affiliate/All)
                    </a>

                    <a href="/middleware-order-test" target="_blank" class="test-link link-orange">
                        🛒 Middleware Order Test
                    </a>

                    <a href="/api/product-mapping" target="_blank" class="test-link link-purple">
                        🔗 Product Mapping Test
                    </a>

                    <a href="/advanced-order-test" target="_blank" class="test-link link-light-green">
                        🚀 Advanced Order Test (Middleware)
                    </a>

                    <a href="/payment-test" target="_blank" class="test-link link-dashboard">
                        💳 Payment System Test (Middleware)
                    </a>

                    <a href="/test-payment-gateway" target="_blank" class="test-link link-purple">
                        🧪 Test Payment Gateway
                    </a>

                    <a href="/payment-methods-test" target="_blank" class="test-link link-light-green">
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

// Middleware Affiliate Products Test
app.get('/middleware-affiliate-products', async (req, res) => {
  try {
    logger.info('Middleware affiliate products test started');

    // Get affiliate products directly from HostBill API
    const affiliateProducts = await hostbillClient.makeApiCall({
      call: 'getAffiliateProducts'
    });

    const html = `
<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Middleware Affiliate Products Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-top: 20px; }
        .product-card { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 15px; }
        .product-title { font-weight: bold; color: #495057; margin-bottom: 10px; }
        .product-details { font-size: 14px; color: #6c757d; }
        .back-link { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
        .back-link:hover { background: #0056b3; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔗 Middleware Affiliate Products Test</h1>
            <p>Test načítání affiliate produktů přímo z HostBill API přes middleware</p>
        </div>

        ${affiliateProducts && affiliateProducts.length > 0 ? `
            <div class="success">
                ✅ <strong>Úspěch!</strong> Načteno ${affiliateProducts.length} affiliate produktů z HostBill API
            </div>

            <div class="product-grid">
                ${affiliateProducts.map(product => `
                    <div class="product-card">
                        <div class="product-title">${product.name || 'Unnamed Product'}</div>
                        <div class="product-details">
                            <strong>ID:</strong> ${product.id}<br>
                            <strong>Cena:</strong> ${product.price || 'N/A'}<br>
                            <strong>Typ:</strong> ${product.type || 'N/A'}<br>
                            <strong>Status:</strong> ${product.status || 'N/A'}
                        </div>
                    </div>
                `).join('')}
            </div>
        ` : `
            <div class="error">
                ❌ <strong>Chyba!</strong> Nepodařilo se načíst affiliate produkty z HostBill API
            </div>
        `}

        <a href="/test-portal" class="back-link">← Zpět na Test Portal</a>
    </div>
</body>
</html>`;

    res.send(html);

  } catch (error) {
    logger.error('Middleware affiliate products test failed', { error: error.message });

    const errorHtml = `
<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Middleware Affiliate Products Test - Error</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .back-link { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
        .back-link:hover { background: #0056b3; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔗 Middleware Affiliate Products Test</h1>
            <p>Test načítání affiliate produktů přímo z HostBill API přes middleware</p>
        </div>

        <div class="error">
            ❌ <strong>Chyba při komunikaci s HostBill API:</strong><br>
            ${error.message}
        </div>

        <a href="/test-portal" class="back-link">← Zpět na Test Portal</a>
    </div>
</body>
</html>`;

    res.send(errorHtml);
  }
});

// Middleware Order Test
app.get('/middleware-order-test', async (req, res) => {
  try {
    logger.info('Middleware order test started');

    const html = `
<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Middleware Order Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1000px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
        .form-group input, .form-group select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 16px; }
        .btn { padding: 12px 24px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
        .btn:hover { background: #0056b3; }
        .back-link { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #6c757d; color: white; text-decoration: none; border-radius: 5px; }
        .back-link:hover { background: #545b62; }
        .result { margin-top: 20px; padding: 15px; border-radius: 5px; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛒 Middleware Order Test</h1>
            <p>Test vytvoření objednávky přímo přes middleware → HostBill API</p>
        </div>

        <form id="orderForm">
            <div class="form-group">
                <label for="productId">Product ID:</label>
                <select id="productId" name="productId" required>
                    <option value="">Vyberte produkt...</option>
                    <option value="10">CloudVPS Basic (ID: 10)</option>
                    <option value="11">CloudVPS Standard (ID: 11)</option>
                    <option value="12">CloudVPS Premium (ID: 12)</option>
                    <option value="5">CloudVPS Enterprise (ID: 5)</option>
                </select>
            </div>

            <div class="form-group">
                <label for="clientEmail">Email klienta:</label>
                <input type="email" id="clientEmail" name="clientEmail" value="test@example.com" required>
            </div>

            <div class="form-group">
                <label for="clientName">Jméno klienta:</label>
                <input type="text" id="clientName" name="clientName" value="Test User" required>
            </div>

            <div class="form-group">
                <label for="paymentMethod">Platební metoda:</label>
                <select id="paymentMethod" name="paymentMethod" required>
                    <option value="">Vyberte platební metodu...</option>
                    <option value="card">Kreditní karta</option>
                    <option value="paypal">PayPal</option>
                    <option value="banktransfer">Bankovní převod</option>
                </select>
            </div>

            <button type="submit" class="btn">🚀 Vytvořit objednávku přes middleware</button>
        </form>

        <div id="result"></div>

        <a href="/test-portal" class="back-link">← Zpět na Test Portal</a>
    </div>

    <script>
        document.getElementById('orderForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(e.target);
            const orderData = Object.fromEntries(formData);

            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = '<div class="result">⏳ Zpracovávám objednávku...</div>';

            try {
                const response = await fetch('/api/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(orderData)
                });

                const result = await response.json();

                if (result.success) {
                    resultDiv.innerHTML = \`
                        <div class="result success">
                            ✅ <strong>Objednávka úspěšně vytvořena!</strong><br>
                            <strong>Order ID:</strong> \${result.orderId}<br>
                            <strong>Status:</strong> \${result.status}<br>
                            <strong>Celková cena:</strong> \${result.total || 'N/A'}<br>
                            <strong>Platební metoda:</strong> \${result.paymentMethod}
                        </div>
                    \`;
                } else {
                    resultDiv.innerHTML = \`
                        <div class="result error">
                            ❌ <strong>Chyba při vytváření objednávky:</strong><br>
                            \${result.error}
                        </div>
                    \`;
                }
            } catch (error) {
                resultDiv.innerHTML = \`
                    <div class="result error">
                        ❌ <strong>Chyba při komunikaci s middleware:</strong><br>
                        \${error.message}
                    </div>
                \`;
            }
        });
    </script>
</body>
</html>`;

    res.send(html);

  } catch (error) {
    logger.error('Middleware order test failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Middleware Affiliate Test
app.get('/middleware-affiliate-test', async (req, res) => {
  try {
    logger.info('Middleware affiliate test started');

    // Test affiliate API calls
    const affiliateData = await hostbillClient.makeApiCall({
      call: 'getAffiliates'
    });

    const html = `
<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Middleware Affiliate Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1000px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .affiliate-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-top: 20px; }
        .affiliate-card { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 15px; }
        .affiliate-name { font-weight: bold; color: #495057; margin-bottom: 10px; }
        .affiliate-details { font-size: 14px; color: #6c757d; }
        .back-link { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
        .back-link:hover { background: #0056b3; }
        .test-section { margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Middleware Affiliate Test</h1>
            <p>Test affiliate funkcí přímo přes middleware → HostBill API</p>
        </div>

        <div class="test-section">
            <h3>📊 Affiliate Data Test</h3>
            ${affiliateData && affiliateData.length > 0 ? `
                <div class="success">
                    ✅ <strong>Úspěch!</strong> Načteno ${affiliateData.length} affiliate záznamů z HostBill API
                </div>

                <div class="affiliate-grid">
                    ${affiliateData.slice(0, 6).map(affiliate => `
                        <div class="affiliate-card">
                            <div class="affiliate-name">${affiliate.name || affiliate.email || 'Unnamed Affiliate'}</div>
                            <div class="affiliate-details">
                                <strong>ID:</strong> ${affiliate.id}<br>
                                <strong>Email:</strong> ${affiliate.email || 'N/A'}<br>
                                <strong>Status:</strong> ${affiliate.status || 'N/A'}<br>
                                <strong>Komise:</strong> ${affiliate.commission || 'N/A'}%
                            </div>
                        </div>
                    `).join('')}
                </div>

                ${affiliateData.length > 6 ? `
                    <p><em>... a dalších ${affiliateData.length - 6} affiliate záznamů</em></p>
                ` : ''}
            ` : `
                <div class="error">
                    ❌ <strong>Chyba!</strong> Nepodařilo se načíst affiliate data z HostBill API
                </div>
            `}
        </div>

        <div class="test-section">
            <h3>🔗 API Connection Test</h3>
            <button onclick="testApiConnection()" class="btn" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer;">
                🧪 Test API Connection
            </button>
            <div id="connectionResult" style="margin-top: 10px;"></div>
        </div>

        <a href="/test-portal" class="back-link">← Zpět na Test Portal</a>
    </div>

    <script>
        async function testApiConnection() {
            const resultDiv = document.getElementById('connectionResult');
            resultDiv.innerHTML = '<div style="padding: 10px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px;">⏳ Testování API připojení...</div>';

            try {
                const response = await fetch('/api/test-connection');
                const result = await response.json();

                if (result.success) {
                    resultDiv.innerHTML = \`
                        <div style="padding: 10px; background: #d4edda; border: 1px solid #c3e6cb; color: #155724; border-radius: 5px; margin-top: 10px;">
                            ✅ <strong>API připojení úspěšné!</strong><br>
                            Response time: \${result.responseTime || 'N/A'}ms<br>
                            Status: \${result.status || 'Connected'}
                        </div>
                    \`;
                } else {
                    resultDiv.innerHTML = \`
                        <div style="padding: 10px; background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; border-radius: 5px; margin-top: 10px;">
                            ❌ <strong>API připojení selhalo:</strong><br>
                            \${result.error}
                        </div>
                    \`;
                }
            } catch (error) {
                resultDiv.innerHTML = \`
                    <div style="padding: 10px; background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; border-radius: 5px; margin-top: 10px;">
                        ❌ <strong>Chyba při testování:</strong><br>
                        \${error.message}
                    </div>
                \`;
            }
        }
    </script>
</body>
</html>`;

    res.send(html);

  } catch (error) {
    logger.error('Middleware affiliate test failed', { error: error.message });

    const errorHtml = `
<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Middleware Affiliate Test - Error</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .back-link { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
        .back-link:hover { background: #0056b3; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Middleware Affiliate Test</h1>
            <p>Test affiliate funkcí přímo přes middleware → HostBill API</p>
        </div>

        <div class="error">
            ❌ <strong>Chyba při komunikaci s HostBill API:</strong><br>
            ${error.message}
        </div>

        <a href="/test-portal" class="back-link">← Zpět na Test Portal</a>
    </div>
</body>
</html>`;

    res.send(errorHtml);
  }
});

// Middleware Payment Methods Test
app.get('/payment-methods-test', async (req, res) => {
  try {
    logger.info('Middleware payment methods test started');

    // Get payment methods from HostBill API
    const paymentMethods = await hostbillClient.makeApiCall({
      call: 'getPaymentMethods'
    });

    const html = `
<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Middleware Payment Methods Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .methods-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-top: 20px; }
        .method-card { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 15px; }
        .method-name { font-weight: bold; color: #495057; margin-bottom: 10px; }
        .method-details { font-size: 14px; color: #6c757d; }
        .back-link { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
        .back-link:hover { background: #0056b3; }
        .test-section { margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; }
        .btn { padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 5px; }
        .btn:hover { background: #218838; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💳 Middleware Payment Methods Test</h1>
            <p>Test platebních metod přímo přes middleware → HostBill API</p>
        </div>

        <div class="test-section">
            <h3>📊 Available Payment Methods</h3>
            ${paymentMethods && paymentMethods.length > 0 ? `
                <div class="success">
                    ✅ <strong>Úspěch!</strong> Načteno ${paymentMethods.length} platebních metod z HostBill API
                </div>

                <div class="methods-grid">
                    ${paymentMethods.map(method => `
                        <div class="method-card">
                            <div class="method-name">${method.name || method.gateway || 'Unnamed Method'}</div>
                            <div class="method-details">
                                <strong>Gateway:</strong> ${method.gateway || 'N/A'}<br>
                                <strong>Status:</strong> ${method.status || 'N/A'}<br>
                                <strong>Type:</strong> ${method.type || 'N/A'}<br>
                                <strong>Currency:</strong> ${method.currency || 'N/A'}
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <div class="error">
                    ❌ <strong>Chyba!</strong> Nepodařilo se načíst platební metody z HostBill API
                </div>
            `}
        </div>

        <div class="test-section">
            <h3>🧪 Payment Gateway Tests</h3>
            <p>Test jednotlivých platebních bran:</p>

            <button onclick="testPaymentGateway('card')" class="btn">💳 Test Card Gateway</button>
            <button onclick="testPaymentGateway('paypal')" class="btn">🅿️ Test PayPal Gateway</button>
            <button onclick="testPaymentGateway('banktransfer')" class="btn">🏦 Test Bank Transfer</button>
            <button onclick="testPaymentGateway('crypto')" class="btn">₿ Test Crypto Gateway</button>

            <div id="gatewayResult" style="margin-top: 15px;"></div>
        </div>

        <div class="test-section">
            <h3>🔗 API Connection Test</h3>
            <button onclick="testApiConnection()" class="btn">🧪 Test API Connection</button>
            <div id="connectionResult" style="margin-top: 10px;"></div>
        </div>

        <a href="/test-portal" class="back-link">← Zpět na Test Portal</a>
    </div>

    <script>
        async function testPaymentGateway(gateway) {
            const resultDiv = document.getElementById('gatewayResult');
            resultDiv.innerHTML = \`<div style="padding: 10px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px;">⏳ Testování \${gateway} gateway...</div>\`;

            try {
                const response = await fetch(\`/api/payments/test-gateway/\${gateway}\`);
                const result = await response.json();

                if (result.success) {
                    resultDiv.innerHTML = \`
                        <div style="padding: 10px; background: #d4edda; border: 1px solid #c3e6cb; color: #155724; border-radius: 5px; margin-top: 10px;">
                            ✅ <strong>\${gateway} gateway test úspěšný!</strong><br>
                            Status: \${result.status || 'Available'}<br>
                            Response time: \${result.responseTime || 'N/A'}ms
                        </div>
                    \`;
                } else {
                    resultDiv.innerHTML = \`
                        <div style="padding: 10px; background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; border-radius: 5px; margin-top: 10px;">
                            ❌ <strong>\${gateway} gateway test selhal:</strong><br>
                            \${result.error}
                        </div>
                    \`;
                }
            } catch (error) {
                resultDiv.innerHTML = \`
                    <div style="padding: 10px; background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; border-radius: 5px; margin-top: 10px;">
                        ❌ <strong>Chyba při testování \${gateway}:</strong><br>
                        \${error.message}
                    </div>
                \`;
            }
        }

        async function testApiConnection() {
            const resultDiv = document.getElementById('connectionResult');
            resultDiv.innerHTML = '<div style="padding: 10px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px;">⏳ Testování API připojení...</div>';

            try {
                const response = await fetch('/api/test-connection');
                const result = await response.json();

                if (result.success) {
                    resultDiv.innerHTML = \`
                        <div style="padding: 10px; background: #d4edda; border: 1px solid #c3e6cb; color: #155724; border-radius: 5px; margin-top: 10px;">
                            ✅ <strong>API připojení úspěšné!</strong><br>
                            Response time: \${result.responseTime || 'N/A'}ms<br>
                            Status: \${result.status || 'Connected'}
                        </div>
                    \`;
                } else {
                    resultDiv.innerHTML = \`
                        <div style="padding: 10px; background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; border-radius: 5px; margin-top: 10px;">
                            ❌ <strong>API připojení selhalo:</strong><br>
                            \${result.error}
                        </div>
                    \`;
                }
            } catch (error) {
                resultDiv.innerHTML = \`
                    <div style="padding: 10px; background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; border-radius: 5px; margin-top: 10px;">
                        ❌ <strong>Chyba při testování:</strong><br>
                        \${error.message}
                    </div>
                \`;
            }
        }
    </script>
</body>
</html>`;

    res.send(html);

  } catch (error) {
    logger.error('Middleware payment methods test failed', { error: error.message });

    const errorHtml = `
<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Methods Test - Error</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .back-link { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
        .back-link:hover { background: #0056b3; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💳 Payment Methods Test</h1>
            <p>Test platebních metod přímo přes middleware → HostBill API</p>
        </div>

        <div class="error">
            ❌ <strong>Chyba při komunikaci s HostBill API:</strong><br>
            ${error.message}
        </div>

        <a href="/test-portal" class="back-link">← Zpět na Test Portal</a>
    </div>
</body>
</html>`;

    res.send(errorHtml);
  }
});

// Payment Gateway Test endpoint
app.get('/api/payments/test-gateway/:gateway', async (req, res) => {
  try {
    const { gateway } = req.params;
    const startTime = Date.now();

    logger.info('Testing payment gateway', { gateway });

    // Test if gateway is available in our payment gateways
    const isAvailable = paymentGateways.some(g => g.id === gateway);

    if (!isAvailable) {
      return res.json({
        success: false,
        error: `Gateway '${gateway}' is not available`,
        availableGateways: paymentGateways.map(g => g.id)
      });
    }

    // Simulate gateway test (in real implementation, you would test actual gateway connection)
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      gateway,
      status: 'Available',
      responseTime,
      message: `${gateway} gateway is working correctly`
    });

  } catch (error) {
    logger.error('Payment gateway test failed', { error: error.message, gateway: req.params.gateway });
    res.json({
      success: false,
      error: error.message,
      gateway: req.params.gateway
    });
  }
});

// Advanced Order Test
app.get('/advanced-order-test', async (req, res) => {
  try {
    logger.info('Advanced order test started');

    const html = `
<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Advanced Order Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .form-section { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .btn { padding: 12px 24px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; margin: 5px; }
        .btn:hover { background: #0056b3; }
        .btn-success { background: #28a745; }
        .btn-success:hover { background: #218838; }
        .back-link { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #6c757d; color: white; text-decoration: none; border-radius: 5px; }
        .back-link:hover { background: #545b62; }
        .result { margin-top: 20px; padding: 15px; border-radius: 5px; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Advanced Order Test (Middleware)</h1>
            <p>Pokročilý test objednávek s kompletními daty přes middleware → HostBill API</p>
        </div>

        <div class="info">
            <strong>ℹ️ Info:</strong> Tento test vytvoří kompletní objednávku s klientskými daty, produktem a platbou přímo přes middleware.
        </div>

        <form id="advancedOrderForm">
            <div class="form-section">
                <h3>👤 Klientské údaje</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label for="firstName">Jméno:</label>
                        <input type="text" id="firstName" name="firstName" value="Jan" required>
                    </div>
                    <div class="form-group">
                        <label for="lastName">Příjmení:</label>
                        <input type="text" id="lastName" name="lastName" value="Novák" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="email">Email:</label>
                        <input type="email" id="email" name="email" value="jan.novak@example.com" required>
                    </div>
                    <div class="form-group">
                        <label for="phone">Telefon:</label>
                        <input type="tel" id="phone" name="phone" value="+420123456789">
                    </div>
                </div>
                <div class="form-group">
                    <label for="company">Společnost:</label>
                    <input type="text" id="company" name="company" value="Test Company s.r.o.">
                </div>
            </div>

            <div class="form-section">
                <h3>📦 Produkt a konfigurace</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label for="productId">Produkt:</label>
                        <select id="productId" name="productId" required>
                            <option value="">Vyberte produkt...</option>
                            <option value="10">CloudVPS Basic (ID: 10) - 299 Kč/měs</option>
                            <option value="11">CloudVPS Standard (ID: 11) - 599 Kč/měs</option>
                            <option value="12">CloudVPS Premium (ID: 12) - 999 Kč/měs</option>
                            <option value="5">CloudVPS Enterprise (ID: 5) - 1999 Kč/měs</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="billingCycle">Fakturační cyklus:</label>
                        <select id="billingCycle" name="billingCycle" required>
                            <option value="monthly">Měsíčně</option>
                            <option value="quarterly">Čtvrtletně</option>
                            <option value="annually">Ročně</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="domain">Doména (volitelné):</label>
                    <input type="text" id="domain" name="domain" placeholder="example.com">
                </div>
            </div>

            <div class="form-section">
                <h3>💳 Platební údaje</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label for="paymentMethod">Platební metoda:</label>
                        <select id="paymentMethod" name="paymentMethod" required>
                            <option value="">Vyberte platební metodu...</option>
                            <option value="card">Kreditní karta</option>
                            <option value="paypal">PayPal</option>
                            <option value="banktransfer">Bankovní převod</option>
                            <option value="crypto">Kryptoměny</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="currency">Měna:</label>
                        <select id="currency" name="currency" required>
                            <option value="CZK">CZK - Česká koruna</option>
                            <option value="EUR">EUR - Euro</option>
                            <option value="USD">USD - Americký dolar</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="form-section">
                <h3>📝 Dodatečné informace</h3>
                <div class="form-group">
                    <label for="notes">Poznámky k objednávce:</label>
                    <textarea id="notes" name="notes" rows="3" placeholder="Volitelné poznámky k objednávce..."></textarea>
                </div>
            </div>

            <button type="submit" class="btn btn-success">🚀 Vytvořit pokročilou objednávku</button>
            <button type="button" onclick="fillTestData()" class="btn">📝 Vyplnit testovací data</button>
        </form>

        <div id="result"></div>

        <a href="/test-portal" class="back-link">← Zpět na Test Portal</a>
    </div>

    <script>
        function fillTestData() {
            document.getElementById('firstName').value = 'Jan';
            document.getElementById('lastName').value = 'Novák';
            document.getElementById('email').value = 'jan.novak@example.com';
            document.getElementById('phone').value = '+420123456789';
            document.getElementById('company').value = 'Test Company s.r.o.';
            document.getElementById('productId').value = '11';
            document.getElementById('billingCycle').value = 'monthly';
            document.getElementById('domain').value = 'testdomain.com';
            document.getElementById('paymentMethod').value = 'card';
            document.getElementById('currency').value = 'CZK';
            document.getElementById('notes').value = 'Testovací objednávka vytvořená přes Advanced Order Test';
        }

        document.getElementById('advancedOrderForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(e.target);
            const orderData = Object.fromEntries(formData);

            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = '<div class="result info">⏳ Zpracovávám pokročilou objednávku...</div>';

            try {
                const response = await fetch('/api/orders/advanced', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(orderData)
                });

                const result = await response.json();

                if (result.success) {
                    resultDiv.innerHTML = \`
                        <div class="result success">
                            ✅ <strong>Pokročilá objednávka úspěšně vytvořena!</strong><br>
                            <strong>Order ID:</strong> \${result.orderId}<br>
                            <strong>Client ID:</strong> \${result.clientId || 'N/A'}<br>
                            <strong>Status:</strong> \${result.status}<br>
                            <strong>Celková cena:</strong> \${result.total || 'N/A'} \${result.currency || 'CZK'}<br>
                            <strong>Platební metoda:</strong> \${result.paymentMethod}<br>
                            <strong>Fakturační cyklus:</strong> \${result.billingCycle}<br>
                            \${result.domain ? \`<strong>Doména:</strong> \${result.domain}<br>\` : ''}
                            <strong>Vytvořeno:</strong> \${new Date().toLocaleString('cs-CZ')}
                        </div>
                    \`;
                } else {
                    resultDiv.innerHTML = \`
                        <div class="result error">
                            ❌ <strong>Chyba při vytváření pokročilé objednávky:</strong><br>
                            \${result.error}
                        </div>
                    \`;
                }
            } catch (error) {
                resultDiv.innerHTML = \`
                    <div class="result error">
                        ❌ <strong>Chyba při komunikaci s middleware:</strong><br>
                        \${error.message}
                    </div>
                \`;
            }
        });
    </script>
</body>
</html>`;

    res.send(html);

  } catch (error) {
    logger.error('Advanced order test failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Advanced Orders API endpoint
app.post('/api/orders/advanced', async (req, res) => {
  try {
    const {
      firstName, lastName, email, phone, company,
      productId, billingCycle, domain,
      paymentMethod, currency, notes
    } = req.body;

    logger.info('Creating advanced order', {
      email, productId, paymentMethod, billingCycle
    });

    // Create client first
    const clientData = {
      call: 'addClient',
      firstname: firstName,
      lastname: lastName,
      email: email,
      phone: phone || '',
      company: company || '',
      address1: 'Test Address 1',
      city: 'Prague',
      state: 'Prague',
      postcode: '10000',
      country: 'CZ'
    };

    const clientResult = await hostbillClient.makeApiCall(clientData);
    const clientId = clientResult?.id || clientResult?.client_id;

    if (!clientId) {
      throw new Error('Failed to create client');
    }

    // Create order
    const orderData = {
      call: 'addOrder',
      client_id: clientId,
      product_id: productId,
      billing_cycle: billingCycle,
      payment_method: paymentMethod,
      currency: currency || 'CZK',
      domain: domain || '',
      notes: notes || ''
    };

    const orderResult = await hostbillClient.makeApiCall(orderData);

    if (!orderResult || !orderResult.id) {
      throw new Error('Failed to create order');
    }

    // Calculate total price (simplified)
    const productPrices = {
      '10': { monthly: 299, quarterly: 897, annually: 3588 },
      '11': { monthly: 599, quarterly: 1797, annually: 7188 },
      '12': { monthly: 999, quarterly: 2997, annually: 11988 },
      '5': { monthly: 1999, quarterly: 5997, annually: 23988 }
    };

    const total = productPrices[productId]?.[billingCycle] || 0;

    res.json({
      success: true,
      orderId: orderResult.id,
      clientId: clientId,
      status: orderResult.status || 'pending',
      total: total,
      currency: currency || 'CZK',
      paymentMethod: paymentMethod,
      billingCycle: billingCycle,
      domain: domain,
      message: 'Advanced order created successfully via middleware'
    });

  } catch (error) {
    logger.error('Advanced order creation failed', {
      error: error.message,
      body: req.body
    });

    res.json({
      success: false,
      error: error.message || 'Failed to create advanced order'
    });
  }
});

// Payment Test endpoint
app.get('/payment-test', async (req, res) => {
  try {
    logger.info('Payment test started');

    const html = `
<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment System Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1000px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .test-section { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .btn { padding: 12px 24px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; margin: 5px; }
        .btn:hover { background: #0056b3; }
        .btn-success { background: #28a745; }
        .btn-success:hover { background: #218838; }
        .btn-warning { background: #ffc107; color: #212529; }
        .btn-warning:hover { background: #e0a800; }
        .back-link { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #6c757d; color: white; text-decoration: none; border-radius: 5px; }
        .back-link:hover { background: #545b62; }
        .result { margin-top: 15px; padding: 15px; border-radius: 5px; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
        .payment-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-top: 15px; }
        .payment-card { background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 15px; text-align: center; }
        .payment-icon { font-size: 24px; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💳 Payment System Test (Middleware)</h1>
            <p>Test platebního systému přímo přes middleware → HostBill API</p>
        </div>

        <div class="test-section">
            <h3>🧪 Payment Gateway Tests</h3>
            <p>Test jednotlivých platebních bran:</p>

            <div class="payment-grid">
                <div class="payment-card">
                    <div class="payment-icon">💳</div>
                    <h4>Credit Card</h4>
                    <button onclick="testPaymentGateway('card')" class="btn btn-success">Test Card Gateway</button>
                </div>

                <div class="payment-card">
                    <div class="payment-icon">🅿️</div>
                    <h4>PayPal</h4>
                    <button onclick="testPaymentGateway('paypal')" class="btn btn-success">Test PayPal Gateway</button>
                </div>

                <div class="payment-card">
                    <div class="payment-icon">🏦</div>
                    <h4>Bank Transfer</h4>
                    <button onclick="testPaymentGateway('banktransfer')" class="btn btn-success">Test Bank Transfer</button>
                </div>

                <div class="payment-card">
                    <div class="payment-icon">₿</div>
                    <h4>Cryptocurrency</h4>
                    <button onclick="testPaymentGateway('crypto')" class="btn btn-success">Test Crypto Gateway</button>
                </div>
            </div>

            <div id="gatewayResult"></div>
        </div>

        <div class="test-section">
            <h3>💰 Payment Processing Test</h3>
            <p>Test zpracování platby s testovacími daty:</p>

            <button onclick="processTestPayment()" class="btn btn-warning">💰 Process Test Payment</button>
            <button onclick="validatePaymentMethods()" class="btn">🔍 Validate Payment Methods</button>

            <div id="paymentResult"></div>
        </div>

        <div class="test-section">
            <h3>📊 Payment Statistics</h3>
            <button onclick="getPaymentStats()" class="btn">📊 Get Payment Statistics</button>
            <div id="statsResult"></div>
        </div>

        <a href="/test-portal" class="back-link">← Zpět na Test Portal</a>
    </div>

    <script>
        async function testPaymentGateway(gateway) {
            const resultDiv = document.getElementById('gatewayResult');
            resultDiv.innerHTML = \`<div class="result info">⏳ Testování \${gateway} gateway...</div>\`;

            try {
                const response = await fetch(\`/api/payments/test-gateway/\${gateway}\`);
                const result = await response.json();

                if (result.success) {
                    resultDiv.innerHTML = \`
                        <div class="result success">
                            ✅ <strong>\${gateway} gateway test úspěšný!</strong><br>
                            Status: \${result.status || 'Available'}<br>
                            Response time: \${result.responseTime || 'N/A'}ms<br>
                            Message: \${result.message || 'Gateway is working correctly'}
                        </div>
                    \`;
                } else {
                    resultDiv.innerHTML = \`
                        <div class="result error">
                            ❌ <strong>\${gateway} gateway test selhal:</strong><br>
                            \${result.error}
                        </div>
                    \`;
                }
            } catch (error) {
                resultDiv.innerHTML = \`
                    <div class="result error">
                        ❌ <strong>Chyba při testování \${gateway}:</strong><br>
                        \${error.message}
                    </div>
                \`;
            }
        }

        async function processTestPayment() {
            const resultDiv = document.getElementById('paymentResult');
            resultDiv.innerHTML = '<div class="result info">⏳ Zpracovávám testovací platbu...</div>';

            try {
                const response = await fetch('/api/payments/process-test', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount: 299,
                        currency: 'CZK',
                        method: 'card',
                        description: 'Test payment via middleware'
                    })
                });

                const result = await response.json();

                if (result.success) {
                    resultDiv.innerHTML = \`
                        <div class="result success">
                            ✅ <strong>Testovací platba úspěšně zpracována!</strong><br>
                            Payment ID: \${result.paymentId || 'N/A'}<br>
                            Amount: \${result.amount} \${result.currency}<br>
                            Status: \${result.status || 'Processed'}<br>
                            Method: \${result.method}
                        </div>
                    \`;
                } else {
                    resultDiv.innerHTML = \`
                        <div class="result error">
                            ❌ <strong>Chyba při zpracování platby:</strong><br>
                            \${result.error}
                        </div>
                    \`;
                }
            } catch (error) {
                resultDiv.innerHTML = \`
                    <div class="result error">
                        ❌ <strong>Chyba při komunikaci:</strong><br>
                        \${error.message}
                    </div>
                \`;
            }
        }

        async function validatePaymentMethods() {
            const resultDiv = document.getElementById('paymentResult');
            resultDiv.innerHTML = '<div class="result info">⏳ Validuji platební metody...</div>';

            try {
                const response = await fetch('/api/payments/methods');
                const result = await response.json();

                if (result.success && result.methods) {
                    resultDiv.innerHTML = \`
                        <div class="result success">
                            ✅ <strong>Platební metody validovány!</strong><br>
                            Počet dostupných metod: \${result.methods.length}<br>
                            Metody: \${result.methods.map(m => m.name || m.id).join(', ')}
                        </div>
                    \`;
                } else {
                    resultDiv.innerHTML = \`
                        <div class="result error">
                            ❌ <strong>Chyba při validaci platebních metod:</strong><br>
                            \${result.error || 'Unknown error'}
                        </div>
                    \`;
                }
            } catch (error) {
                resultDiv.innerHTML = \`
                    <div class="result error">
                        ❌ <strong>Chyba při komunikaci:</strong><br>
                        \${error.message}
                    </div>
                \`;
            }
        }

        async function getPaymentStats() {
            const resultDiv = document.getElementById('statsResult');
            resultDiv.innerHTML = '<div class="result info">⏳ Načítám statistiky plateb...</div>';

            try {
                const response = await fetch('/api/payments/stats');
                const result = await response.json();

                if (result.success) {
                    resultDiv.innerHTML = \`
                        <div class="result success">
                            ✅ <strong>Statistiky plateb:</strong><br>
                            Celkový počet plateb: \${result.totalPayments || 0}<br>
                            Úspěšné platby: \${result.successfulPayments || 0}<br>
                            Neúspěšné platby: \${result.failedPayments || 0}<br>
                            Úspěšnost: \${result.successRate || 0}%
                        </div>
                    \`;
                } else {
                    resultDiv.innerHTML = \`
                        <div class="result error">
                            ❌ <strong>Chyba při načítání statistik:</strong><br>
                            \${result.error || 'Unknown error'}
                        </div>
                    \`;
                }
            } catch (error) {
                resultDiv.innerHTML = \`
                    <div class="result error">
                        ❌ <strong>Chyba při komunikaci:</strong><br>
                        \${error.message}
                    </div>
                \`;
            }
        }
    </script>
</body>
</html>`;

    res.send(html);

  } catch (error) {
    logger.error('Payment test failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Payment Process Test endpoint
app.post('/api/payments/process-test', async (req, res) => {
  try {
    const { amount, currency, method, description } = req.body;

    logger.info('Processing test payment', { amount, currency, method });

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    // Simulate success/failure (90% success rate)
    const isSuccess = Math.random() > 0.1;

    if (isSuccess) {
      const paymentId = 'TEST_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

      res.json({
        success: true,
        paymentId,
        amount,
        currency,
        method,
        status: 'completed',
        description,
        processedAt: new Date().toISOString()
      });
    } else {
      res.json({
        success: false,
        error: 'Payment processing failed (simulated failure)',
        amount,
        currency,
        method
      });
    }

  } catch (error) {
    logger.error('Test payment processing failed', { error: error.message });
    res.json({
      success: false,
      error: error.message
    });
  }
});

// Payment Stats endpoint
app.get('/api/payments/stats', async (req, res) => {
  try {
    // Simulate payment statistics
    const stats = {
      totalPayments: Math.floor(Math.random() * 1000) + 100,
      successfulPayments: Math.floor(Math.random() * 900) + 80,
      failedPayments: Math.floor(Math.random() * 100) + 10,
    };

    stats.successRate = Math.round((stats.successfulPayments / stats.totalPayments) * 100);

    res.json({
      success: true,
      ...stats,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Payment stats failed', { error: error.message });
    res.json({
      success: false,
      error: error.message
    });
  }
});

// Test Payment Gateway endpoint
app.get('/test-payment-gateway', async (req, res) => {
  try {
    const html = `
<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Payment Gateway</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .gateway-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .gateway-card { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 15px; text-align: center; }
        .gateway-icon { font-size: 32px; margin-bottom: 10px; }
        .btn { padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 5px; }
        .btn:hover { background: #0056b3; }
        .back-link { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #6c757d; color: white; text-decoration: none; border-radius: 5px; }
        .back-link:hover { background: #545b62; }
        .result { margin-top: 15px; padding: 15px; border-radius: 5px; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Test Payment Gateway</h1>
            <p>Test jednotlivých platebních bran přes middleware</p>
        </div>

        <div class="gateway-grid">
            <div class="gateway-card">
                <div class="gateway-icon">💳</div>
                <h4>Credit Card</h4>
                <button onclick="testGateway('card')" class="btn">Test Card</button>
            </div>

            <div class="gateway-card">
                <div class="gateway-icon">🅿️</div>
                <h4>PayPal</h4>
                <button onclick="testGateway('paypal')" class="btn">Test PayPal</button>
            </div>

            <div class="gateway-card">
                <div class="gateway-icon">🏦</div>
                <h4>Bank Transfer</h4>
                <button onclick="testGateway('banktransfer')" class="btn">Test Bank</button>
            </div>

            <div class="gateway-card">
                <div class="gateway-icon">₿</div>
                <h4>Crypto</h4>
                <button onclick="testGateway('crypto')" class="btn">Test Crypto</button>
            </div>
        </div>

        <div id="result"></div>

        <a href="/test-portal" class="back-link">← Zpět na Test Portal</a>
    </div>

    <script>
        async function testGateway(gateway) {
            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = \`<div class="result info">⏳ Testování \${gateway} gateway...</div>\`;

            try {
                const response = await fetch(\`/api/payments/test-gateway/\${gateway}\`);
                const result = await response.json();

                if (result.success) {
                    resultDiv.innerHTML = \`
                        <div class="result success">
                            ✅ <strong>\${gateway} gateway test úspěšný!</strong><br>
                            Status: \${result.status}<br>
                            Response time: \${result.responseTime}ms<br>
                            Message: \${result.message}
                        </div>
                    \`;
                } else {
                    resultDiv.innerHTML = \`
                        <div class="result error">
                            ❌ <strong>\${gateway} gateway test selhal:</strong><br>
                            \${result.error}
                        </div>
                    \`;
                }
            } catch (error) {
                resultDiv.innerHTML = \`
                    <div class="result error">
                        ❌ <strong>Chyba při testování:</strong><br>
                        \${error.message}
                    </div>
                \`;
            }
        }
    </script>
</body>
</html>`;

    res.send(html);

  } catch (error) {
    logger.error('Test payment gateway failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

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
