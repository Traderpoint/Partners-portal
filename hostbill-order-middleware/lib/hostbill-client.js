/**
 * HostBill API Client
 * Secure client for communicating with HostBill Admin API
 */

const axios = require('axios');
const https = require('https');
const logger = require('../utils/logger');

class HostBillClient {
  constructor() {
    this.apiUrl = process.env.HOSTBILL_API_URL;
    this.apiId = process.env.HOSTBILL_API_ID;
    this.apiKey = process.env.HOSTBILL_API_KEY;
    this.baseUrl = process.env.HOSTBILL_BASE_URL;

    if (!this.apiUrl || !this.apiId || !this.apiKey) {
      throw new Error('HostBill API credentials are not configured');
    }

    // Create axios instance with SSL bypass for development
    this.httpClient = axios.create({
      timeout: 30000,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false // Only for development
      })
    });

    logger.info('HostBill client initialized', {
      apiUrl: this.apiUrl,
      apiId: this.apiId,
      hasCredentials: !!(this.apiId && this.apiKey)
    });
  }

  /**
   * Make API call to HostBill
   * @param {Object} params - API parameters
   * @returns {Promise<Object>} API response
   */
  async makeApiCall(params) {
    try {
      const payload = {
        api_id: this.apiId,
        api_key: this.apiKey,
        ...params
      };

      logger.debug('Making HostBill API call', {
        call: params.call,
        hasApiId: !!payload.api_id,
        hasApiKey: !!payload.api_key,
        apiId: this.apiId,
        apiKey: this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'missing'
      });

      // Create form data manually
      const formData = new URLSearchParams();
      Object.keys(payload).forEach(key => {
        if (payload[key] !== undefined && payload[key] !== null) {
          formData.append(key, payload[key]);
        }
      });

      logger.debug('Form data being sent', {
        formDataString: formData.toString(),
        keys: Array.from(formData.keys())
      });

      const response = await this.httpClient.post(this.apiUrl, formData.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (response.data && response.data.success === false) {
        throw new Error(response.data.error || 'HostBill API call failed');
      }

      logger.debug('HostBill API call successful', {
        call: params.call,
        responseSize: JSON.stringify(response.data).length
      });

      return response.data;

    } catch (error) {
      logger.error('HostBill API call failed', {
        call: params.call,
        error: error.message,
        response: error.response?.data
      });
      throw error;
    }
  }

  /**
   * Test connection to HostBill API
   * @returns {Promise<Object>} Connection test result
   */
  async testConnection() {
    try {
      const result = await this.makeApiCall({
        call: 'getAffiliates'
      });

      return {
        connected: true,
        message: 'HostBill API connection successful',
        affiliateCount: result.affiliates ? result.affiliates.length : 0
      };
    } catch (error) {
      throw new Error(`HostBill connection failed: ${error.message}`);
    }
  }

  /**
   * Find existing client by email
   * @param {string} email - Client email
   * @returns {Promise<Object|null>} Existing client data or null
   */
  async findClientByEmail(email) {
    try {
      logger.debug('Searching for existing client', { email });

      // HostBill getClients doesn't filter by email properly, so we get all clients
      // and filter on our side
      const result = await this.makeApiCall({
        call: 'getClients'
      });

      logger.debug('getClients response', {
        clientCount: result.clients ? result.clients.length : 0,
        searchEmail: email
      });

      // Check if client exists in response and filter by email
      if (result.clients && result.clients.length > 0) {
        const matchingClient = result.clients.find(client =>
          client.email && client.email.toLowerCase() === email.toLowerCase()
        );

        if (matchingClient) {
          logger.info('Found existing client', {
            clientId: matchingClient.id,
            email: matchingClient.email
          });

          return {
            id: matchingClient.id,
            email: matchingClient.email,
            firstName: matchingClient.firstname,
            lastName: matchingClient.lastname
          };
        }
      }

      logger.debug('Client not found via getClients', { email });
      return null;

    } catch (error) {
      logger.debug('Client search failed', {
        email,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Create client in HostBill or return existing one
   * @param {Object} clientData - Client information
   * @returns {Promise<Object>} Created or found client data
   */
  async createClient(clientData) {
    try {
      // First, try to find existing client
      const existingClient = await this.findClientByEmail(clientData.email);

      if (existingClient) {
        logger.info('Using existing client', {
          clientId: existingClient.id,
          email: existingClient.email
        });
        return existingClient;
      }

      // If no existing client, create new one
      logger.info('Creating client in HostBill', {
        email: clientData.email,
        firstName: clientData.firstName,
        lastName: clientData.lastName
      });

      const result = await this.makeApiCall({
        call: 'addClient',
        firstname: clientData.firstName,
        lastname: clientData.lastName,
        email: clientData.email,
        phonenumber: clientData.phone,
        address1: clientData.address,
        city: clientData.city,
        postcode: clientData.postalCode,
        country: clientData.country,
        state: clientData.state || '',
        companyname: clientData.company || '',
        password: this.generateRandomPassword(),
        currency: process.env.DEFAULT_CURRENCY || 'CZK'
      });

      // Debug log the full response
      logger.debug('HostBill client_add response', { result });

      // Check for different possible response formats
      const clientId = result.client_id || result.id || result.clientId;

      if (!clientId) {
        logger.error('No client ID in response', { result });
        throw new Error(`Failed to create client - no client ID returned. Response: ${JSON.stringify(result)}`);
      }

      logger.info('Client created successfully', {
        clientId: clientId,
        email: clientData.email
      });

      return {
        id: clientId,
        email: clientData.email,
        firstName: clientData.firstName,
        lastName: clientData.lastName
      };

    } catch (error) {
      logger.error('Failed to create client', {
        email: clientData.email,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Create order in HostBill
   * @param {Object} orderData - Order information
   * @returns {Promise<Object>} Created order data
   */
  async createOrder(orderData) {
    try {
      logger.info('Creating order in HostBill', {
        clientId: orderData.clientId,
        productId: orderData.productId,
        affiliateId: orderData.affiliateId,
        configOptions: orderData.configOptions,
        addons: orderData.addons?.length || 0
      });

      const orderParams = {
        call: 'addOrder',
        client_id: orderData.clientId,
        product: orderData.productId,
        cycle: orderData.cycle || 'm',
        confirm: 1,
        invoice_generate: 1,
        invoice_info: 1
      };

      // Add affiliate if present
      if (orderData.affiliateId) {
        orderParams.affiliate_id = orderData.affiliateId;
      }

      // Add configuration options if present
      if (orderData.configOptions) {
        Object.keys(orderData.configOptions).forEach(key => {
          if (key.startsWith('config_option_')) {
            // Already prefixed
            orderParams[key] = orderData.configOptions[key];
          } else {
            // Add prefix
            orderParams[`config_option_${key}`] = orderData.configOptions[key];
          }
        });
      }

      // Add addons if present
      if (orderData.addons && orderData.addons.length > 0) {
        orderData.addons.forEach((addon, index) => {
          if (addon.addon_id && addon.enabled) {
            orderParams[`addons[${addon.addon_id}][qty]`] = 1;
            logger.debug('Added addon to order', {
              addonId: addon.addon_id,
              name: addon.name
            });
          }
        });
      }

      // Add any additional parameters passed directly
      Object.keys(orderData).forEach(key => {
        if (!['clientId', 'productId', 'cycle', 'affiliateId', 'configOptions', 'addons', 'total'].includes(key)) {
          orderParams[key] = orderData[key];
        }
      });

      const result = await this.makeApiCall(orderParams);

      logger.debug('HostBill addOrder response', { result });

      if (!result.order_id && !result.id && !result.success) {
        logger.error('Order creation failed - full response', { result });
        throw new Error(`Failed to create order - no order ID returned. Response: ${JSON.stringify(result)}`);
      }

      const orderId = result.order_id || result.id;

      // Get order details to fetch the actual order number
      let orderNumber = orderId; // fallback to order ID
      try {
        const orderDetails = await this.makeApiCall({
          call: 'getOrderDetails',
          id: orderId
        });

        if (orderDetails && orderDetails.details && orderDetails.details.number) {
          orderNumber = orderDetails.details.number;
          logger.debug('Retrieved order number from getOrderDetails', {
            orderId,
            orderNumber
          });
        }
      } catch (error) {
        logger.warn('Failed to get order details for order number', {
          orderId,
          error: error.message
        });
      }

      logger.info('Order created successfully', {
        orderId: orderId,
        orderNumber: orderNumber,
        invoiceId: result.invoice_id,
        clientId: orderData.clientId
      });

      return {
        orderId: orderId,
        orderNumber: orderNumber,
        invoiceId: result.invoice_id,
        status: result.status || 'pending',
        total: result.total || orderData.total
      };

    } catch (error) {
      logger.error('Failed to create order', {
        clientId: orderData.clientId,
        productId: orderData.productId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Assign affiliate to order using setOrderReferrer
   * @param {string} orderId - Order ID
   * @param {string} affiliateId - Affiliate ID
   * @returns {Promise<Object>} Assignment result
   */
  async assignOrderToAffiliate(orderId, affiliateId) {
    try {
      logger.info('Assigning order to affiliate', {
        orderId,
        affiliateId
      });

      const result = await this.makeApiCall({
        call: 'setOrderReferrer',
        id: orderId,
        referral: affiliateId
      });

      logger.info('Order assigned to affiliate successfully', {
        orderId,
        affiliateId,
        result
      });

      return {
        success: true,
        orderId,
        affiliateId,
        message: 'Order assigned to affiliate successfully',
        result
      };

    } catch (error) {
      logger.error('Failed to assign order to affiliate', {
        orderId,
        affiliateId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Legacy method - kept for backward compatibility
   * Note: HostBill doesn't have direct client-to-affiliate assignment API
   * Affiliate assignment should be done at order level using setOrderReferrer
   */
  async assignClientToAffiliate(clientId, affiliateId) {
    logger.warn('assignClientToAffiliate is deprecated - affiliate assignment should be done at order level', {
      clientId,
      affiliateId
    });

    // Return success but don't actually do anything
    // The affiliate assignment will be handled at order level
    return {
      success: true,
      clientId,
      affiliateId,
      message: 'Affiliate assignment will be handled at order level'
    };
  }

  /**
   * Validate affiliate ID
   * @param {string} affiliateId - Affiliate ID to validate
   * @returns {Promise<Object>} Affiliate data or null
   */
  async validateAffiliate(affiliateId) {
    try {
      // Get all affiliates and find the specific one
      const result = await this.makeApiCall({
        call: 'getAffiliates'
      });

      if (result.affiliates && Array.isArray(result.affiliates)) {
        const affiliate = result.affiliates.find(aff => aff.id === affiliateId.toString());

        if (affiliate && affiliate.status === 'Active') {
          return {
            id: affiliate.id,
            name: affiliate.name || `${affiliate.firstname} ${affiliate.lastname}`,
            status: affiliate.status,
            email: affiliate.email,
            firstname: affiliate.firstname,
            lastname: affiliate.lastname,
            companyname: affiliate.companyname
          };
        }
      }

      return null;
    } catch (error) {
      logger.warn('Affiliate validation failed', {
        affiliateId,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Get order details
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Order details
   */
  async getOrderDetails(orderId) {
    try {
      // Try getOrders first (might be the correct method)
      const result = await this.makeApiCall({
        call: 'getOrders',
        order_id: orderId
      });

      // Debug log the full response
      logger.debug('HostBill getOrders response', {
        orderId,
        result,
        hasOrders: !!result.orders,
        resultKeys: Object.keys(result)
      });

      // If we have orders array, find the specific order
      if (result.orders && Array.isArray(result.orders)) {
        const order = result.orders.find(o => o.id == orderId || o.order_id == orderId);
        if (order) {
          return order;
        }
      }

      // If no specific order found, return first order or null
      return result.orders?.[0] || result.order || result || null;
    } catch (error) {
      logger.error('Failed to get order details', {
        orderId,
        error: error.message
      });

      // Return a basic order object with just the ID so confirmation page works
      return {
        id: orderId,
        order_id: orderId,
        number: orderId, // Use orderId as fallback number
        status: 'pending',
        total: 'N/A'
      };
    }
  }

  /**
   * Generate random password for new clients
   * @returns {string} Random password
   */
  generateRandomPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}

module.exports = HostBillClient;
