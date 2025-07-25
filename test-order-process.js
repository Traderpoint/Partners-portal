/**
 * Test script for the complete order process with affiliate tracking
 */

require('dotenv').config({ path: '.env.local' });
const HostBillOrderService = require('./lib/hostbill-order');

async function testOrderProcess() {
  try {
    console.log('🧪 Testing complete order process with affiliate tracking...');
    console.log('Domain:', process.env.HOSTBILL_DOMAIN);
    console.log('API ID:', process.env.HOSTBILL_API_ID ? 'Set' : 'Not set');
    console.log('API Key:', process.env.HOSTBILL_API_KEY ? 'Set' : 'Not set');
    
    const orderService = new HostBillOrderService();
    
    // Test data
    const testOrderData = {
      customer: {
        firstName: 'Jan',
        lastName: 'Testovací',
        email: 'jan.testovaci@example.com',
        phone: '+420123456789',
        company: 'Test s.r.o.',
        address: 'Testovací 123',
        city: 'Praha',
        postalCode: '11000',
        country: 'CZ'
      },
      items: [
        {
          productId: '5', // VPS Basic
          name: 'VPS Basic',
          cycle: 'm',
          configOptions: {},
          addons: []
        }
      ],
      affiliate: {
        code: '1' // Test with affiliate ID 1
      },
      paymentMethod: 'card',
      newsletterSubscribe: false
    };
    
    console.log('\n' + '='.repeat(60));
    console.log('🚀 STARTING ORDER PROCESS');
    console.log('='.repeat(60));
    
    // Step 1: Validate affiliate
    console.log('\n📋 Step 1: Validating affiliate...');
    const affiliate = await orderService.validateAffiliateCode(testOrderData.affiliate.code);
    if (affiliate) {
      console.log(`✅ Affiliate validated: ${affiliate.name} (ID: ${affiliate.id})`);
    } else {
      console.log(`❌ Affiliate validation failed for code: ${testOrderData.affiliate.code}`);
    }
    
    // Step 2: Test complete order process
    console.log('\n📋 Step 2: Processing complete order...');
    const result = await orderService.processCompleteOrder(testOrderData);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 ORDER PROCESS RESULTS');
    console.log('='.repeat(60));
    
    console.log(`Success: ${result.success}`);
    
    if (result.client) {
      console.log(`\n👤 Client:`);
      console.log(`   ID: ${result.client.id}`);
      console.log(`   Name: ${result.client.firstname} ${result.client.lastname}`);
      console.log(`   Email: ${result.client.email}`);
      console.log(`   Affiliate ID: ${result.client.affiliate_id || 'None'}`);
    }
    
    if (result.affiliate) {
      console.log(`\n🤝 Affiliate:`);
      console.log(`   ID: ${result.affiliate.id}`);
      console.log(`   Name: ${result.affiliate.name}`);
      console.log(`   Status: ${result.affiliate.status}`);
    }
    
    if (result.orders && result.orders.length > 0) {
      console.log(`\n📦 Orders (${result.orders.length}):`);
      result.orders.forEach((order, index) => {
        console.log(`   ${index + 1}. ${order.productName}`);
        console.log(`      Order ID: ${order.orderId}`);
        console.log(`      Invoice ID: ${order.invoiceId || 'N/A'}`);
        console.log(`      Product ID: ${order.productId}`);
      });
    }
    
    if (result.errors && result.errors.length > 0) {
      console.log(`\n❌ Errors (${result.errors.length}):`);
      result.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST COMPLETED');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testOrderProcess();
