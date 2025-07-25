/**
 * Order Processor
 * Handles complete order processing workflow
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class OrderProcessor {
  constructor(hostbillClient) {
    this.hostbillClient = hostbillClient;
  }

  /**
   * Process complete order workflow
   * @param {Object} orderData - Complete order data from Cloud VPS
   * @returns {Promise<Object>} Processing result
   */
  async processCompleteOrder(orderData) {
    const processingId = uuidv4();
    
    logger.info('Starting order processing', {
      processingId,
      customerEmail: orderData.customer.email,
      itemCount: orderData.items.length,
      hasAffiliate: !!orderData.affiliate
    });

    const result = {
      processingId,
      client: null,
      affiliate: null,
      orders: [],
      errors: [],
      timestamp: new Date().toISOString()
    };

    try {
      // Step 1: Validate affiliate if present
      if (orderData.affiliate && orderData.affiliate.id) {
        logger.info('Validating affiliate', {
          processingId,
          affiliateId: orderData.affiliate.id
        });

        const affiliate = await this.hostbillClient.validateAffiliate(orderData.affiliate.id);
        if (affiliate) {
          result.affiliate = affiliate;
          logger.info('Affiliate validated successfully', {
            processingId,
            affiliateId: affiliate.id,
            affiliateName: affiliate.name
          });
        } else {
          logger.warn('Invalid affiliate ID provided', {
            processingId,
            affiliateId: orderData.affiliate.id
          });
          result.errors.push(`Invalid affiliate ID: ${orderData.affiliate.id}`);
        }
      }

      // Step 2: Create client in HostBill
      logger.info('Creating client', {
        processingId,
        customerEmail: orderData.customer.email
      });

      const client = await this.hostbillClient.createClient({
        firstName: orderData.customer.firstName,
        lastName: orderData.customer.lastName,
        email: orderData.customer.email,
        phone: orderData.customer.phone,
        address: orderData.customer.address,
        city: orderData.customer.city,
        postalCode: orderData.customer.postalCode,
        country: orderData.customer.country,
        state: orderData.customer.state,
        company: orderData.customer.company
      });

      result.client = client;

      // Step 3: Assign client to affiliate if validated
      if (result.affiliate && client.id) {
        try {
          logger.info('Assigning client to affiliate', {
            processingId,
            clientId: client.id,
            affiliateId: result.affiliate.id
          });

          await this.hostbillClient.assignClientToAffiliate(client.id, result.affiliate.id);
          
          logger.info('Client assigned to affiliate successfully', {
            processingId,
            clientId: client.id,
            affiliateId: result.affiliate.id
          });
        } catch (error) {
          logger.error('Failed to assign client to affiliate', {
            processingId,
            clientId: client.id,
            affiliateId: result.affiliate.id,
            error: error.message
          });
          result.errors.push(`Failed to assign client to affiliate: ${error.message}`);
        }
      }

      // Step 4: Create orders for each item
      for (const item of orderData.items) {
        try {
          logger.info('Creating order for item', {
            processingId,
            clientId: client.id,
            productId: item.productId,
            productName: item.name
          });

          const order = await this.hostbillClient.createOrder({
            clientId: client.id,
            productId: item.productId,
            cycle: item.cycle || 'm',
            paymentMethod: orderData.paymentMethod || 'banktransfer',
            affiliateId: result.affiliate?.id,
            configOptions: item.configOptions,
            total: item.price
          });

          result.orders.push({
            ...order,
            productName: item.name,
            productId: item.productId,
            price: item.price
          });

          logger.info('Order created successfully', {
            processingId,
            orderId: order.orderId,
            invoiceId: order.invoiceId,
            productName: item.name
          });

        } catch (error) {
          logger.error('Failed to create order for item', {
            processingId,
            productId: item.productId,
            productName: item.name,
            error: error.message
          });
          
          result.errors.push(`Failed to create order for ${item.name}: ${error.message}`);
        }
      }

      // Step 5: Log final result
      const successfulOrders = result.orders.length;
      const totalItems = orderData.items.length;

      logger.info('Order processing completed', {
        processingId,
        clientId: client.id,
        successfulOrders,
        totalItems,
        errorCount: result.errors.length,
        affiliateAssigned: !!result.affiliate
      });

      if (successfulOrders === 0) {
        throw new Error('No orders were created successfully');
      }

      return result;

    } catch (error) {
      logger.error('Order processing failed', {
        processingId,
        error: error.message,
        stack: error.stack
      });

      result.errors.push(`Processing failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate order confirmation page HTML
   * @param {Object} orderDetails - Order details from HostBill
   * @param {string} orderId - Order ID from URL parameter
   * @returns {Promise<string>} HTML content
   */
  async generateConfirmationPage(orderDetails, orderId = null) {
    const html = `
    <!DOCTYPE html>
    <html lang="cs">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Potvrzení objednávky - Systrix Cloud VPS</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
            }
            
            .container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            
            .header {
                background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }
            
            .header h1 {
                font-size: 2.5rem;
                margin-bottom: 10px;
                font-weight: 700;
            }
            
            .header p {
                font-size: 1.1rem;
                opacity: 0.9;
            }
            
            .success-icon {
                font-size: 4rem;
                margin-bottom: 20px;
                display: block;
            }
            
            .content {
                padding: 40px 30px;
            }
            
            .order-info {
                background: #f8fafc;
                border-radius: 8px;
                padding: 25px;
                margin-bottom: 30px;
                border-left: 4px solid #10b981;
            }
            
            .order-info h2 {
                color: #1f2937;
                margin-bottom: 15px;
                font-size: 1.3rem;
            }
            
            .info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
            }
            
            .info-item {
                display: flex;
                flex-direction: column;
            }
            
            .info-label {
                font-weight: 600;
                color: #6b7280;
                font-size: 0.9rem;
                margin-bottom: 5px;
            }
            
            .info-value {
                color: #1f2937;
                font-size: 1rem;
            }
            
            .next-steps {
                background: #fef3c7;
                border-radius: 8px;
                padding: 25px;
                margin-bottom: 30px;
                border-left: 4px solid #f59e0b;
            }
            
            .next-steps h3 {
                color: #92400e;
                margin-bottom: 15px;
                font-size: 1.2rem;
            }
            
            .next-steps ul {
                list-style: none;
                padding-left: 0;
            }
            
            .next-steps li {
                margin-bottom: 10px;
                padding-left: 25px;
                position: relative;
            }
            
            .next-steps li:before {
                content: "✓";
                position: absolute;
                left: 0;
                color: #059669;
                font-weight: bold;
            }
            
            .contact-info {
                background: #e0f2fe;
                border-radius: 8px;
                padding: 25px;
                border-left: 4px solid #0284c7;
            }
            
            .contact-info h3 {
                color: #0c4a6e;
                margin-bottom: 15px;
                font-size: 1.2rem;
            }
            
            .contact-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
            }
            
            .contact-item {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .contact-icon {
                font-size: 1.2rem;
                color: #0284c7;
            }
            
            .footer {
                background: #f8fafc;
                padding: 20px 30px;
                text-align: center;
                color: #6b7280;
                font-size: 0.9rem;
            }
            
            @media (max-width: 768px) {
                .container {
                    margin: 10px;
                    border-radius: 8px;
                }
                
                .header {
                    padding: 30px 20px;
                }
                
                .header h1 {
                    font-size: 2rem;
                }
                
                .content {
                    padding: 30px 20px;
                }
                
                .info-grid {
                    grid-template-columns: 1fr;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <span class="success-icon">🎉</span>
                <h1>Objednávka přijata!</h1>
                <p>Děkujeme za vaši objednávku. Brzy se vám ozveme.</p>
            </div>
            
            <div class="content">
                <div class="order-info">
                    <h2>📋 Informace o objednávce</h2>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Číslo objednávky</span>
                            <span class="info-value">${orderDetails?.number || orderId || orderDetails?.id || orderDetails?.order_id || 'Generuje se...'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Datum vytvoření</span>
                            <span class="info-value">${new Date().toLocaleDateString('cs-CZ')}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Stav objednávky</span>
                            <span class="info-value">Zpracovává se</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Platební metoda</span>
                            <span class="info-value">Bankovní převod</span>
                        </div>
                    </div>
                </div>
                
                <div class="next-steps">
                    <h3>📝 Další kroky</h3>
                    <ul>
                        <li>Obdržíte e-mail s potvrzením objednávky a platebními údaji</li>
                        <li>Po přijetí platby začneme s nastavením vašeho VPS</li>
                        <li>Přístupové údaje vám zašleme do 24 hodin</li>
                        <li>Náš tým vás bude informovat o průběhu zpracování</li>
                    </ul>
                </div>
                
                <div class="contact-info">
                    <h3>📞 Kontaktní informace</h3>
                    <div class="contact-grid">
                        <div class="contact-item">
                            <span class="contact-icon">📧</span>
                            <span>podpora@systrix.cz</span>
                        </div>
                        <div class="contact-item">
                            <span class="contact-icon">📱</span>
                            <span>+420 123 456 789</span>
                        </div>
                        <div class="contact-item">
                            <span class="contact-icon">🌐</span>
                            <span>www.systrix.cz</span>
                        </div>
                        <div class="contact-item">
                            <span class="contact-icon">⏰</span>
                            <span>Po-Pá: 9:00-17:00</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="footer">
                <p>&copy; 2024 Systrix Cloud VPS. Všechna práva vyhrazena.</p>
                <p>Tato stránka byla vygenerována automaticky systémem HostBill Order Middleware.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    return html;
  }

  /**
   * Validate order data
   * @param {Object} orderData - Order data to validate
   * @returns {Array} Array of validation errors
   */
  validateOrderData(orderData) {
    const errors = [];

    // Validate customer data
    if (!orderData.customer) {
      errors.push('Customer data is required');
    } else {
      const required = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'postalCode', 'country'];
      required.forEach(field => {
        if (!orderData.customer[field]) {
          errors.push(`Customer ${field} is required`);
        }
      });

      // Validate email format
      if (orderData.customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orderData.customer.email)) {
        errors.push('Invalid email format');
      }
    }

    // Validate items
    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      errors.push('At least one item is required');
    } else {
      orderData.items.forEach((item, index) => {
        if (!item.productId) {
          errors.push(`Item ${index + 1}: Product ID is required`);
        }
        if (!item.name) {
          errors.push(`Item ${index + 1}: Product name is required`);
        }
        if (!item.price || isNaN(item.price)) {
          errors.push(`Item ${index + 1}: Valid price is required`);
        }
      });
    }

    return errors;
  }
}

module.exports = OrderProcessor;
