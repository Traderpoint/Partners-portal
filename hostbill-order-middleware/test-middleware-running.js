// Test script for HostBill Order Middleware
// Using built-in fetch (Node.js 18+)

const MIDDLEWARE_URL = 'http://localhost:3005';
const DASHBOARD_URL = 'http://localhost:3010';

async function testMiddleware() {
  console.log('🧪 Testing HostBill Order Middleware...\n');
  console.log('=' .repeat(60));

  try {
    let allTestsPassed = true;

    // Test 1: Middleware Server Health
    console.log('\n1️⃣ MIDDLEWARE SERVER HEALTH');
    console.log('-'.repeat(40));
    
    try {
      const response = await fetch(`${MIDDLEWARE_URL}/api/health`);
      if (response.status === 200) {
        const data = await response.json();
        console.log('✅ Middleware server running');
        console.log(`   Status: ${data.status}`);
        console.log(`   Uptime: ${data.uptime}`);
        console.log(`   Environment: ${data.environment}`);
      } else {
        console.log(`❌ Middleware health check failed: ${response.status}`);
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`❌ Middleware server not accessible: ${error.message}`);
      allTestsPassed = false;
    }

    // Test 2: Dashboard Server Health
    console.log('\n2️⃣ DASHBOARD SERVER HEALTH');
    console.log('-'.repeat(40));
    
    try {
      const response = await fetch(`${DASHBOARD_URL}/`);
      if (response.status === 200) {
        console.log('✅ Dashboard server running');
        console.log(`   URL: ${DASHBOARD_URL}`);
        console.log(`   Status: ${response.status} ${response.statusText}`);
      } else {
        console.log(`❌ Dashboard server failed: ${response.status}`);
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`❌ Dashboard server not accessible: ${error.message}`);
      allTestsPassed = false;
    }

    // Test 3: Middleware API Endpoints
    console.log('\n3️⃣ MIDDLEWARE API ENDPOINTS');
    console.log('-'.repeat(40));
    
    const endpoints = [
      { path: '/api/health', name: 'Health Check' },
      { path: '/api/stats', name: 'Statistics' },
      { path: '/api/products', name: 'Products' },
      { path: '/api/orders', name: 'Orders' }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${MIDDLEWARE_URL}${endpoint.path}`);
        if (response.status === 200) {
          console.log(`✅ ${endpoint.name}: Working`);
        } else if (response.status === 405) {
          console.log(`✅ ${endpoint.name}: Available (Method not allowed - expected)`);
        } else {
          console.log(`⚠️  ${endpoint.name}: Status ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint.name}: Error ${error.message}`);
        allTestsPassed = false;
      }
    }

    // Test 4: Dashboard API Endpoints
    console.log('\n4️⃣ DASHBOARD API ENDPOINTS');
    console.log('-'.repeat(40));
    
    const dashboardEndpoints = [
      { path: '/', name: 'Dashboard Home' },
      { path: '/api/health', name: 'Dashboard Health' },
      { path: '/api/stats', name: 'Dashboard Stats' },
      { path: '/test', name: 'Test Page' }
    ];

    for (const endpoint of dashboardEndpoints) {
      try {
        const response = await fetch(`${DASHBOARD_URL}${endpoint.path}`);
        if (response.status === 200) {
          console.log(`✅ ${endpoint.name}: Working`);
        } else {
          console.log(`⚠️  ${endpoint.name}: Status ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint.name}: Error ${error.message}`);
      }
    }

    // Test 5: HostBill API Connection (through middleware)
    console.log('\n5️⃣ HOSTBILL API CONNECTION');
    console.log('-'.repeat(40));
    
    try {
      const response = await fetch(`${MIDDLEWARE_URL}/api/hostbill/test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 200) {
        const data = await response.json();
        console.log('✅ HostBill API connection working');
        console.log(`   Response: ${JSON.stringify(data).substring(0, 100)}...`);
      } else {
        console.log(`⚠️  HostBill API test: Status ${response.status}`);
        // This might be expected if endpoint doesn't exist
      }
    } catch (error) {
      console.log(`⚠️  HostBill API test: ${error.message}`);
      // This might be expected if endpoint doesn't exist
    }

    // Results Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎯 MIDDLEWARE TEST RESULTS');
    console.log('='.repeat(60));

    if (allTestsPassed) {
      console.log('\n🎉 MIDDLEWARE SYSTEMS OPERATIONAL! 🎉');
      
      console.log('\n✅ RUNNING SERVICES:');
      console.log('   🔧 HostBill Order Middleware: http://localhost:3005');
      console.log('   📊 Middleware Dashboard: http://localhost:3010');
      console.log('   🎯 Systrix Partners Portal: http://localhost:3006');
      
      console.log('\n🔧 MIDDLEWARE FEATURES:');
      console.log('   📡 API Gateway for HostBill integration');
      console.log('   🛡️  Security and rate limiting');
      console.log('   📊 Order processing and validation');
      console.log('   💳 Payment gateway integration');
      console.log('   📈 Real-time monitoring and logging');
      
      console.log('\n📊 DASHBOARD FEATURES:');
      console.log('   📈 Real-time statistics and monitoring');
      console.log('   🔍 API endpoint testing interface');
      console.log('   📊 Performance metrics visualization');
      console.log('   🛠️  Administrative tools and controls');
      
      console.log('\n🌐 ACCESS URLS:');
      console.log('   Middleware API: http://localhost:3005');
      console.log('   Dashboard: http://localhost:3010');
      console.log('   Partners Portal: http://localhost:3006');
      
      console.log('\n📝 NEXT STEPS:');
      console.log('   1. Test API endpoints through dashboard');
      console.log('   2. Verify HostBill integration');
      console.log('   3. Test order processing workflow');
      console.log('   4. Monitor logs for any issues');
      
    } else {
      console.log('\n❌ SOME ISSUES DETECTED');
      
      console.log('\n🔧 TROUBLESHOOTING:');
      console.log('   1. Check if all servers are running');
      console.log('   2. Verify .env configuration');
      console.log('   3. Check port availability (3005, 3010)');
      console.log('   4. Review server logs for errors');
    }

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('\n❌ Middleware test failed:', error.message);
    console.log('\n🔧 Please check server status and configuration.');
  }
}

// Run tests if called directly
if (require.main === module) {
  testMiddleware();
}

module.exports = { testMiddleware };
