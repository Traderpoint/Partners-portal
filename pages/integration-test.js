import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function IntegrationTest() {
  const router = useRouter();
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);

  const integrationTests = [
    {
      id: 'middleware-health',
      name: 'Middleware Health Check',
      endpoint: 'http://localhost:3005/health',
      method: 'GET',
      description: 'Ověří, že middleware běží a je připojen k HostBill'
    },
    {
      id: 'products-via-middleware',
      name: 'Produkty přes Middleware',
      endpoint: '/api/products',
      method: 'GET',
      description: 'Test načítání produktů přes middleware'
    },
    {
      id: 'payment-modules-via-middleware',
      name: 'Payment Modules přes Middleware',
      endpoint: '/api/hostbill/payment-modules',
      method: 'GET',
      description: 'Test načítání platebních modulů přes middleware'
    },
    {
      id: 'payment-methods-via-middleware',
      name: 'Payment Methods přes Middleware',
      endpoint: '/api/payments/methods',
      method: 'GET',
      description: 'Test načítání platebních metod přes middleware'
    },
    {
      id: 'order-creation-via-middleware',
      name: 'Vytvoření objednávky přes Middleware',
      endpoint: '/api/orders/create',
      method: 'POST',
      description: 'Test vytvoření objednávky přes middleware',
      data: {
        customer: {
          firstName: 'Integration',
          lastName: 'Test',
          email: 'integration-test@example.com',
          phone: '+420123456789'
        },
        items: [{
          productId: '1',
          name: 'VPS Integration Test',
          price: 50,
          quantity: 1
        }]
      }
    }
  ];

  const runAllTests = async () => {
    setLoading(true);
    setTestResults({});

    for (const test of integrationTests) {
      await runSingleTest(test);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setLoading(false);
  };

  const runSingleTest = async (test) => {
    try {
      setTestResults(prev => ({
        ...prev,
        [test.id]: { status: 'running', message: 'Running test...' }
      }));

      console.log(`🧪 Running test: ${test.name}`);

      const options = {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      if (test.data) {
        options.body = JSON.stringify(test.data);
      }

      const response = await fetch(test.endpoint, options);
      const data = await response.json();

      if (response.ok && data.success !== false) {
        setTestResults(prev => ({
          ...prev,
          [test.id]: {
            status: 'success',
            message: 'Test passed',
            data: data,
            responseTime: Date.now()
          }
        }));
        console.log(`✅ ${test.name} passed:`, data);
      } else {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

    } catch (error) {
      console.error(`❌ ${test.name} failed:`, error);
      setTestResults(prev => ({
        ...prev,
        [test.id]: {
          status: 'error',
          message: error.message,
          error: error
        }
      }));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return '#28a745';
      case 'error': return '#dc3545';
      case 'running': return '#007bff';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'running': return '⏳';
      default: return '⚪';
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <Head>
        <title>Integration Test - Cloud VPS ↔ Middleware</title>
      </Head>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => router.push('/test-portal')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ← Back to Test Portal
        </button>
      </div>

      <h1>🔗 CloudVPS ↔ Middleware Integration Test</h1>
      <p>Kompletní test integrace mezi CloudVPS a Middleware</p>

      {/* Test Info */}
      <div style={{
        backgroundColor: '#e3f2fd',
        border: '1px solid #2196f3',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '20px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>🔗 Integration Architecture:</h4>
        <div style={{ color: '#1976d2', fontSize: '14px' }}>
          <div><strong>CloudVPS Frontend</strong> → <strong>Next.js API</strong> → <strong>Middleware</strong> → <strong>HostBill API</strong></div>
          <div style={{ marginTop: '10px' }}>
            <strong>Testované endpointy:</strong>
            <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
              <li>/api/products (produkty)</li>
              <li>/api/hostbill/payment-modules (platební moduly)</li>
              <li>/api/payments/methods (platební metody)</li>
              <li>/api/orders/create (vytvoření objednávky)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Run Tests Button */}
      <div style={{ marginBottom: '30px' }}>
        <button
          onClick={runAllTests}
          disabled={loading}
          style={{
            padding: '15px 30px',
            backgroundColor: loading ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {loading ? '⏳ Running Integration Tests...' : '🚀 Run All Integration Tests'}
        </button>
      </div>

      {/* Test Results */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '20px'
      }}>
        {integrationTests.map((test) => {
          const result = testResults[test.id];
          const status = result?.status || 'pending';
          
          return (
            <div
              key={test.id}
              style={{
                backgroundColor: 'white',
                border: `2px solid ${getStatusColor(status)}`,
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                <span style={{ fontSize: '24px', marginRight: '10px' }}>
                  {getStatusIcon(status)}
                </span>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, color: '#495057' }}>{test.name}</h3>
                  <small style={{ color: '#6c757d' }}>
                    {test.method} {test.endpoint}
                  </small>
                </div>
              </div>

              <div style={{ marginBottom: '15px', fontSize: '14px', color: '#6c757d' }}>
                {test.description}
              </div>

              {result && (
                <div style={{
                  backgroundColor: status === 'success' ? '#d4edda' : 
                                 status === 'error' ? '#f8d7da' : '#d1ecf1',
                  border: `1px solid ${getStatusColor(status)}`,
                  borderRadius: '4px',
                  padding: '10px',
                  marginBottom: '15px',
                  fontSize: '14px'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                    {result.message}
                  </div>
                  
                  {result.data && (
                    <div style={{ fontSize: '12px' }}>
                      {status === 'success' && (
                        <div>
                          {result.data.total && <div>Total items: {result.data.total}</div>}
                          {result.data.source && <div>Source: {result.data.source}</div>}
                          {result.data.success && <div>Success: {result.data.success.toString()}</div>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => runSingleTest(test)}
                disabled={result?.status === 'running'}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: result?.status === 'running' ? '#6c757d' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: result?.status === 'running' ? 'not-allowed' : 'pointer',
                  opacity: result?.status === 'running' ? 0.6 : 1
                }}
              >
                {result?.status === 'running' ? '⏳ Testing...' : '🧪 Run This Test'}
              </button>

              {result?.data && (
                <details style={{ marginTop: '15px', fontSize: '12px' }}>
                  <summary style={{ cursor: 'pointer', color: '#6c757d' }}>
                    Show response data
                  </summary>
                  <pre style={{
                    backgroundColor: '#f8f9fa',
                    padding: '10px',
                    borderRadius: '4px',
                    overflow: 'auto',
                    marginTop: '10px',
                    maxHeight: '200px'
                  }}>
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {Object.keys(testResults).length > 0 && (
        <div style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '20px',
          marginTop: '30px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>📊 Integration Test Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', color: '#28a745' }}>
                {Object.values(testResults).filter(r => r.status === 'success').length}
              </div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>Passed</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', color: '#dc3545' }}>
                {Object.values(testResults).filter(r => r.status === 'error').length}
              </div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>Failed</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', color: '#007bff' }}>
                {Object.values(testResults).filter(r => r.status === 'running').length}
              </div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>Running</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', color: '#6c757d' }}>
                {integrationTests.length}
              </div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>Total</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
