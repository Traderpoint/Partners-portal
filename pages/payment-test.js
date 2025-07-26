import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import PaymentProcessor from '../components/PaymentProcessor';

export default function PaymentTest() {
  const router = useRouter();
  const [mode, setMode] = useState('middleware'); // 'middleware' or 'direct'
  const [testData, setTestData] = useState({
    orderId: 'TEST-' + Date.now(),
    invoiceId: '456', // Updated to match middleware tests
    amount: 1, // Test amount for development
    currency: 'CZK'
  });
  const [showPayment, setShowPayment] = useState(false);
  const [result, setResult] = useState(null);

  // Check for mode parameter in URL
  useEffect(() => {
    if (router.query.mode === 'direct') {
      setMode('direct');
    }
  }, [router.query.mode]);

  const handleInputChange = (field, value) => {
    setTestData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const startPaymentTest = () => {
    setShowPayment(true);
    setResult(null);
  };

  const handlePaymentSuccess = (paymentData) => {
    console.log('✅ Payment successful:', paymentData);
    setResult({
      success: true,
      message: 'Platba byla úspěšně zpracována!',
      data: paymentData
    });
    setShowPayment(false);
  };

  const handlePaymentError = (error) => {
    console.error('❌ Payment error:', error);
    setResult({
      success: false,
      message: 'Platba se nezdařila: ' + error.message,
      error: error
    });
    setShowPayment(false);
  };

  const handlePaymentCancel = () => {
    console.log('🚫 Payment cancelled');
    setShowPayment(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <Head>
        <title>Payment System Test - {mode === 'direct' ? 'Direct HostBill' : 'Middleware'}</title>
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

      <h1>💳 Payment System Test - {mode === 'direct' ? 'Direct HostBill' : 'Middleware'}</h1>
      <p>Test platebního systému s HostBill integrací ({mode === 'direct' ? 'přímé API' : 'přes middleware'})</p>

      {/* Mode Selector */}
      <div style={{
        backgroundColor: '#e3f2fd',
        border: '1px solid #2196f3',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '20px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>🔧 Test Mode:</h4>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setMode('middleware')}
            style={{
              padding: '8px 16px',
              backgroundColor: mode === 'middleware' ? '#28a745' : '#f8f9fa',
              color: mode === 'middleware' ? 'white' : '#495057',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔗 Middleware Mode
          </button>
          <button
            onClick={() => setMode('direct')}
            style={{
              padding: '8px 16px',
              backgroundColor: mode === 'direct' ? '#dc3545' : '#f8f9fa',
              color: mode === 'direct' ? 'white' : '#495057',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🎯 Direct HostBill Mode
          </button>
        </div>

        {/* Test Mode Info */}
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '6px',
          padding: '12px',
          marginTop: '10px',
          fontSize: '14px'
        }}>
          <strong>🧪 Test Mode Active:</strong>
          {mode === 'middleware' ? (
            <span> Platby budou přesměrovány na testovací platební bránu (http://localhost:3005/test-payment)</span>
          ) : (
            <span> Přímé volání HostBill API pro testování platebních metod</span>
          )}
        </div>
      </div>

      {!showPayment ? (
        <>
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
                  Order ID:
                </label>
                <input
                  type="text"
                  value={testData.orderId}
                  onChange={(e) => handleInputChange('orderId', e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px' }}
                />
              </div>
              
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

          {/* Start Payment Button */}
          <button
            onClick={startPaymentTest}
            style={{
              padding: '15px 30px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '18px',
              cursor: 'pointer',
              marginBottom: '20px'
            }}
          >
            🚀 Start Payment Test
          </button>

          {/* Previous Results */}
          {result && (
            <div style={{
              backgroundColor: result.success ? '#d4edda' : '#f8d7da',
              border: `1px solid ${result.success ? '#c3e6cb' : '#f5c6cb'}`,
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <h3 style={{ 
                margin: '0 0 15px 0', 
                color: result.success ? '#155724' : '#721c24' 
              }}>
                {result.success ? '✅ Payment Success' : '❌ Payment Failed'}
              </h3>
              
              <p style={{ margin: '0 0 15px 0' }}>{result.message}</p>
              
              {result.data && (
                <details style={{ marginTop: '15px' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                    🔍 View Payment Data
                  </summary>
                  <pre style={{ 
                    backgroundColor: '#f8f9fa', 
                    padding: '15px', 
                    borderRadius: '4px', 
                    overflow: 'auto', 
                    marginTop: '10px', 
                    fontSize: '12px' 
                  }}>
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}

          {/* Payment System Info */}
          <div style={{
            backgroundColor: '#e3f2fd',
            border: '1px solid #2196f3',
            borderRadius: '8px',
            padding: '20px'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#1976d2' }}>ℹ️ Payment System Info</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
              <div>
                <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>Supported Methods:</h4>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  <li>💳 Credit Card (redirect)</li>
                  <li>🅿️ PayPal (redirect)</li>
                  <li>🏦 Bank Transfer (manual)</li>
                  <li>₿ Cryptocurrency (redirect)</li>
                </ul>
              </div>
              
              <div>
                <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>Features:</h4>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  <li>✅ HostBill Integration</li>
                  <li>✅ Real-time Status</li>
                  <li>✅ Webhook Callbacks</li>
                  <li>✅ Multiple Currencies</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Payment Processor Component */}
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={() => setShowPayment(false)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginBottom: '20px'
              }}
            >
              ← Back to Configuration
            </button>
          </div>

          <PaymentProcessor
            orderId={testData.orderId}
            invoiceId={testData.invoiceId}
            amount={testData.amount}
            currency={testData.currency}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            onCancel={handlePaymentCancel}
          />
        </>
      )}
    </div>
  );
}
