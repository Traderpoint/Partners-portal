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
const fs = require('fs');
const compression = require('compression');

// Import utilities and libraries
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
const PORT = process.env.PORT || 3004;

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

// Static files for dashboard
app.use('/dashboard/static', express.static(path.join(__dirname, 'dashboard/public')));

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
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      port: PORT,
      uptime: Math.floor((Date.now() - dashboardStats.startTime.getTime()) / 1000),
      hostbill: {
        status: hostbillStatus,
        baseUrl: process.env.HOSTBILL_BASE_URL
      },
      productMapping: mappingStats,
      dashboard: {
        enabled: process.env.DASHBOARD_ENABLED !== 'false',
        path: process.env.DASHBOARD_PATH || '/dashboard',
        requests: dashboardStats.requests,
        lastActivity: dashboardStats.lastActivity
      },
      integrations: {
        cloudvps: {
          url: process.env.CLOUDVPS_URL || 'http://localhost:3000',
          status: 'configured'
        },
        partnersPortal: {
          url: process.env.PARTNERS_PORTAL_URL || 'http://localhost:3006',
          status: 'configured'
        }
      }
    });
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Integrated Dashboard Route
app.get('/dashboard', async (req, res) => {
  try {
    // Get middleware health
    let middlewareHealth = 'unknown';
    let hostbillStatus = 'unknown';

    try {
      const testResult = await hostbillClient.makeApiCall({
        call: 'getOrderPages'
      });
      hostbillStatus = testResult ? 'connected' : 'disconnected';
      middlewareHealth = 'healthy';
    } catch (error) {
      hostbillStatus = 'disconnected';
      middlewareHealth = 'unhealthy';
    }

    // Get system stats
    const uptime = Math.floor((Date.now() - dashboardStats.startTime.getTime()) / 1000);
    const mappingStats = productMapper.getStats();

    // Render dashboard
    res.render('dashboard', {
      title: 'Systrix Middleware Dashboard',
      stats: {
        ...dashboardStats,
        uptime,
        middlewareHealth,
        hostbillStatus
      },
      config: {
        port: PORT,
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'development',
        hostbillUrl: process.env.HOSTBILL_BASE_URL
      },
      mapping: mappingStats,
      recentRequests: dashboardStats.recentRequests.slice(0, 10)
    });
  } catch (error) {
    logger.error('Dashboard error', error);
    res.status(500).render('error', {
      title: 'Dashboard Error',
      error: error.message
    });
  }
});

// Test HostBill connection endpoint
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

// Get products endpoint
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
    const productMapping = {};

    for (const orderpage of orderPagesData.categories) {
      try {
        const productsData = await hostbillClient.makeApiCall({
          call: 'getProducts',
          id: orderpage.id
        });

        if (productsData && productsData.products) {
          const categoryProducts = Object.values(productsData.products);

          categoryProducts.forEach(product => {
            const mappedProduct = {
              ...product,
              orderpage_id: orderpage.id,
              orderpage_name: orderpage.name,
              category: orderpage.name
            };

            allProducts.push(mappedProduct);
            productMapping[product.id] = mappedProduct;
          });

          logger.debug(`Found ${categoryProducts.length} products in orderpage ${orderpage.name}`);
        }
      } catch (error) {
        logger.warn(`Failed to get products for orderpage ${orderpage.id}`, { error: error.message });
      }
    }

    // Update product mapper
    productMapper.updateMapping(productMapping);

    logger.info(`Successfully loaded ${allProducts.length} products from HostBill`);

    res.json({
      success: true,
      products: allProducts,
      totalProducts: allProducts.length,
      orderpages: orderPagesData.categories.length,
      timestamp: new Date().toISOString(),
      source: 'hostbill_api'
    });

  } catch (error) {
    logger.error('Failed to get products', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get products from HostBill',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get payment methods endpoint
app.get('/api/payments/methods', async (req, res) => {
  try {
    logger.info('Getting payment methods from HostBill');
    const result = await paymentProcessor.getPaymentMethods();

    res.json({
      success: true,
      paymentMethods: result,
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

// 404 handler - must be last
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      '/',
      '/health',
      '/dashboard',
      '/api/test-connection',
      '/api/affiliates',
      '/api/products',
      '/api/payments/methods'
    ]
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
