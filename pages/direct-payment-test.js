import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function DirectPaymentTest() {
  const router = useRouter();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [testData, setTestData] = useState({
    invoiceId: '456',
    amount: 1000,
    currency: 'CZK'
  });

  useEffect(() => {
    loadDirectPaymentMethods();
  }, []);

  const loadDirectPaymentMethods = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading direct HostBill payment methods...');
      const response = await fetch('/api/payments/direct-methods');
      const data = await response.json();

      if (data.success) {
        setPaymentMethods(data.methods || []);
        console.log('✅ Direct payment methods loaded:', data.methods);
      } else {
        throw new Error(data.error || 'Failed to load direct payment methods');
      }
    } catch (err) {
      console.error('❌ Error loading direct payment methods:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testDirectPayment = async (method) => {
    const testId = `DIRECT-${method.id.toUpperCase()}-${Date.now()}`;
    
    try {
      setTestResults(prev => ({
        ...prev,
        [method.id]: { status: 'testing', message: 'Opening payment URL...' }
      }));

      console.log(`🧪 Testing direct payment method: ${method.id}`);
      
      // Generate payment URL with test parameters
      const paymentUrl = `${method.testUrl}&amount=${testData.amount}&currency=${testData.currency}&orderId=${testId}`;
      
      // Open payment URL in new window
      window.open(paymentUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
      
      setTestResults(prev => ({
        ...prev,
        [method.id]: {
          status: 'success',
          message: 'Payment URL opened successfully',
          paymentUrl: paymentUrl
        }
      }));
      
      console.log(`✅ ${method.id} payment URL opened:`, paymentUrl);
      
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

  const handleInputChange = (field, value) => {
    setTestData(prev => ({
      ...prev,
      [field]: value
    }));
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
        <title>Direct HostBill Payment Test - Cloud VPS</title>
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

      <h1>🎯 Direct HostBill Payment Test</h1>
      <p>Přímé testování platebních metod s HostBill API bez middleware</p>

      {/* Test Info */}
      <div style={{
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '20px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>🎯 Direct HostBill Integration:</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#856404' }}>
          <li>Přímé volání HostBill API bez middleware</li>
          <li>Testuje se dostupnost platebních bran generováním payment URL</li>
          <li>Platby se otevírají přímo v HostBill client area</li>
          <li>Skutečné platební brány podle konfigurace HostBill</li>
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
        <h3 style={{ margin: '0 0 20px 0', color: '#495057' }}>🔧 Test Configuration</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Invoice ID:
            </label>
            <input
              type="text"
              value={testData.invoiceId}
              onChange={(e) => handleInputChange('invoiceId', e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Amount:
            </label>
            <input
              type="number"
              value={testData.amount}
              onChange={(e) => handleInputChange('amount', parseFloat(e.target.value))}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Currency:
            </label>
            <select
              value={testData.currency}
              onChange={(e) => handleInputChange('currency', e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px' }}
            >
              <option value="CZK">CZK</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={loadDirectPaymentMethods}
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
          {loading ? '🔄 Loading...' : '🔄 Refresh Direct Payment Methods'}
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
                  <small style={{ color: '#6c757d' }}>ID: {method.id} | HostBill: {method.hostbillId}</small>
                </div>
              </div>

              <div style={{ marginBottom: '15px', fontSize: '14px' }}>
                <div><strong>Type:</strong> {method.type}</div>
                <div><strong>Redirect:</strong> {method.requiresRedirect ? 'Yes' : 'No'}</div>
                <div><strong>Source:</strong> {method.source}</div>
                <div><strong>Enabled:</strong> {method.enabled ? '✅' : '❌'}</div>
                {method.description && (
                  <div><strong>Description:</strong> {method.description}</div>
                )}
              </div>

              {method.testUrl && (
                <div style={{
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  padding: '10px',
                  marginBottom: '15px',
                  fontSize: '12px',
                  wordBreak: 'break-all'
                }}>
                  <strong>Payment URL:</strong> {method.testUrl}
                </div>
              )}

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
                  {testResult.paymentUrl && (
                    <div style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                      <strong>Opened URL:</strong> {testResult.paymentUrl}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => testDirectPayment(method)}
                disabled={testResult?.status === 'testing' || !method.enabled}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: testResult?.status === 'testing' ? '#6c757d' : 
                                 !method.enabled ? '#dc3545' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: (testResult?.status === 'testing' || !method.enabled) ? 'not-allowed' : 'pointer',
                  opacity: (testResult?.status === 'testing' || !method.enabled) ? 0.6 : 1
                }}
              >
                {testResult?.status === 'testing' ? '⏳ Opening...' : 
                 !method.enabled ? '❌ Not Available' : '🎯 Test Direct Payment'}
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
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎯</div>
          <div>No direct payment methods available</div>
        </div>
      )}
    </div>
  );
}
