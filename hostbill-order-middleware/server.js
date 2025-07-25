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
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    port: PORT
  });
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
      data: result,
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
