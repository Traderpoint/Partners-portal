import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function TestPaymentGateway() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    paymentId: `TEST-${Date.now()}`,
    orderId: `ORDER-${Date.now()}`,
    invoiceId: '456',
    method: 'card',
    amount: 1000,
    currency: 'CZK',
    successUrl: 'http://localhost:3000/order-confirmation',
    cancelUrl: 'http://localhost:3000/payment'
  });

  const paymentMethods = [
    { id: 'card', name: 'Platební karta', icon: '💳' },
    { id: 'paypal', name: 'PayPal', icon: '🅿️' },
    { id: 'payu', name: 'PayU', icon: '💰' },
    { id: 'crypto', name: 'Kryptoměny', icon: '₿' },
    { id: 'banktransfer', name: 'Bankovní převod', icon: '🏦' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const openTestGateway = () => {
    const params = new URLSearchParams({
      paymentId: formData.paymentId,
      orderId: formData.orderId,
      invoiceId: formData.invoiceId,
      method: formData.method,
      amount: formData.amount,
      currency: formData.currency,
      successUrl: encodeURIComponent(formData.successUrl),
      cancelUrl: encodeURIComponent(formData.cancelUrl),
      testMode: 'true'
    });

    const testUrl = `http://localhost:3005/test-payment?${params.toString()}`;
    window.open(testUrl, '_blank');
  };

  const generateNewIds = () => {
    const timestamp = Date.now();
    setFormData(prev => ({
      ...prev,
      paymentId: `TEST-${timestamp}`,
      orderId: `ORDER-${timestamp}`
    }));
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <Head>
        <title>Test Payment Gateway - Cloud VPS</title>
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

      <h1>🧪 Test Payment Gateway</h1>
      <p>Přímý přístup k testovací platební bráně pro simulaci platebního procesu</p>

      {/* Info Panel */}
      <div style={{
        backgroundColor: '#e3f2fd',
        border: '1px solid #2196f3',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '20px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>ℹ️ Informace:</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#1976d2' }}>
          <li>Tato stránka otevře testovací platební bránu v novém okně</li>
          <li>Můžete simulovat úspěšnou nebo zrušenou platbu</li>
          <li>Testovací brána běží na http://localhost:3005/test-payment</li>
          <li>Po dokončení platby budete přesměrováni zpět na aplikaci</li>
        </ul>
      </div>

      {/* Configuration Form */}
      <div style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#495057' }}>🔧 Payment Configuration</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Payment ID:
            </label>
            <input
              type="text"
              value={formData.paymentId}
              onChange={(e) => handleInputChange('paymentId', e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Order ID:
            </label>
            <input
              type="text"
              value={formData.orderId}
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
              value={formData.invoiceId}
              onChange={(e) => handleInputChange('invoiceId', e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Payment Method:
            </label>
            <select
              value={formData.method}
              onChange={(e) => handleInputChange('method', e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px' }}
            >
              {paymentMethods.map(method => (
                <option key={method.id} value={method.id}>
                  {method.icon} {method.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Amount:
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', parseFloat(e.target.value))}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Currency:
            </label>
            <select
              value={formData.currency}
              onChange={(e) => handleInputChange('currency', e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px' }}
            >
              <option value="CZK">CZK</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>Redirect URLs:</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Success URL:
              </label>
              <input
                type="text"
                value={formData.successUrl}
                onChange={(e) => handleInputChange('successUrl', e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Cancel URL:
              </label>
              <input
                type="text"
                value={formData.cancelUrl}
                onChange={(e) => handleInputChange('cancelUrl', e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
        <button
          onClick={generateNewIds}
          style={{
            padding: '12px 24px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔄 Generate New IDs
        </button>
        
        <button
          onClick={openTestGateway}
          style={{
            padding: '12px 24px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🚀 Open Test Payment Gateway
        </button>
      </div>

      {/* URL Preview */}
      <div style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '15px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>🔗 Generated URL:</h4>
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #ced4da',
          borderRadius: '4px',
          padding: '10px',
          fontFamily: 'monospace',
          fontSize: '12px',
          wordBreak: 'break-all',
          color: '#495057'
        }}>
          {`http://localhost:3005/test-payment?${new URLSearchParams({
            paymentId: formData.paymentId,
            orderId: formData.orderId,
            invoiceId: formData.invoiceId,
            method: formData.method,
            amount: formData.amount,
            currency: formData.currency,
            successUrl: encodeURIComponent(formData.successUrl),
            cancelUrl: encodeURIComponent(formData.cancelUrl),
            testMode: 'true'
          }).toString()}`}
        </div>
      </div>
    </div>
  );
}
