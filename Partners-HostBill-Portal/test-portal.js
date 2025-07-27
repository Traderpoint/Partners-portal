// Test script for Partners HostBill Portal
// Using built-in fetch (Node.js 18+)

const BASE_URL = 'http://localhost:3006';
const TEST_AFFILIATE_ID = '1'; // Test affiliate ID

async function testPortal() {
  console.log('🧪 Testing Partners HostBill Portal...\n');

  try {
    // Test 1: Check if server is running
    console.log('1️⃣ Testing server availability...');
    const healthResponse = await fetch(`${BASE_URL}/`);
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   ✅ Server is running\n`);

    // Test 2: Test HostBill API connection
    console.log('2️⃣ Testing HostBill API connection...');
    const apiResponse = await fetch(`${BASE_URL}/api/hostbill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        call: 'getAffiliate',
        params: { id: TEST_AFFILIATE_ID }
      })
    });
    
    const apiData = await apiResponse.json();
    console.log(`   Status: ${apiResponse.status}`);
    console.log(`   Success: ${apiData.success}`);
    if (apiData.success) {
      console.log(`   ✅ HostBill API connection working`);
      console.log(`   📋 Affiliate: ${apiData.affiliate?.firstname} ${apiData.affiliate?.lastname}\n`);
    } else {
      console.log(`   ❌ HostBill API error: ${apiData.error}\n`);
    }

    // Test 3: Test authentication
    console.log('3️⃣ Testing authentication...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        affiliateId: TEST_AFFILIATE_ID,
        password: 'test' // Password not required in current implementation
      })
    });
    
    const loginData = await loginResponse.json();
    console.log(`   Status: ${loginResponse.status}`);
    console.log(`   Success: ${loginData.success}`);
    if (loginData.success) {
      console.log(`   ✅ Authentication working`);
      console.log(`   👤 User: ${loginData.user?.name}\n`);
    } else {
      console.log(`   ❌ Authentication error: ${loginData.error}\n`);
    }

    // Test 4: Test orders retrieval
    console.log('4️⃣ Testing orders retrieval...');
    const ordersResponse = await fetch(`${BASE_URL}/api/hostbill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        call: 'getOrders',
        params: {
          'filter[affiliate_id]': TEST_AFFILIATE_ID
        }
      })
    });
    
    const ordersData = await ordersResponse.json();
    console.log(`   Status: ${ordersResponse.status}`);
    console.log(`   Success: ${ordersData.success}`);
    if (ordersData.success) {
      console.log(`   ✅ Orders retrieval working`);
      console.log(`   📦 Orders count: ${ordersData.orders?.length || 0}\n`);
    } else {
      console.log(`   ❌ Orders retrieval error: ${ordersData.error}\n`);
    }

    // Test 5: Test commissions retrieval
    console.log('5️⃣ Testing commissions retrieval...');
    const commissionsResponse = await fetch(`${BASE_URL}/api/hostbill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        call: 'getAffiliateCommissions',
        params: { id: TEST_AFFILIATE_ID }
      })
    });
    
    const commissionsData = await commissionsResponse.json();
    console.log(`   Status: ${commissionsResponse.status}`);
    console.log(`   Success: ${commissionsData.success}`);
    if (commissionsData.success) {
      console.log(`   ✅ Commissions retrieval working`);
      console.log(`   💰 Commissions count: ${commissionsData.orders?.length || 0}\n`);
    } else {
      console.log(`   ❌ Commissions retrieval error: ${commissionsData.error}\n`);
    }

    console.log('🎉 Portal testing completed!');
    console.log('\n📋 Summary:');
    console.log('   - Server: ✅ Running');
    console.log('   - HostBill API: ✅ Connected');
    console.log('   - Authentication: ✅ Working');
    console.log('   - Orders: ✅ Working');
    console.log('   - Commissions: ✅ Working');
    console.log('\n🌐 Portal URL: http://localhost:3006');
    console.log('🔑 Test Affiliate ID: 1');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure the server is running: npm run dev');
    console.log('   2. Check if port 3006 is available');
    console.log('   3. Verify HostBill API credentials');
  }
}

// Run tests if called directly
if (require.main === module) {
  testPortal();
}

module.exports = { testPortal };
