/**
 * Test script for VPS page affiliate tracking
 */

require('dotenv').config({ path: '.env.local' });
const HostBillOrderService = require('./lib/hostbill-order');

async function testVPSAffiliateFlow() {
  try {
    console.log('🧪 Testing VPS page affiliate flow...');
    console.log('Domain:', process.env.HOSTBILL_DOMAIN);
    
    const orderService = new HostBillOrderService();
    
    console.log('\n' + '='.repeat(60));
    console.log('🌐 VPS AFFILIATE FLOW TEST');
    console.log('='.repeat(60));
    
    // Test scenarios
    const testScenarios = [
      {
        name: 'Valid Affiliate ID',
        affiliateCode: '1',
        expected: 'success'
      },
      {
        name: 'Valid Affiliate ID (2)',
        affiliateCode: '2',
        expected: 'success'
      },
      {
        name: 'Invalid Affiliate ID',
        affiliateCode: '999',
        expected: 'fail'
      },
      {
        name: 'Non-numeric Affiliate Code',
        affiliateCode: 'INVALID',
        expected: 'fail'
      }
    ];
    
    for (const scenario of testScenarios) {
      console.log(`\n📋 Testing: ${scenario.name}`);
      console.log(`   Code: ${scenario.affiliateCode}`);
      
      try {
        const affiliate = await orderService.validateAffiliateCode(scenario.affiliateCode);
        
        if (affiliate) {
          console.log(`   ✅ Result: SUCCESS`);
          console.log(`   📊 Affiliate: ${affiliate.name} (ID: ${affiliate.id})`);
          console.log(`   📊 Status: ${affiliate.status}`);
          
          if (scenario.expected === 'fail') {
            console.log(`   ⚠️  WARNING: Expected failure but got success`);
          }
        } else {
          console.log(`   ❌ Result: FAILED - Affiliate not found`);
          
          if (scenario.expected === 'success') {
            console.log(`   ⚠️  WARNING: Expected success but got failure`);
          }
        }
      } catch (error) {
        console.log(`   ❌ Result: ERROR - ${error.message}`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🛒 VPS PRODUCT ORDER SIMULATION');
    console.log('='.repeat(60));
    
    // Simulate VPS order with affiliate
    const vpsOrderData = {
      customer: {
        firstName: 'VPS',
        lastName: 'Zákazník',
        email: 'vps.zakaznik@example.com',
        phone: '+420987654321',
        company: 'VPS Test s.r.o.',
        address: 'VPS Testovací 456',
        city: 'Brno',
        postalCode: '60200',
        country: 'CZ'
      },
      items: [
        {
          productId: '2', // VPS Profi
          name: 'VPS Profi',
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
    
    console.log('\n📦 Processing VPS order with affiliate...');
    const orderResult = await orderService.processCompleteOrder(vpsOrderData);
    
    console.log('\n📊 VPS ORDER RESULTS:');
    console.log(`Success: ${orderResult.success}`);
    
    if (orderResult.client) {
      console.log(`\n👤 Client:`);
      console.log(`   ID: ${orderResult.client.id}`);
      console.log(`   Name: ${orderResult.client.firstname} ${orderResult.client.lastname}`);
      console.log(`   Email: ${orderResult.client.email}`);
    }
    
    if (orderResult.affiliate) {
      console.log(`\n🤝 Affiliate:`);
      console.log(`   ID: ${orderResult.affiliate.id}`);
      console.log(`   Name: ${orderResult.affiliate.name}`);
    }
    
    if (orderResult.orders && orderResult.orders.length > 0) {
      console.log(`\n📦 Orders:`);
      orderResult.orders.forEach((order, index) => {
        console.log(`   ${index + 1}. ${order.productName} (Order ID: ${order.orderId})`);
      });
    }
    
    if (orderResult.errors && orderResult.errors.length > 0) {
      console.log(`\n❌ Errors:`);
      orderResult.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 URL SIMULATION TEST');
    console.log('='.repeat(60));
    
    // Test different URL patterns
    const urlPatterns = [
      'http://localhost:3000/vps?aff=1',
      'http://localhost:3000/vps?affiliate=1',
      'http://localhost:3000/vps?ref=1',
      'http://localhost:3000/vps?aff=1&utm_source=partner&utm_campaign=vps',
      'http://localhost:3000/vps?aff=2&product=vps-profi'
    ];
    
    console.log('\n📋 Testing URL patterns:');
    urlPatterns.forEach((url, index) => {
      console.log(`   ${index + 1}. ${url}`);
      
      // Extract affiliate params (simulate frontend logic)
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      const affiliateId = urlParams.get('aff') || urlParams.get('affiliate') || urlParams.get('ref');
      
      if (affiliateId) {
        console.log(`      → Extracted affiliate ID: ${affiliateId} ✅`);
      } else {
        console.log(`      → No affiliate ID found ❌`);
      }
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ VPS AFFILIATE FLOW TEST COMPLETED');
    console.log('='.repeat(60));
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Visit: http://localhost:3000/vps?aff=1');
    console.log('2. Check affiliate banner appears');
    console.log('3. Add VPS to cart');
    console.log('4. Complete checkout process');
    console.log('5. Verify affiliate assignment in HostBill');
    
  } catch (error) {
    console.error('❌ VPS affiliate flow test failed:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testVPSAffiliateFlow();
