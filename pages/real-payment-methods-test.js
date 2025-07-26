import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function RealPaymentMethodsTest() {
  const router = useRouter();
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [testInvoiceId, setTestInvoiceId] = useState('456');

  const paymentGateways = [
    { id: '1', name: 'Credit Card', icon: '💳' },
    { id: '2', name: 'PayPal', icon: '🅿️' },
    { id: '3', name: 'Bank Transfer', icon: '🏦' },
    { id: '4', name: 'Cryptocurrency', icon: '₿' },
    { id: '5', name: 'PayU', icon: '💰' }
  ];

  const testGatewayAvailability = async (gateway) => {
    try {
      setTestResults(prev => ({
        ...prev,
        [gateway.id]: { status: 'testing', message: 'Testing gateway availability...' }
      }));

      console.log(`🧪 Testing gateway: ${gateway.name} (${gateway.id})`);
      
      const response = await fetch('/api/payments/test-gateway-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gatewayId: gateway.id,
          invoiceId: testInvoiceId
        })
      });

      const result = await response.json();

      if (result.success && result.available) {
        setTestResults(prev => ({
          ...prev,
          [gateway.id]: {
            status: 'available',
            message: 'Gateway is available and configured',
            data: result
          }
        }));
        console.log(`✅ ${gateway.name} is available:`, result);
      } else {
        setTestResults(prev => ({
          ...prev,
          [gateway.id]: {
            status: 'unavailable',
            message: result.error || 'Gateway is not available',
            data: result
          }
        }));
        console.log(`❌ ${gateway.name} is not available:`, result.error);
      }
    } catch (err) {
      console.error(`❌ ${gateway.name} test failed:`, err);
      setTestResults(prev => ({
        ...prev,
        [gateway.id]: {
          status: 'error',
          message: err.message,
          error: err
        }
      }));
    }
  };

  const testAllGateways = async () => {
    setLoading(true);
    setTestResults({});
    
    console.log('🧪 Testing all payment gateways...');
    
    for (const gateway of paymentGateways) {
      await testGatewayAvailability(gateway);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setLoading(false);
    console.log('✅ All gateway tests completed');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return '#28a745';
      case 'unavailable': return '#ffc107';
      case 'error': return '#dc3545';
      case 'testing': return '#007bff';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available': return '✅';
      case 'unavailable': return '⚠️';
      case 'error': return '❌';
      case 'testing': return '⏳';
      default: return '⚪';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available': return 'Available';
      case 'unavailable': return 'Not Available';
      case 'error': return 'Test Failed';
      case 'testing': return 'Testing...';
      default: return 'Not Tested';
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <Head>
        <title>Real Payment Methods Test - Cloud VPS</title>
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

      <h1>🔍 Real Payment Methods Availability Test</h1>
      <p>Testuje skutečnou dostupnost platebních metod v HostBill konfiguraci</p>

      {/* Test Info */}
      <div style={{
        backgroundColor: '#e3f2fd',
        border: '1px solid #2196f3',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '20px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>🔍 Real Gateway Testing:</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#1976d2' }}>
          <li>Testuje se skutečná dostupnost platebních bran v HostBill</li>
          <li>Ověřuje se existence testovací faktury</li>
          <li>Generují se skutečné payment URL pro každou bránu</li>
          <li>Detekuje se, které brány jsou skutečně nakonfigurovány</li>
        </ul>
      </div>

      {/* Test Configuration */}
      <div style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>🔧 Test Configuration</h3>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
          <label style={{ fontWeight: 'bold' }}>
            Test Invoice ID:
          </label>
          <input
            type="text"
            value={testInvoiceId}
            onChange={(e) => setTestInvoiceId(e.target.value)}
            style={{ 
              padding: '8px 12px', 
              border: '1px solid #ced4da', 
              borderRadius: '4px',
              width: '150px'
            }}
          />
        </div>

        <button
          onClick={testAllGateways}
          disabled={loading}
          style={{
            padding: '12px 24px',
            backgroundColor: loading ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {loading ? '⏳ Testing All Gateways...' : '🧪 Test All Payment Gateways'}
        </button>
      </div>

      {/* Results Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {paymentGateways.map((gateway) => {
          const testResult = testResults[gateway.id];
          const status = testResult?.status || 'untested';
          
          return (
            <div
              key={gateway.id}
              style={{
                backgroundColor: 'white',
                border: `2px solid ${getStatusColor(status)}`,
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                <span style={{ fontSize: '24px', marginRight: '10px' }}>{gateway.icon}</span>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, color: '#495057' }}>{gateway.name}</h3>
                  <small style={{ color: '#6c757d' }}>Gateway ID: {gateway.id}</small>
                </div>
                <div style={{
                  padding: '4px 8px',
                  backgroundColor: getStatusColor(status),
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {getStatusIcon(status)} {getStatusText(status)}
                </div>
              </div>

              {testResult && (
                <div style={{
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  padding: '15px',
                  marginBottom: '15px'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '10px', color: getStatusColor(status) }}>
                    {testResult.message}
                  </div>
                  
                  {testResult.data?.paymentUrl && (
                    <div style={{ marginBottom: '10px' }}>
                      <strong>Payment URL:</strong>
                      <div style={{ 
                        fontSize: '12px', 
                        wordBreak: 'break-all',
                        backgroundColor: 'white',
                        padding: '5px',
                        border: '1px solid #ced4da',
                        borderRadius: '3px',
                        marginTop: '5px'
                      }}>
                        {testResult.data.paymentUrl}
                      </div>
                    </div>
                  )}
                  
                  {testResult.data?.invoice && (
                    <div style={{ fontSize: '14px' }}>
                      <strong>Test Invoice:</strong> {testResult.data.invoice.id} 
                      ({testResult.data.invoice.total} {testResult.data.invoice.currency})
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => testGatewayAvailability(gateway)}
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
                {testResult?.status === 'testing' ? '⏳ Testing...' : '🧪 Test This Gateway'}
              </button>

              {testResult?.data?.paymentUrl && testResult.status === 'available' && (
                <button
                  onClick={() => window.open(testResult.data.paymentUrl, '_blank')}
                  style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginTop: '10px',
                    fontSize: '14px'
                  }}
                >
                  🚀 Open Payment URL
                </button>
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
          padding: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>📊 Test Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', color: '#28a745' }}>
                {Object.values(testResults).filter(r => r.status === 'available').length}
              </div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>Available</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', color: '#ffc107' }}>
                {Object.values(testResults).filter(r => r.status === 'unavailable').length}
              </div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>Unavailable</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', color: '#dc3545' }}>
                {Object.values(testResults).filter(r => r.status === 'error').length}
              </div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>Errors</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
