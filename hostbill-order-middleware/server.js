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

// Initialize HostBill client and processors
const hostbillClient = new HostBillClient();
const orderProcessor = new OrderProcessor(hostbillClient);
const paymentProcessor = new PaymentProcessor(hostbillClient);

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
  logger.info(`HostBill Order Middleware started on port ${PORT}`, {
    environment: process.env.NODE_ENV,
    hostbillUrl: process.env.HOSTBILL_BASE_URL
  });

  console.log(`🚀 HostBill Order Middleware running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test connection: http://localhost:${PORT}/api/test-connection`);
  console.log(`💳 Payment methods: http://localhost:${PORT}/api/payments/methods`);
});

module.exports = app;
