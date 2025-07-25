/**
 * HostBill Order Processing Middleware
 * Secure middleware for processing orders between Cloud VPS and HostBill API
 * Port: 3005
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const logger = require('./utils/logger');
const HostBillClient = require('./lib/hostbill-client');
const OrderProcessor = require('./lib/order-processor');
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

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
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

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Initialize HostBill client and Order processor
const hostbillClient = new HostBillClient();
const orderProcessor = new OrderProcessor(hostbillClient);

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
      version: '1.0.0',
      port: PORT,
      uptime: process.uptime(),
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

// 404 handler
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
  logger.info(`HostBill Order Middleware started on port ${PORT}`, {
    environment: process.env.NODE_ENV,
    hostbillUrl: process.env.HOSTBILL_BASE_URL
  });
  
  console.log(`🚀 HostBill Order Middleware running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test connection: http://localhost:${PORT}/api/test-connection`);
});

module.exports = app;
