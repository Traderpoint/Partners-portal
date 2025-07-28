// Test Systrix Middleware Communication & Security
// Using built-in fetch (Node.js 18+)

const testEndpoints = [
  'http://localhost:3005/health',
  'http://localhost:3005/api/affiliates',
  'http://localhost:3005/api/products',
  'http://localhost:3005/api/test-connection'
];

async function testMiddleware() {
  console.log('🔍 Testing Systrix Middleware Communication & Security');
  console.log('='.repeat(60));
  
  // Test 1: Basic endpoint connectivity
  console.log('\n1️⃣ ENDPOINT CONNECTIVITY');
  console.log('-'.repeat(40));
  
  for (const endpoint of testEndpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: {
          'Origin': 'http://localhost:3000',
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ ${endpoint}: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   📊 Response size: ${JSON.stringify(data).length} bytes`);
        console.log(`   🔒 Has success field: ${data.hasOwnProperty('success')}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.message}`);
    }
  }
  
  // Test 2: CORS Security
  console.log('\n2️⃣ CORS SECURITY TEST');
  console.log('-'.repeat(40));
  
  try {
    const response = await fetch('http://localhost:3005/health', {
      headers: {
        'Origin': 'http://malicious-site.com',
        'Content-Type': 'application/json'
      }
    });
    console.log(`⚠️  CORS test from malicious origin: ${response.status}`);
  } catch (error) {
    console.log(`✅ CORS properly blocked malicious origin: ${error.message}`);
  }
  
  // Test 3: Rate Limiting
  console.log('\n3️⃣ RATE LIMITING TEST');
  console.log('-'.repeat(40));
  
  const requests = [];
  for (let i = 0; i < 5; i++) {
    requests.push(
      fetch('http://localhost:3005/health', {
        headers: {
          'Origin': 'http://localhost:3000'
        }
      })
    );
  }
  
  try {
    const responses = await Promise.all(requests);
    const statuses = responses.map(r => r.status);
    console.log(`✅ Rapid requests handled: ${statuses.join(', ')}`);
    console.log(`   Rate limiting: ${statuses.includes(429) ? 'Active' : 'Permissive'}`);
  } catch (error) {
    console.log(`❌ Rate limiting test failed: ${error.message}`);
  }
  
  // Test 4: Data Validation
  console.log('\n4️⃣ DATA VALIDATION TEST');
  console.log('-'.repeat(40));
  
  try {
    const response = await fetch('http://localhost:3005/api/process-order', {
      method: 'POST',
      headers: {
        'Origin': 'http://localhost:3000',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        invalid: 'data'
      })
    });
    
    const result = await response.json();
    console.log(`✅ Validation test: ${response.status}`);
    console.log(`   Validation active: ${result.error && result.error.includes('Validation') ? 'Yes' : 'No'}`);
  } catch (error) {
    console.log(`❌ Validation test failed: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 MIDDLEWARE SECURITY TEST COMPLETED');
  console.log('='.repeat(60));
}

testMiddleware().catch(console.error);
