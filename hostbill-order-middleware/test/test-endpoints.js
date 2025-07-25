/**
 * Test Endpoints for HostBill Order Middleware
 * Run with: node test/test-endpoints.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3005';

// Test data
const testOrderData = {
  customer: {
    firstName: 'Jan',
    lastName: 'Novák',
    email: 'jan.novak@example.com',
    phone: '+420123456789',
    address: 'Testovací ulice 123',
    city: 'Praha',
    postalCode: '11000',
    country: 'CZ',
    state: '',
    company: 'Test s.r.o.'
  },
  items: [
    {
      productId: '5',
      name: 'VPS Start',
      price: 249,
      cycle: 'm',
      configOptions: {
        ram: '4GB',
        cpu: '2',
        storage: '50GB'
      }
    }
  ],
  affiliate: {
    id: '1',
    code: 'test-affiliate'
  },
  paymentMethod: 'banktransfer',
  newsletterSubscribe: false
};

class MiddlewareTest {
  constructor() {
    this.results = [];
  }

  async runTest(name, testFunction) {
    console.log(`\n🧪 Running test: ${name}`);
    console.log('─'.repeat(50));
    
    try {
      const startTime = Date.now();
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      this.results.push({
        name,
        status: 'PASSED',
        duration: `${duration}ms`,
        result
      });
      
      console.log(`✅ Test passed (${duration}ms)`);
      if (result) {
        console.log('Result:', JSON.stringify(result, null, 2));
      }
      
    } catch (error) {
      this.results.push({
        name,
        status: 'FAILED',
        error: error.message,
        details: error.response?.data
      });
      
      console.log(`❌ Test failed: ${error.message}`);
      if (error.response?.data) {
        console.log('Error details:', JSON.stringify(error.response.data, null, 2));
      }
    }
  }

  async testHealthCheck() {
    const response = await axios.get(`${BASE_URL}/health`);
    return response.data;
  }

  async testConnectionCheck() {
    const response = await axios.get(`${BASE_URL}/api/test-connection`);
    return response.data;
  }

  async testOrderProcessing() {
    const response = await axios.post(`${BASE_URL}/api/process-order`, testOrderData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  }

  async testOrderProcessingWithoutAffiliate() {
    const orderDataNoAffiliate = { ...testOrderData };
    delete orderDataNoAffiliate.affiliate;
    
    const response = await axios.post(`${BASE_URL}/api/process-order`, orderDataNoAffiliate, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  }

  async testInvalidOrderData() {
    const invalidData = {
      customer: {
        firstName: 'Jan'
        // Missing required fields
      },
      items: []
    };
    
    try {
      await axios.post(`${BASE_URL}/api/process-order`, invalidData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      throw new Error('Should have failed validation');
    } catch (error) {
      if (error.response?.status === 400) {
        return { validationWorking: true, error: error.response.data };
      }
      throw error;
    }
  }

  async testRateLimiting() {
    const promises = [];
    
    // Send 10 requests quickly
    for (let i = 0; i < 10; i++) {
      promises.push(
        axios.get(`${BASE_URL}/health`).catch(err => ({
          status: err.response?.status,
          error: err.response?.data
        }))
      );
    }
    
    const results = await Promise.all(promises);
    return {
      totalRequests: results.length,
      successfulRequests: results.filter(r => r.status !== 429).length,
      rateLimitedRequests: results.filter(r => r.status === 429).length
    };
  }

  async testConfirmationPage() {
    try {
      const response = await axios.get(`${BASE_URL}/confirmation/test-order-123`);
      return {
        status: response.status,
        contentType: response.headers['content-type'],
        hasHtml: response.data.includes('<html>')
      };
    } catch (error) {
      if (error.response?.status === 500) {
        return { expectedError: true, message: 'Order not found (expected)' };
      }
      throw error;
    }
  }

  async testNonExistentEndpoint() {
    try {
      await axios.get(`${BASE_URL}/api/non-existent`);
      throw new Error('Should have returned 404');
    } catch (error) {
      if (error.response?.status === 404) {
        return { status: 404, message: '404 handling works correctly' };
      }
      throw error;
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('🏁 TEST SUMMARY');
    console.log('='.repeat(60));
    
    const passed = this.results.filter(r => r.status === 'PASSED').length;
    const failed = this.results.filter(r => r.status === 'FAILED').length;
    
    console.log(`Total tests: ${this.results.length}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success rate: ${((passed / this.results.length) * 100).toFixed(1)}%`);
    
    console.log('\nDetailed Results:');
    console.log('-'.repeat(60));
    
    this.results.forEach((result, index) => {
      const status = result.status === 'PASSED' ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.name}`);
      
      if (result.status === 'PASSED' && result.duration) {
        console.log(`   Duration: ${result.duration}`);
      }
      
      if (result.status === 'FAILED') {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    console.log('\n' + '='.repeat(60));
  }

  async runAllTests() {
    console.log('🚀 Starting HostBill Order Middleware Tests');
    console.log(`📡 Testing server at: ${BASE_URL}`);
    
    // Basic functionality tests
    await this.runTest('Health Check', () => this.testHealthCheck());
    await this.runTest('HostBill Connection Test', () => this.testConnectionCheck());
    
    // Order processing tests
    await this.runTest('Order Processing (with affiliate)', () => this.testOrderProcessing());
    await this.runTest('Order Processing (without affiliate)', () => this.testOrderProcessingWithoutAffiliate());
    
    // Validation tests
    await this.runTest('Invalid Order Data Validation', () => this.testInvalidOrderData());
    
    // Security and performance tests
    await this.runTest('Rate Limiting', () => this.testRateLimiting());
    
    // Page rendering tests
    await this.runTest('Confirmation Page', () => this.testConfirmationPage());
    
    // Error handling tests
    await this.runTest('404 Error Handling', () => this.testNonExistentEndpoint());
    
    this.printSummary();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new MiddlewareTest();
  
  console.log('⏳ Waiting 2 seconds for server to be ready...');
  setTimeout(() => {
    tester.runAllTests().catch(error => {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    });
  }, 2000);
}

module.exports = MiddlewareTest;
