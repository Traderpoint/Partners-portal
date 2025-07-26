import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function PaymentMethodsTest() {
  const router = useRouter();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [testResults, setTestResults] = useState({});

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading payment methods...');
      const response = await fetch('/api/payments/methods');
      const data = await response.json();

      if (data.success) {
        setPaymentMethods(data.methods || []);
        console.log('✅ Payment methods loaded:', data.methods);
      } else {
        throw new Error(data.error || 'Failed to load payment methods');
      }
    } catch (err) {
      console.error('❌ Error loading payment methods:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testPaymentMethod = async (method) => {
    const testId = `TEST-${method.id.toUpperCase()}-${Date.now()}`;
    
    try {
      setTestResults(prev => ({
        ...prev,
        [method.id]: { status: 'testing', message: 'Initializing payment...' }
      }));

      console.log(`🧪 Testing payment method: ${method.id}`);
      
      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: testId,
          invoiceId: '456',
          method: method.id,
          amount: 1,
          currency: 'CZK',
          customerData: {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com'
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        setTestResults(prev => ({
          ...prev,
          [method.id]: {
            status: 'success',
            message: 'Payment initialized successfully',
            data: result
          }
        }));
        console.log(`✅ ${method.id} test successful:`, result);
      } else {
        throw new Error(result.error || 'Payment initialization failed');
      }
    } catch (err) {
      console.error(`❌ ${method.id} test failed:`, err);
      setTestResults(prev => ({
        ...prev,
        [method.id]: {
          status: 'error',
          message: err.message,
          error: err
        }
      }));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return '#28a745';
      case 'error': return '#dc3545';
      case 'testing': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'testing': return '⏳';
      default: return '⚪';
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <Head>
        <title>Payment Methods Test - Cloud VPS</title>
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
            cursor: 'pointer',
            marginBottom: '10px'
          }}
        >
          ← Back to Test Portal
        </button>
      </div>

      <h1>🔍 Payment Methods Test</h1>
      <p>Test všech dostupných platebních metod a jejich inicializace</p>

      {/* Test Info */}
      <div style={{
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '20px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>🧪 Test Information:</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#856404' }}>
          <li>Testuje se inicializace platby pro každou dostupnou metodu</li>
          <li>V testovacím režimu se používají simulované platební brány</li>
          <li>Částka: 1 CZK (minimální testovací částka)</li>
          <li>Všechny metody by měly být dostupné i když nejsou aktivní v HostBill</li>
        </ul>
      </div>

      {/* Refresh Button */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={loadPaymentMethods}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? '🔄 Loading...' : '🔄 Refresh Payment Methods'}
        </button>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          padding: '15px',
          marginBottom: '20px',
          color: '#721c24'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Payment Methods Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {paymentMethods.map((method) => {
          const testResult = testResults[method.id];
          
          return (
            <div
              key={method.id}
              style={{
                backgroundColor: 'white',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                <span style={{ fontSize: '24px', marginRight: '10px' }}>{method.icon}</span>
                <div>
                  <h3 style={{ margin: 0, color: '#495057' }}>{method.name}</h3>
                  <small style={{ color: '#6c757d' }}>ID: {method.id}</small>
                </div>
              </div>

              <div style={{ marginBottom: '15px', fontSize: '14px' }}>
                <div><strong>Type:</strong> {method.type}</div>
                <div><strong>Redirect:</strong> {method.requiresRedirect ? 'Yes' : 'No'}</div>
                <div><strong>HostBill ID:</strong> {method.hostbillId}</div>
                <div><strong>Enabled:</strong> {method.enabled ? '✅' : '❌'}</div>
                {method.warning && (
                  <div style={{ color: '#dc3545', marginTop: '5px' }}>
                    <strong>Warning:</strong> {method.warning}
                  </div>
                )}
              </div>

              {testResult && (
                <div style={{
                  backgroundColor: testResult.status === 'success' ? '#d4edda' : 
                                 testResult.status === 'error' ? '#f8d7da' : '#fff3cd',
                  border: `1px solid ${getStatusColor(testResult.status)}`,
                  borderRadius: '4px',
                  padding: '10px',
                  marginBottom: '15px',
                  fontSize: '14px'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                    {getStatusIcon(testResult.status)} {testResult.message}
                  </div>
                  {testResult.data?.paymentUrl && (
                    <div style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                      <strong>Payment URL:</strong> {testResult.data.paymentUrl}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => testPaymentMethod(method)}
                disabled={testResult?.status === 'testing'}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: testResult?.status === 'testing' ? '#6c757d' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: testResult?.status === 'testing' ? 'not-allowed' : 'pointer',
                  opacity: testResult?.status === 'testing' ? 0.6 : 1
                }}
              >
                {testResult?.status === 'testing' ? '⏳ Testing...' : '🧪 Test Payment Method'}
              </button>
            </div>
          );
        })}
      </div>

      {paymentMethods.length === 0 && !loading && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          color: '#6c757d'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>💳</div>
          <div>No payment methods available</div>
        </div>
      )}
    </div>
  );
}
