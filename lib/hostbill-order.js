/**
 * HostBill Order Processing Service
 * Handles complete order flow with affiliate tracking
 */

const https = require('https');
const { URLSearchParams } = require('url');

class HostBillOrderService {
  constructor() {
    this.domain = process.env.HOSTBILL_DOMAIN || 'vps.kabel1it.cz';
    this.apiId = process.env.HOSTBILL_API_ID;
    this.apiKey = process.env.HOSTBILL_API_KEY;
    
    if (!this.apiId || !this.apiKey) {
      throw new Error('HostBill API credentials not configured');
    }
  }

  /**
   * Make API call to HostBill
   */
  async makeAPICall(call, params = {}) {
    const postData = new URLSearchParams({
      call,
      api_id: this.apiId,
      api_key: this.apiKey,
      ...params
    }).toString();

    const options = {
      hostname: this.domain,
      port: 443,
      path: '/admin/api.php',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      },
      rejectUnauthorized: false // For self-signed certificates
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.success === false) {
              reject(new Error(response.error || 'HostBill API error'));
            } else {
              resolve(response);
            }
          } catch (error) {
            reject(new Error('Invalid JSON response from HostBill'));
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  /**
   * Validate affiliate code and get affiliate ID
   */
  async validateAffiliateCode(affiliateCode) {
    try {
      console.log(`🔍 Validating affiliate code: ${affiliateCode}`);
      
      // Get all affiliates and find by code
      const response = await this.makeAPICall('getAffiliates');
      const affiliates = response.affiliates || [];
      
      // Look for affiliate by code (assuming code format is AFF-{id} or just {id})
      const affiliate = affiliates.find(aff => {
        const codeVariants = [
          affiliateCode,
          `AFF-${affiliateCode}`,
          affiliateCode.replace('AFF-', ''),
          aff.id
        ];
        return codeVariants.includes(aff.id) || 
               codeVariants.includes(`AFF-${aff.id}`) ||
               (aff.code && codeVariants.includes(aff.code));
      });

      if (affiliate) {
        console.log(`✅ Affiliate found: ${affiliate.firstname} ${affiliate.lastname} (ID: ${affiliate.id})`);
        return {
          id: affiliate.id,
          name: `${affiliate.firstname} ${affiliate.lastname}`,
          status: affiliate.status
        };
      }

      console.log(`❌ Affiliate code ${affiliateCode} not found`);
      return null;
    } catch (error) {
      console.error('Error validating affiliate code:', error);
      return null;
    }
  }

  /**
   * Create or find existing client
   */
  async createOrFindClient(customerData, affiliateId = null) {
    try {
      console.log(`👤 Creating/finding client: ${customerData.email}`);

      // First, try to find existing client by email
      try {
        const existingClient = await this.makeAPICall('getClients', {
          email: customerData.email
        });
        
        if (existingClient.clients && existingClient.clients.length > 0) {
          const client = existingClient.clients[0];
          console.log(`✅ Existing client found: ${client.firstname} ${client.lastname} (ID: ${client.id})`);
          
          // Update affiliate if provided and not already set
          if (affiliateId && (!client.affiliate_id || client.affiliate_id === '0')) {
            await this.assignClientToAffiliate(client.id, affiliateId);
          }
          
          return client;
        }
      } catch (error) {
        console.log('No existing client found, creating new one...');
      }

      // Create new client
      const clientParams = {
        firstname: customerData.firstName,
        lastname: customerData.lastName,
        email: customerData.email,
        phonenumber: customerData.phone || '',
        companyname: customerData.company || '',
        address1: customerData.address || '',
        city: customerData.city || '',
        postcode: customerData.postalCode || '',
        country: customerData.country || 'CZ',
        password: this.generateRandomPassword(),
        status: 'Active'
      };

      // Add affiliate if provided
      if (affiliateId) {
        clientParams.affiliate_id = affiliateId;
      }

      const response = await this.makeAPICall('addClient', clientParams);
      
      if (response.client_id) {
        console.log(`✅ New client created: ID ${response.client_id}`);
        
        // Get full client details
        const clientDetails = await this.makeAPICall('getClient', {
          id: response.client_id
        });
        
        return clientDetails.client;
      }

      throw new Error('Failed to create client');
    } catch (error) {
      console.error('Error creating/finding client:', error);
      throw error;
    }
  }

  /**
   * Assign client to affiliate
   */
  async assignClientToAffiliate(clientId, affiliateId) {
    try {
      console.log(`🔗 Assigning client ${clientId} to affiliate ${affiliateId}`);
      
      await this.makeAPICall('updateClient', {
        id: clientId,
        affiliate_id: affiliateId
      });
      
      console.log(`✅ Client ${clientId} assigned to affiliate ${affiliateId}`);
    } catch (error) {
      console.error('Error assigning client to affiliate:', error);
      throw error;
    }
  }

  /**
   * Create order for client
   */
  async createOrder(clientId, productId, cycle = 'm', configOptions = {}, addons = []) {
    try {
      console.log(`📦 Creating order for client ${clientId}, product ${productId}`);

      const orderParams = {
        client_id: clientId,
        pid: productId, // HostBill uses 'pid' not 'product_id'
        billingcycle: cycle, // HostBill uses 'billingcycle' not 'cycle'
        status: 'Pending'
      };

      // Add config options if provided
      if (Object.keys(configOptions).length > 0) {
        Object.keys(configOptions).forEach(key => {
          orderParams[`configoption[${key}]`] = configOptions[key];
        });
      }

      // Add addons if provided
      if (addons.length > 0) {
        addons.forEach((addon, index) => {
          orderParams[`addon[${index}]`] = addon;
        });
      }

      console.log('Order params:', orderParams);

      // Try different API calls based on HostBill version
      let response;
      try {
        // First try addOrder
        response = await this.makeAPICall('addOrder', orderParams);
      } catch (error) {
        console.log('addOrder failed, trying addInvoice...');

        // If addOrder fails, try addInvoice with different parameters
        const invoiceParams = {
          client_id: clientId,
          status: 'Unpaid',
          items: JSON.stringify([{
            type: 'product',
            product_id: productId,
            description: `Product ${productId}`,
            amount: 1,
            price: 0 // Will be calculated by HostBill
          }])
        };

        response = await this.makeAPICall('addInvoice', invoiceParams);
      }

      if (response.order_id || response.invoice_id) {
        const orderId = response.order_id || response.invoice_id;
        console.log(`✅ Order/Invoice created: ID ${orderId}`);
        return {
          orderId: orderId,
          invoiceId: response.invoice_id || orderId
        };
      }

      throw new Error('Failed to create order');
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  /**
   * Generate random password for new clients
   */
  generateRandomPassword(length = 12) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Complete order process with affiliate tracking
   */
  async processCompleteOrder(orderData) {
    try {
      console.log('🚀 Starting complete order process...');
      console.log('Order data:', JSON.stringify(orderData, null, 2));

      const result = {
        success: false,
        client: null,
        affiliate: null,
        orders: [],
        errors: []
      };

      // Step 1: Validate affiliate if provided
      if (orderData.affiliate?.code) {
        result.affiliate = await this.validateAffiliateCode(orderData.affiliate.code);
        if (!result.affiliate) {
          console.log(`⚠️ Invalid affiliate code: ${orderData.affiliate.code}`);
        }
      }

      // Step 2: Create or find client
      result.client = await this.createOrFindClient(
        orderData.customer,
        result.affiliate?.id
      );

      // Step 3: Create orders for each item
      for (const item of orderData.items) {
        try {
          const order = await this.createOrder(
            result.client.id,
            item.productId,
            item.cycle || 'm',
            item.configOptions || {},
            item.addons || []
          );
          
          result.orders.push({
            ...order,
            productId: item.productId,
            productName: item.name
          });
        } catch (error) {
          result.errors.push(`Failed to create order for ${item.name}: ${error.message}`);
        }
      }

      result.success = result.orders.length > 0;
      
      console.log('✅ Order process completed');
      console.log(`Created ${result.orders.length} orders for client ${result.client.id}`);
      
      return result;
    } catch (error) {
      console.error('Error in complete order process:', error);
      throw error;
    }
  }
}

module.exports = HostBillOrderService;
