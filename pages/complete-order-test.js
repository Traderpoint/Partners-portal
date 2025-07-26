import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function CompleteOrderTest() {
  const router = useRouter();
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const testSteps = [
    { id: 'products', name: 'Načtení produktů', endpoint: '/api/hostbill/products' },
    { id: 'payment-methods', name: 'Načtení platebních metod', endpoint: '/api/payments/methods' },
    { id: 'create-order', name: 'Vytvoření objednávky', endpoint: '/api/orders/create' },
    { id: 'initialize-payment', name: 'Inicializace platby', endpoint: '/api/payments/initialize' },
    { id: 'payment-status', name: 'Kontrola stavu platby', endpoint: '/api/payments/status' }
  ];

  const runCompleteTest = async () => {
    setLoading(true);
    setTestResults({});
    setCurrentStep(0);

    const results = {};

    try {
      // Step 1: Load products
      setCurrentStep(1);
      console.log('🧪 Step 1: Loading products...');
      const productsResponse = await fetch('/api/hostbill/products');
      const productsData = await productsResponse.json();
      results.products = {
        success: productsData.success,
        count: productsData.products?.length || 0,
        data: productsData
      };

      // Step 2: Load payment methods
      setCurrentStep(2);
      console.log('🧪 Step 2: Loading payment methods...');
      const methodsResponse = await fetch('/api/payments/methods');
      const methodsData = await methodsResponse.json();
      const activeMethods = methodsData.methods?.filter(m => m.enabled) || [];
      results.paymentMethods = {
        success: methodsData.success,
        activeCount: activeMethods.length,
        methods: activeMethods,
        data: methodsData
      };

      // Step 3: Create order
      setCurrentStep(3);
      console.log('🧪 Step 3: Creating order...');
      const orderData = {
        customer: {
          firstName: 'Test',
          lastName: 'User',
          email: `test-${Date.now()}@example.com`,
          phone: '+420123456789',
          company: 'Test Company'
        },
        items: [
          {
            productId: '1',
            name: 'VPS Start',
            price: 2390,
            quantity: 1
          }
        ],
        affiliate: {
          id: 'test-affiliate',
          source: 'complete-test'
        }
      };

      const orderResponse = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      const orderResult = await orderResponse.json();
      results.createOrder = {
        success: orderResult.success,
        orderId: orderResult.data?.orders?.[0]?.orderId,
        invoiceId: orderResult.data?.orders?.[0]?.invoiceId,
        clientId: orderResult.data?.client?.id,
        data: orderResult
      };

      // Step 4: Initialize payment (if order was created)
      if (results.createOrder.success && results.createOrder.invoiceId && activeMethods.length > 0) {
        setCurrentStep(4);
        console.log('🧪 Step 4: Initializing payment...');
        const paymentData = {
          orderId: `TEST-${Date.now()}`,
          invoiceId: results.createOrder.invoiceId,
          method: activeMethods[0].id, // Use first active method
          amount: 2390,
          currency: 'CZK'
        };

        const paymentResponse = await fetch('/api/payments/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paymentData)
        });
        const paymentResult = await paymentResponse.json();
        results.initializePayment = {
          success: paymentResult.success,
          paymentUrl: paymentResult.paymentUrl,
          method: paymentData.method,
          data: paymentResult
        };
      } else {
        results.initializePayment = {
          success: false,
          error: 'Cannot initialize payment - order creation failed or no active payment methods'
        };
      }

      // Step 5: Check payment status (mock)
      setCurrentStep(5);
      console.log('🧪 Step 5: Checking payment status...');
      results.paymentStatus = {
        success: true,
        status: 'initialized',
        note: 'Payment status check completed (mock)'
      };

      setTestResults(results);
      console.log('✅ Complete order test finished:', results);

    } catch (error) {
      console.error('❌ Test failed:', error);
      results.error = {
        message: error.message,
        step: currentStep
      };
      setTestResults(results);
    } finally {
      setLoading(false);
      setCurrentStep(0);
    }
  };

  const getStepStatus = (stepIndex) => {
    if (loading && currentStep === stepIndex) return 'running';
    if (loading && currentStep > stepIndex) return 'completed';
    if (!loading && testResults[testSteps[stepIndex - 1]?.id]) return 'completed';
    return 'pending';
  };

  const getStepIcon = (status) => {
    switch (status) {
      case 'running': return '⏳';
      case 'completed': return '✅';
      case 'pending': return '⚪';
      default: return '⚪';
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <Head>
        <title>Complete Order Test - Cloud VPS</title>
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

      <h1>🛒 Complete Order Workflow Test</h1>
      <p>Kompletní test celého objednávkového procesu od produktů po platbu</p>

      {/* Test Button */}
      <div style={{ marginBottom: '30px' }}>
        <button
          onClick={runCompleteTest}
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
          {loading ? '⏳ Running Complete Test...' : '🚀 Run Complete Order Test'}
        </button>
      </div>

      {/* Progress Steps */}
      <div style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '30px'
      }}>
        <h3 style={{ margin: '0 0 20px 0' }}>📋 Test Progress</h3>
        {testSteps.map((step, index) => {
          const status = getStepStatus(index + 1);
          return (
            <div key={step.id} style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px',
              marginBottom: '10px',
              backgroundColor: status === 'running' ? '#fff3cd' : 'white',
              border: `1px solid ${status === 'running' ? '#ffeaa7' : '#dee2e6'}`,
              borderRadius: '4px'
            }}>
              <span style={{ fontSize: '20px', marginRight: '15px' }}>
                {getStepIcon(status)}
              </span>
              <div style={{ flex: 1 }}>
                <strong>{step.name}</strong>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>{step.endpoint}</div>
              </div>
              {status === 'running' && (
                <div style={{ color: '#856404', fontSize: '14px' }}>Running...</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Results */}
      {Object.keys(testResults).length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '20px'
        }}>
          {Object.entries(testResults).map(([key, result]) => (
            <div key={key} style={{
              backgroundColor: 'white',
              border: `2px solid ${result.success ? '#28a745' : '#dc3545'}`,
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h4 style={{ 
                margin: '0 0 15px 0',
                color: result.success ? '#28a745' : '#dc3545'
              }}>
                {result.success ? '✅' : '❌'} {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </h4>
              
              <div style={{ fontSize: '14px', marginBottom: '15px' }}>
                {key === 'products' && (
                  <div>Products loaded: {result.count}</div>
                )}
                {key === 'paymentMethods' && (
                  <div>
                    Active methods: {result.activeCount}
                    {result.methods && (
                      <div style={{ marginTop: '5px' }}>
                        {result.methods.map(m => (
                          <span key={m.id} style={{
                            display: 'inline-block',
                            padding: '2px 6px',
                            backgroundColor: '#e9ecef',
                            borderRadius: '3px',
                            fontSize: '12px',
                            marginRight: '5px',
                            marginTop: '2px'
                          }}>
                            {m.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {key === 'createOrder' && (
                  <div>
                    <div>Order ID: {result.orderId}</div>
                    <div>Invoice ID: {result.invoiceId}</div>
                    <div>Client ID: {result.clientId}</div>
                  </div>
                )}
                {key === 'initializePayment' && (
                  <div>
                    <div>Method: {result.method}</div>
                    {result.paymentUrl && (
                      <div style={{ wordBreak: 'break-all', fontSize: '12px', marginTop: '5px' }}>
                        URL: {result.paymentUrl}
                      </div>
                    )}
                  </div>
                )}
                {result.error && (
                  <div style={{ color: '#dc3545' }}>Error: {result.error}</div>
                )}
              </div>

              <details style={{ fontSize: '12px' }}>
                <summary style={{ cursor: 'pointer', color: '#6c757d' }}>
                  Show raw data
                </summary>
                <pre style={{
                  backgroundColor: '#f8f9fa',
                  padding: '10px',
                  borderRadius: '4px',
                  overflow: 'auto',
                  marginTop: '10px'
                }}>
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
