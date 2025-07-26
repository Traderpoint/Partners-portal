/**
 * Payment Processor
 * Handles payment processing workflow with HostBill payment gateways
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class PaymentProcessor {
  constructor(hostbillClient) {
    this.hostbillClient = hostbillClient;
    this.supportedGateways = new Map();
    this.initializeSupportedGateways();
  }

  /**
   * Initialize supported payment gateways mapping
   */
  initializeSupportedGateways() {
    // Map CloudVPS payment methods to HostBill gateway IDs
    this.supportedGateways.set('card', {
      id: process.env.HOSTBILL_GATEWAY_CARD || '1',
      name: 'Credit Card',
      type: 'redirect',
      requiresRedirect: true
    });

    this.supportedGateways.set('paypal', {
      id: process.env.HOSTBILL_GATEWAY_PAYPAL || '2',
      name: 'PayPal',
      type: 'redirect',
      requiresRedirect: true
    });

    this.supportedGateways.set('banktransfer', {
      id: process.env.HOSTBILL_GATEWAY_BANK || '3',
      name: 'Bank Transfer',
      type: 'manual',
      requiresRedirect: false
    });

    this.supportedGateways.set('crypto', {
      id: process.env.HOSTBILL_GATEWAY_CRYPTO || '4',
      name: 'Cryptocurrency',
      type: 'redirect',
      requiresRedirect: true
    });

    this.supportedGateways.set('payu', {
      id: process.env.HOSTBILL_GATEWAY_PAYU || '5',
      name: 'PayU',
      type: 'redirect',
      requiresRedirect: true
    });

    logger.info('Payment gateways initialized', {
      gateways: Array.from(this.supportedGateways.keys())
    });
  }

  /**
   * Get available payment methods
   * @returns {Promise<Array>} Available payment methods
   */
  async getAvailablePaymentMethods() {
    try {
      logger.info('Fetching available payment methods');

      let hostbillGateways = [];

      try {
        // Try to get HostBill payment gateways
        hostbillGateways = await this.hostbillClient.getPaymentGateways();
        logger.info('HostBill gateways retrieved', { count: hostbillGateways.length });
      } catch (hostbillError) {
        logger.warn('Failed to get HostBill payment gateways, using all as enabled', {
          error: hostbillError.message
        });

        // Use fallback - assume all gateways are enabled for testing
        hostbillGateways = [
          { id: '1', name: 'Credit Card', enabled: true },
          { id: '2', name: 'PayPal', enabled: true },
          { id: '3', name: 'Bank Transfer', enabled: true },
          { id: '4', name: 'Cryptocurrency', enabled: true },
          { id: '5', name: 'PayU', enabled: true }
        ];
      }

      const availableMethods = [];

      // Map HostBill gateways to our supported methods
      for (const [method, config] of this.supportedGateways) {
        // Find matching HostBill gateway by method or ID
        const hostbillGateway = hostbillGateways.find(g =>
          g.method === method || g.id === config.id
        );

        if (hostbillGateway && hostbillGateway.enabled) {
          // Gateway is active in HostBill
          availableMethods.push({
            method,
            name: hostbillGateway.name,
            type: config.type,
            requiresRedirect: config.requiresRedirect,
            hostbillId: hostbillGateway.id,
            hostbillModuleId: hostbillGateway.hostbillModuleId,
            hostbillName: hostbillGateway.name,
            enabled: true,
            source: hostbillGateway.source || 'hostbill'
          });
          logger.info(`✅ Active method: ${method} -> ${hostbillGateway.name}`);
        } else {
          // Gateway not found or not active in HostBill
          availableMethods.push({
            method,
            name: config.name,
            type: config.type,
            requiresRedirect: config.requiresRedirect,
            hostbillId: config.id,
            enabled: false,
            warning: hostbillGateway ?
              'Gateway found but not enabled in HostBill' :
              'Gateway not found in HostBill configuration',
            source: 'local-config'
          });
          logger.warn(`❌ Inactive method: ${method} - ${config.name}`);
        }
      }

      // Add any unknown HostBill modules that we don't have mapped
      for (const gateway of hostbillGateways) {
        if (gateway.unknown && gateway.enabled) {
          availableMethods.push({
            method: gateway.method,
            name: gateway.name,
            type: 'redirect', // Assume redirect for unknown modules
            requiresRedirect: true,
            hostbillId: gateway.id,
            hostbillModuleId: gateway.hostbillModuleId,
            enabled: true,
            source: gateway.source,
            unknown: true,
            warning: 'Unknown HostBill module - may require custom integration'
          });
          logger.info(`⚠️ Unknown active module: ${gateway.name} (${gateway.hostbillModuleId})`);
        }
      }

      logger.info('Available payment methods retrieved', {
        count: availableMethods.length,
        enabled: availableMethods.filter(m => m.enabled).length
      });

      return availableMethods;
    } catch (error) {
      logger.error('Failed to get available payment methods', {
        error: error.message
      });

      // Return default methods if everything fails
      return Array.from(this.supportedGateways.entries()).map(([method, config]) => ({
        method,
        name: config.name,
        type: config.type,
        requiresRedirect: config.requiresRedirect,
        hostbillId: config.id,
        enabled: true,
        fallback: true
      }));
    }
  }

  /**
   * Initialize payment for order
   * @param {Object} paymentData - Payment initialization data
   * @returns {Promise<Object>} Payment initialization result
   */
  async initializePayment(paymentData) {
    const paymentId = uuidv4();
    
    logger.info('Initializing payment', {
      paymentId,
      orderId: paymentData.orderId,
      invoiceId: paymentData.invoiceId,
      method: paymentData.method,
      amount: paymentData.amount
    });

    try {
      const gateway = this.supportedGateways.get(paymentData.method);

      if (!gateway) {
        throw new Error(`Unsupported payment method: ${paymentData.method}`);
      }

      // Check if payment method is active in HostBill
      const availableMethods = await this.getAvailablePaymentMethods();
      const activeMethod = availableMethods.methods.find(m => m.method === paymentData.method);

      if (!activeMethod || !activeMethod.enabled) {
        throw new Error(`Payment method '${paymentData.method}' is not active in HostBill configuration`);
      }

      logger.info('Payment method validated', {
        method: paymentData.method,
        enabled: activeMethod.enabled,
        source: activeMethod.source
      });

      const result = {
        paymentId,
        orderId: paymentData.orderId,
        invoiceId: paymentData.invoiceId,
        method: paymentData.method,
        gateway: gateway,
        amount: paymentData.amount,
        currency: paymentData.currency || 'CZK',
        status: 'initialized',
        timestamp: new Date().toISOString()
      };

      // Handle different payment types
      if (gateway.requiresRedirect) {
        // Check if we're in test mode
        if (process.env.PAYMENT_TEST_MODE === 'true') {
          // Generate test payment URL
          result.paymentUrl = this.generateTestPaymentUrl(paymentId, paymentData);
          result.redirectRequired = true;
          result.testMode = true;

          logger.info('Test payment URL generated', {
            paymentId,
            paymentUrl: result.paymentUrl,
            testMode: true
          });
        } else {
          // Generate real payment URL for redirect gateways
          const paymentUrl = await this.hostbillClient.getInvoicePaymentUrl(
            paymentData.invoiceId,
            gateway.id
          );

          result.paymentUrl = paymentUrl.paymentUrl;
          result.redirectRequired = true;

          logger.info('Payment URL generated for redirect gateway', {
            paymentId,
            paymentUrl: result.paymentUrl
          });
        }
      } else {
        // Manual payment (bank transfer)
        result.redirectRequired = false;
        result.instructions = this.getManualPaymentInstructions(paymentData.method);

        logger.info('Manual payment initialized', {
          paymentId,
          method: paymentData.method
        });
      }

      return result;
    } catch (error) {
      logger.error('Failed to initialize payment', {
        paymentId,
        orderId: paymentData.orderId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Process payment callback/webhook
   * @param {Object} callbackData - Payment callback data
   * @returns {Promise<Object>} Processing result
   */
  async processPaymentCallback(callbackData) {
    const processingId = uuidv4();
    
    logger.info('Processing payment callback', {
      processingId,
      gateway: callbackData.gateway,
      transactionId: callbackData.transactionId,
      status: callbackData.status
    });

    try {
      const result = {
        processingId,
        success: false,
        message: '',
        timestamp: new Date().toISOString()
      };

      // Validate callback data
      if (!callbackData.invoiceId || !callbackData.transactionId) {
        throw new Error('Missing required callback data');
      }

      // Process based on payment status
      switch (callbackData.status) {
        case 'completed':
        case 'success':
        case 'paid':
          await this.handleSuccessfulPayment(callbackData);
          result.success = true;
          result.message = 'Payment processed successfully';
          break;

        case 'failed':
        case 'error':
        case 'declined':
          await this.handleFailedPayment(callbackData);
          result.success = false;
          result.message = 'Payment failed';
          break;

        case 'pending':
        case 'processing':
          await this.handlePendingPayment(callbackData);
          result.success = true;
          result.message = 'Payment is being processed';
          break;

        default:
          logger.warn('Unknown payment status', {
            processingId,
            status: callbackData.status
          });
          result.message = `Unknown payment status: ${callbackData.status}`;
      }

      logger.info('Payment callback processed', {
        processingId,
        success: result.success,
        message: result.message
      });

      return result;
    } catch (error) {
      logger.error('Failed to process payment callback', {
        processingId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Handle successful payment
   * @param {Object} callbackData - Payment callback data
   */
  async handleSuccessfulPayment(callbackData) {
    logger.info('Handling successful payment', {
      invoiceId: callbackData.invoiceId,
      transactionId: callbackData.transactionId,
      amount: callbackData.amount
    });

    // Add payment to invoice in HostBill
    await this.hostbillClient.processPayment({
      invoiceId: callbackData.invoiceId,
      amount: callbackData.amount,
      gatewayId: callbackData.gatewayId,
      transactionId: callbackData.transactionId,
      fee: callbackData.fee || 0,
      sendEmail: true
    });

    logger.info('Successful payment recorded in HostBill', {
      invoiceId: callbackData.invoiceId,
      transactionId: callbackData.transactionId
    });
  }

  /**
   * Handle failed payment
   * @param {Object} callbackData - Payment callback data
   */
  async handleFailedPayment(callbackData) {
    logger.warn('Handling failed payment', {
      invoiceId: callbackData.invoiceId,
      transactionId: callbackData.transactionId,
      reason: callbackData.failureReason
    });

    // Log failed payment attempt
    // Could also update invoice notes or send notification
  }

  /**
   * Handle pending payment
   * @param {Object} callbackData - Payment callback data
   */
  async handlePendingPayment(callbackData) {
    logger.info('Handling pending payment', {
      invoiceId: callbackData.invoiceId,
      transactionId: callbackData.transactionId
    });

    // Log pending payment
    // Could set up monitoring for status updates
  }

  /**
   * Get manual payment instructions
   * @param {string} method - Payment method
   * @returns {Object} Payment instructions
   */
  getManualPaymentInstructions(method) {
    const instructions = {
      banktransfer: {
        title: 'Bankovní převod',
        details: {
          accountNumber: process.env.BANK_ACCOUNT_NUMBER || '123456789/0100',
          bankName: process.env.BANK_NAME || 'Komerční banka',
          iban: process.env.BANK_IBAN || 'CZ65 0100 0000 0012 3456 7890',
          swift: process.env.BANK_SWIFT || 'KOMBCZPP',
          variableSymbol: 'Číslo faktury',
          note: 'Prosím uveďte číslo faktury jako variabilní symbol'
        }
      }
    };

    return instructions[method] || null;
  }

  /**
   * Generate test payment URL for testing purposes
   * @param {string} paymentId - Payment ID
   * @param {Object} paymentData - Payment data
   * @returns {string} Test payment URL
   */
  generateTestPaymentUrl(paymentId, paymentData) {
    const baseUrl = process.env.PAYMENT_TEST_BASE_URL || 'http://localhost:3005';
    const successUrl = encodeURIComponent(process.env.PAYMENT_TEST_SUCCESS_URL || 'http://localhost:3000/order-confirmation');
    const cancelUrl = encodeURIComponent(process.env.PAYMENT_TEST_CANCEL_URL || 'http://localhost:3000/payment');

    // Create test payment URL with parameters
    const testUrl = `${baseUrl}/test-payment?` +
      `paymentId=${paymentId}&` +
      `orderId=${paymentData.orderId}&` +
      `invoiceId=${paymentData.invoiceId}&` +
      `method=${paymentData.method}&` +
      `amount=${paymentData.amount}&` +
      `currency=${paymentData.currency || 'CZK'}&` +
      `successUrl=${successUrl}&` +
      `cancelUrl=${cancelUrl}&` +
      `testMode=true`;

    return testUrl;
  }

  /**
   * Process test payment completion
   * @param {Object} testData - Test payment data
   * @returns {Promise<Object>} Processing result
   */
  async processTestPayment(testData) {
    const processingId = uuidv4();

    logger.info('Processing test payment', {
      processingId,
      paymentId: testData.paymentId,
      orderId: testData.orderId,
      status: testData.status
    });

    try {
      const result = {
        processingId,
        success: false,
        message: '',
        timestamp: new Date().toISOString(),
        testMode: true
      };

      // Simulate payment processing based on test configuration
      const simulateSuccess = process.env.PAYMENT_SIMULATE_SUCCESS === 'true';

      if (simulateSuccess && testData.status === 'success') {
        result.success = true;
        result.message = 'Test payment completed successfully';
        result.transactionId = `TEST-${Date.now()}`;

        // Log successful test payment
        logger.info('Test payment completed successfully', {
          processingId,
          paymentId: testData.paymentId,
          transactionId: result.transactionId
        });
      } else if (testData.status === 'cancel') {
        result.success = false;
        result.message = 'Test payment cancelled by user';

        logger.info('Test payment cancelled', {
          processingId,
          paymentId: testData.paymentId
        });
      } else {
        result.success = false;
        result.message = 'Test payment failed';

        logger.info('Test payment failed', {
          processingId,
          paymentId: testData.paymentId
        });
      }

      return result;
    } catch (error) {
      logger.error('Failed to process test payment', {
        processingId,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = PaymentProcessor;
