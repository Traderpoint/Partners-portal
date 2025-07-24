// HostBill Products API s affiliate support
import https from 'https';
import { URL } from 'url';

const HOSTBILL_CONFIG = {
  apiUrl: process.env.HOSTBILL_API_URL || 'https://vps.kabel1it.cz/admin/api.php',
  apiId: process.env.HOSTBILL_API_ID || 'adcdebb0e3b6f583052d',
  apiKey: process.env.HOSTBILL_API_KEY || '341697c41aeb1c842f0d'
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { affiliate_id } = req.query;

  console.log('🛍️ Getting products for affiliate:', affiliate_id);

  try {
    // Get product details from HostBill
    // Note: HostBill may not have a direct getProducts call, 
    // so we'll use getProductDetails for known product IDs
    
    const productIds = ['1', '2', '3', '4', '5']; // Common VPS product IDs
    const products = [];

    for (const productId of productIds) {
      try {
        const apiPayload = {
          call: 'getProductDetails',
          api_id: HOSTBILL_CONFIG.apiId,
          api_key: HOSTBILL_CONFIG.apiKey,
          id: productId
        };

        const postData = new URLSearchParams(apiPayload).toString();
        const apiUrl = new URL(HOSTBILL_CONFIG.apiUrl);

        const apiResponse = await new Promise((resolve, reject) => {
          const options = {
            hostname: apiUrl.hostname,
            port: apiUrl.port || 443,
            path: apiUrl.pathname,
            method: 'POST',
            rejectUnauthorized: false,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Content-Length': Buffer.byteLength(postData)
            }
          };

          const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
              data += chunk;
            });
            res.on('end', () => {
              resolve({
                statusCode: res.statusCode,
                body: data
              });
            });
          });

          req.on('error', (error) => {
            reject(error);
          });

          req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
          });

          req.write(postData);
          req.end();
        });

        // Parse product response
        try {
          const responseData = JSON.parse(apiResponse.body);
          if (responseData.success === true && responseData.product) {
            const product = responseData.product;
            
            // Add affiliate-specific information
            const affiliateProduct = {
              id: product.id,
              name: product.name,
              description: product.description,
              pricing: product.pricing,
              status: product.status,
              affiliate_info: {
                commission_rate: getCommissionRate(productId, affiliate_id),
                special_pricing: getSpecialPricing(productId, affiliate_id),
                affiliate_url: `https://vps.kabel1it.cz/?affid=${affiliate_id}&product=${productId}`
              }
            };
            
            products.push(affiliateProduct);
            console.log('✅ Product loaded:', product.name);
          }
        } catch (parseError) {
          console.log(`⚠️ Product ${productId} parse error:`, parseError.message);
        }

      } catch (productError) {
        console.log(`❌ Product ${productId} API error:`, productError.message);
      }
    }

    // If no products from API, return default VPS products
    if (products.length === 0) {
      const defaultProducts = getDefaultVPSProducts(affiliate_id);
      products.push(...defaultProducts);
    }

    const result = {
      success: true,
      affiliate_id: affiliate_id,
      products: products,
      total_products: products.length,
      timestamp: new Date().toISOString()
    };

    console.log('🛍️ Products response:', {
      affiliate: affiliate_id,
      count: products.length
    });

    res.status(200).json(result);

  } catch (error) {
    console.log('❌ Products API error:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message,
      affiliate_id: affiliate_id
    });
  }
}

// Helper function to get commission rate for affiliate
function getCommissionRate(productId, affiliateId) {
  // This would typically come from HostBill affiliate commission plans
  const commissionRates = {
    '5': { '1': '10%', '2': '12%' }, // Product 5: Affiliate 1 gets 10%, Affiliate 2 gets 12%
    '10': { '1': '15%', '2': '18%' }, // Product 10: Higher commissions
    '3': { '1': '8%', '2': '10%' },
    '4': { '1': '12%', '2': '15%' },
    '1': { '1': '20%', '2': '25%' }  // Premium product
  };

  return commissionRates[productId]?.[affiliateId] || '5%'; // Default 5%
}

// Helper function to get special pricing for affiliate
function getSpecialPricing(productId, affiliateId) {
  // Special pricing or discounts for specific affiliates
  const specialPricing = {
    '1': { '1': '10% discount', '2': '15% discount' },
    '2': { '1': '5% discount', '2': '8% discount' }
  };

  return specialPricing[productId]?.[affiliateId] || null;
}

// Default VPS products when API is not available
function getDefaultVPSProducts(affiliateId) {
  return [
    {
      id: '1',
      name: 'VPS Basic',
      description: 'Základní VPS server pro začátečníky',
      pricing: {
        monthly: '299 CZK',
        quarterly: '850 CZK',
        annually: '3200 CZK'
      },
      specs: {
        cpu: '1 vCPU',
        ram: '1 GB RAM',
        storage: '20 GB SSD',
        bandwidth: '1 TB'
      },
      status: 'active',
      affiliate_info: {
        commission_rate: getCommissionRate('1', affiliateId),
        special_pricing: getSpecialPricing('1', affiliateId),
        affiliate_url: `https://vps.kabel1it.cz/?affid=${affiliateId}&product=1`
      }
    },
    {
      id: '2',
      name: 'VPS Pro',
      description: 'Profesionální VPS pro náročnější aplikace',
      pricing: {
        monthly: '599 CZK',
        quarterly: '1700 CZK',
        annually: '6400 CZK'
      },
      specs: {
        cpu: '2 vCPU',
        ram: '4 GB RAM',
        storage: '80 GB SSD',
        bandwidth: '2 TB'
      },
      status: 'active',
      affiliate_info: {
        commission_rate: getCommissionRate('2', affiliateId),
        special_pricing: getSpecialPricing('2', affiliateId),
        affiliate_url: `https://vps.kabel1it.cz/?affid=${affiliateId}&product=2`
      }
    },
    {
      id: '3',
      name: 'VPS Enterprise',
      description: 'Výkonný VPS pro enterprise aplikace',
      pricing: {
        monthly: '1299 CZK',
        quarterly: '3700 CZK',
        annually: '14000 CZK'
      },
      specs: {
        cpu: '4 vCPU',
        ram: '8 GB RAM',
        storage: '160 GB SSD',
        bandwidth: '5 TB'
      },
      status: 'active',
      affiliate_info: {
        commission_rate: getCommissionRate('3', affiliateId),
        special_pricing: getSpecialPricing('3', affiliateId),
        affiliate_url: `https://vps.kabel1it.cz/?affid=${affiliateId}&product=3`
      }
    }
  ];
}
