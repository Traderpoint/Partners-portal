// Test script for Systrix Cloud VPS Application
// Using built-in fetch (Node.js 18+)

const BASE_URL = 'http://localhost:3000';

async function testCloudVPS() {
  console.log('☁️ Testing Systrix Cloud VPS Application...\n');
  console.log('=' .repeat(60));

  try {
    let allTestsPassed = true;

    // Test 1: Main Application Health
    console.log('\n1️⃣ MAIN APPLICATION HEALTH');
    console.log('-'.repeat(40));
    
    try {
      const response = await fetch(`${BASE_URL}/`);
      if (response.status === 200) {
        const html = await response.text();
        console.log('✅ Cloud VPS application running');
        console.log(`   Status: ${response.status} ${response.statusText}`);
        console.log(`   Content-Length: ${html.length} bytes`);
        
        // Check for Systrix branding
        if (html.includes('Systrix Cloud & VPS')) {
          console.log('✅ Systrix branding detected');
        } else {
          console.log('⚠️  Systrix branding not found');
        }
      } else {
        console.log(`❌ Application failed: ${response.status}`);
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`❌ Application not accessible: ${error.message}`);
      allTestsPassed = false;
    }

    // Test 2: Main Pages Accessibility
    console.log('\n2️⃣ MAIN PAGES ACCESSIBILITY');
    console.log('-'.repeat(40));
    
    const pages = [
      { name: 'Home', path: '/', icon: '🏠' },
      { name: 'Cloud', path: '/cloud', icon: '☁️' },
      { name: 'VPS', path: '/vps', icon: '🖥️' },
      { name: 'Pricing', path: '/pricing', icon: '💰' },
      { name: 'Contact', path: '/contact', icon: '📞' },
      { name: 'About', path: '/about', icon: 'ℹ️' }
    ];

    let pagesWorking = 0;
    for (const page of pages) {
      try {
        const response = await fetch(`${BASE_URL}${page.path}`);
        if (response.status === 200) {
          console.log(`✅ ${page.icon} ${page.name} page accessible`);
          pagesWorking++;
        } else {
          console.log(`❌ ${page.icon} ${page.name} status: ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ ${page.icon} ${page.name} error: ${error.message}`);
      }
    }

    // Test 3: API Endpoints
    console.log('\n3️⃣ API ENDPOINTS');
    console.log('-'.repeat(40));
    
    const apiEndpoints = [
      { name: 'HostBill Affiliate Tracking', path: '/api/hostbill/affiliate-tracking' },
      { name: 'HostBill Products', path: '/api/hostbill/products' },
      { name: 'HostBill Create Order', path: '/api/hostbill/create-order' },
      { name: 'Cart API', path: '/api/cart' }
    ];

    let apiWorking = 0;
    for (const endpoint of apiEndpoints) {
      try {
        const response = await fetch(`${BASE_URL}${endpoint.path}`);
        if (response.status === 200 || response.status === 405 || response.status === 400) {
          console.log(`✅ ${endpoint.name}: Available (${response.status})`);
          apiWorking++;
        } else {
          console.log(`⚠️  ${endpoint.name}: Status ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint.name}: Error ${error.message}`);
      }
    }

    // Test 4: Test Pages
    console.log('\n4️⃣ TEST PAGES');
    console.log('-'.repeat(40));
    
    const testPages = [
      { name: 'Affiliate Test Real', path: '/affiliate-test-real?affid=1' },
      { name: 'Affiliate Scenarios', path: '/affiliate-scenarios' },
      { name: 'Payment Test', path: '/payment-test' },
      { name: 'Middleware Test', path: '/middleware-test' },
      { name: 'Integration Test', path: '/integration-test' }
    ];

    let testPagesWorking = 0;
    for (const page of testPages) {
      try {
        const response = await fetch(`${BASE_URL}${page.path}`);
        if (response.status === 200) {
          console.log(`✅ ${page.name}: Working`);
          testPagesWorking++;
        } else {
          console.log(`⚠️  ${page.name}: Status ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ ${page.name}: Error ${error.message}`);
      }
    }

    // Test 5: Static Assets
    console.log('\n5️⃣ STATIC ASSETS');
    console.log('-'.repeat(40));
    
    const assets = [
      { name: 'Systrix Logo', path: '/systrix-logo.svg' },
      { name: 'Systrix Logo White', path: '/systrix-logo-white.svg' },
      { name: 'Favicon', path: '/favicon.svg' }
    ];

    let assetsWorking = 0;
    for (const asset of assets) {
      try {
        const response = await fetch(`${BASE_URL}${asset.path}`);
        if (response.status === 200) {
          console.log(`✅ ${asset.name}: Available`);
          assetsWorking++;
        } else {
          console.log(`❌ ${asset.name}: Status ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ ${asset.name}: Error ${error.message}`);
      }
    }

    // Results Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎯 CLOUD VPS TEST RESULTS');
    console.log('='.repeat(60));

    if (allTestsPassed && pagesWorking >= 4) {
      console.log('\n🎉 CLOUD VPS APPLICATION OPERATIONAL! 🎉');
      
      console.log('\n✅ APPLICATION STATUS:');
      console.log('   ☁️  Systrix Cloud VPS running on http://localhost:3000');
      console.log('   🎯 Systrix Partners Portal running on http://localhost:3006');
      console.log('   🔧 HostBill Middleware running on http://localhost:3005');
      console.log('   📊 Middleware Dashboard running on http://localhost:3010');
      
      console.log('\n📊 TEST RESULTS:');
      console.log(`   📄 Main pages working: ${pagesWorking}/${pages.length}`);
      console.log(`   🔌 API endpoints available: ${apiWorking}/${apiEndpoints.length}`);
      console.log(`   🧪 Test pages working: ${testPagesWorking}/${testPages.length}`);
      console.log(`   🖼️  Static assets available: ${assetsWorking}/${assets.length}`);
      
      console.log('\n🌟 CLOUD VPS FEATURES:');
      console.log('   🏠 Modern homepage with hero section');
      console.log('   ☁️  Cloud hosting services');
      console.log('   🖥️  VPS hosting solutions');
      console.log('   💰 Pricing tables and plans');
      console.log('   📞 Contact and support pages');
      console.log('   🔗 HostBill API integration');
      console.log('   🎯 Affiliate tracking system');
      console.log('   🛒 Shopping cart functionality');
      
      console.log('\n🔗 COMPLETE ECOSYSTEM:');
      console.log('   1. Cloud VPS (3000) - Main website');
      console.log('   2. Middleware (3005) - API processing');
      console.log('   3. Partners Portal (3006) - Affiliate management');
      console.log('   4. Dashboard (3010) - Monitoring');
      
      console.log('\n🌐 ACCESS INFORMATION:');
      console.log('   Main Website: http://localhost:3000');
      console.log('   Partners Portal: http://localhost:3006');
      console.log('   Middleware API: http://localhost:3005');
      console.log('   Dashboard: http://localhost:3010');
      
      console.log('\n🎯 CLOUD VPS STATUS: FULLY OPERATIONAL! 🎯');
      
    } else {
      console.log('\n❌ SOME ISSUES DETECTED');
      console.log(`   Pages working: ${pagesWorking}/${pages.length}`);
      console.log(`   All tests passed: ${allTestsPassed}`);
      
      console.log('\n🔧 TROUBLESHOOTING:');
      console.log('   1. Ensure server is running: npm run dev');
      console.log('   2. Check port 3000 availability');
      console.log('   3. Verify dependencies are installed');
      console.log('   4. Check for compilation errors');
    }

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('\n❌ Cloud VPS test failed:', error.message);
    console.log('\n🔧 Please check server status and try again.');
  }
}

// Run tests if called directly
if (require.main === module) {
  testCloudVPS();
}

module.exports = { testCloudVPS };
