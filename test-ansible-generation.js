/**
 * Test script for Ansible generation during order completion
 * Simulates a real order with selected applications
 */

const testOrderData = {
  orderId: `ORDER-${Date.now()}`,
  serverConfig: {
    hostname: `vps-test-${Date.now()}`,
    operatingSystem: 'linux',
    applications: ['nginx', 'wordpress', 'mysql', 'php', 'certbot', 'fail2ban'],
    customerData: {
      firstName: 'Jan',
      lastName: 'Novák',
      email: 'jan.novak@example.com',
      phone: '+420 123 456 789',
      company: 'Test Company s.r.o.',
      address: 'Testovací 123',
      city: 'Praha',
      postalCode: '11000',
      country: 'CZ'
    },
    serverSpecs: {
      id: 1,
      name: 'VPS Start',
      price: '249 Kč/měsíc',
      cpu: '2 CPU',
      ram: '4 GB RAM',
      storage: '50 GB NVMe SSD',
      quantity: 1
    }
  }
};

async function testAnsibleGeneration() {
  console.log('🚀 Testing Ansible generation...');
  console.log('📋 Order data:', JSON.stringify(testOrderData, null, 2));

  try {
    const response = await fetch('http://localhost:3000/api/ansible/generate-setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testOrderData)
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Ansible setup generated successfully!');
      console.log('📄 Result:', JSON.stringify(result, null, 2));
      
      // Display key information
      console.log('\n🎯 Key Information:');
      console.log(`- Order ID: ${result.orderId}`);
      console.log(`- Deployment ID: ${result.deploymentId}`);
      console.log(`- Server Hostname: ${result.serverConfig?.hostname}`);
      console.log(`- Operating System: ${result.serverConfig?.operating_system}`);
      console.log(`- Applications: ${result.serverConfig?.applications?.join(', ')}`);
      console.log(`- Customer: ${result.serverConfig?.customer?.name} (${result.serverConfig?.customer?.email})`);
      
      console.log('\n📁 Generated Files:');
      result.files?.forEach(file => console.log(`  - ${file}`));
      
      console.log('\n🔧 Available Commands:');
      Object.entries(result.commands || {}).forEach(([name, command]) => {
        console.log(`  - ${name}: ${command}`);
      });
      
      console.log('\n📋 Next Steps:');
      result.nextSteps?.forEach((step, index) => {
        console.log(`  ${index + 1}. ${step}`);
      });
      
    } else {
      const error = await response.json();
      console.error('❌ Ansible generation failed!');
      console.error('Error:', error);
    }
    
  } catch (error) {
    console.error('💥 Request failed:', error.message);
  }
}

// Test different scenarios
async function runAllTests() {
  console.log('🧪 Running Ansible Generation Tests\n');
  
  // Test 1: Basic LAMP stack
  console.log('='.repeat(60));
  console.log('TEST 1: Basic LAMP Stack (Linux + Apache + MySQL + PHP)');
  console.log('='.repeat(60));
  
  const lampTest = {
    ...testOrderData,
    orderId: `LAMP-${Date.now()}`,
    serverConfig: {
      ...testOrderData.serverConfig,
      hostname: `lamp-server-${Date.now()}`,
      applications: ['nginx', 'mysql', 'php']
    }
  };
  
  await testWithData(lampTest);
  
  // Test 2: WordPress with security
  console.log('\n' + '='.repeat(60));
  console.log('TEST 2: WordPress with Security (WordPress + SSL + Firewall)');
  console.log('='.repeat(60));
  
  const wpTest = {
    ...testOrderData,
    orderId: `WP-${Date.now()}`,
    serverConfig: {
      ...testOrderData.serverConfig,
      hostname: `wp-server-${Date.now()}`,
      applications: ['nginx', 'wordpress', 'mysql', 'php', 'certbot', 'fail2ban']
    }
  };
  
  await testWithData(wpTest);
  
  // Test 3: Development environment
  console.log('\n' + '='.repeat(60));
  console.log('TEST 3: Development Environment (Docker + Node.js + Git)');
  console.log('='.repeat(60));
  
  const devTest = {
    ...testOrderData,
    orderId: `DEV-${Date.now()}`,
    serverConfig: {
      ...testOrderData.serverConfig,
      hostname: `dev-server-${Date.now()}`,
      applications: ['docker', 'nodejs', 'git', 'nginx']
    }
  };
  
  await testWithData(devTest);
  
  // Test 4: Windows server
  console.log('\n' + '='.repeat(60));
  console.log('TEST 4: Windows Server');
  console.log('='.repeat(60));
  
  const winTest = {
    ...testOrderData,
    orderId: `WIN-${Date.now()}`,
    serverConfig: {
      ...testOrderData.serverConfig,
      hostname: `win-server-${Date.now()}`,
      operatingSystem: 'windows',
      applications: ['iis', 'mssql']
    }
  };
  
  await testWithData(winTest);
  
  console.log('\n🎉 All tests completed!');
}

async function testWithData(data) {
  try {
    const response = await fetch('http://localhost:3000/api/ansible/generate-setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ ${data.orderId}: SUCCESS`);
      console.log(`   Hostname: ${result.serverConfig?.hostname}`);
      console.log(`   OS: ${result.serverConfig?.operating_system}`);
      console.log(`   Apps: ${result.serverConfig?.applications?.join(', ')}`);
      console.log(`   Files: ${result.files?.length} generated`);
    } else {
      const error = await response.json();
      console.log(`❌ ${data.orderId}: FAILED - ${error.error}`);
    }
  } catch (error) {
    console.log(`💥 ${data.orderId}: ERROR - ${error.message}`);
  }
}

// Run the test
if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch');
  runAllTests();
} else {
  // Browser environment
  console.log('🌐 Running in browser - use testAnsibleGeneration() function');
  window.testAnsibleGeneration = testAnsibleGeneration;
  window.runAllTests = runAllTests;
}

module.exports = { testAnsibleGeneration, runAllTests };
