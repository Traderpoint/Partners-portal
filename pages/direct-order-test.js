import { useState } from 'react';
import Head from 'next/head';

export default function DirectOrderTest() {
  const [formData, setFormData] = useState({
    clientId: '92',
    productId: '1',
    productName: 'VPS Basic',
    price: 299,
    cycle: 'm',
    affiliateId: '2'
  });
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleInputChange = (field, value) => {
    const updates = { [field]: value };
    
    // Auto-update product name and price based on Cloud VPS product ID
    if (field === 'productId') {
      switch (value) {
        case '1':
          updates.productName = 'VPS Basic';
          updates.price = 299;
          break;
        case '2':
          updates.productName = 'VPS Pro';
          updates.price = 499;
          break;
        case '3':
          updates.productName = 'VPS Premium';
          updates.price = 899;
          break;
        case '4':
          updates.productName = 'VPS Enterprise';
          updates.price = 1299;
          break;
      }
    }
    
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const createOrder = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🛒 Creating test order directly via HostBill...');
      console.log('🔍 Sending order with product ID:', formData.productId);

      const orderData = {
        client_id: formData.clientId,
        product_id: formData.productId,
        cycle: formData.cycle,
        affiliate_id: formData.affiliateId,
        confirm: 1,
        invoice_generate: 1,
        invoice_info: 1
      };

      console.log('📤 Order data:', orderData);

      const response = await fetch('/api/hostbill/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        console.log('✅ Test order created directly via HostBill:', data);
      } else {
        setError(data.error || 'Order creation failed');
        console.error('❌ Test order failed directly via HostBill:', data);
      }
    } catch (err) {
      setError(err.message);
      console.error('❌ Error creating test order directly via HostBill:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <Head>
        <title>Direct HostBill Order Test</title>
      </Head>

      <h1>🎯 Direct HostBill Order Test</h1>
      <p>Test vytvoření objednávky přímo přes HostBill API</p>

      {/* Form */}
      <div style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#495057' }}>📝 Order Data</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Client ID:</label>
            <input
              type="text"
              value={formData.clientId}
              onChange={(e) => handleInputChange('clientId', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Product ID:</label>
            <select
              value={formData.productId}
              onChange={(e) => handleInputChange('productId', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px'
              }}
            >
              <option value="1">1 - VPS Basic (299 CZK)</option>
              <option value="2">2 - VPS Pro (499 CZK)</option>
              <option value="3">3 - VPS Premium (899 CZK)</option>
              <option value="4">4 - VPS Enterprise (1299 CZK)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Product Name:</label>
            <input
              type="text"
              value={formData.productName}
              readOnly
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                backgroundColor: '#f8f9fa'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Price (CZK):</label>
            <input
              type="number"
              value={formData.price}
              readOnly
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                backgroundColor: '#f8f9fa'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Billing Cycle:</label>
            <select
              value={formData.cycle}
              onChange={(e) => handleInputChange('cycle', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px'
              }}
            >
              <option value="m">Monthly</option>
              <option value="q">Quarterly</option>
              <option value="s">Semi-annually</option>
              <option value="a">Annually</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Affiliate ID:</label>
            <input
              type="text"
              value={formData.affiliateId}
              onChange={(e) => handleInputChange('affiliateId', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px'
              }}
            />
          </div>
        </div>

        <button
          onClick={createOrder}
          disabled={loading}
          style={{
            marginTop: '20px',
            padding: '12px 24px',
            backgroundColor: loading ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          {loading ? '⏳ Creating Order...' : '🛒 Create Order'}
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3>⏳ Creating order...</h3>
          <p>Sending request directly to HostBill API...</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#721c24' }}>❌ Error</h3>
          <p style={{ margin: 0, color: '#721c24' }}>{error}</p>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div style={{
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#155724' }}>
            ✅ Order Created via Direct HostBill
          </h3>
          
          <div style={{ marginBottom: '15px', fontSize: '14px', color: '#155724' }}>
            <strong>Source:</strong> direct_hostbill |
            <strong> HostBill URL:</strong> {process.env.NEXT_PUBLIC_HOSTBILL_URL || 'https://vps.kabel1it.cz'} |
            <strong> Timestamp:</strong> {new Date().toLocaleString()}
          </div>

          {result.order_id && (
            <div style={{
              backgroundColor: 'white',
              border: '1px solid #c3e6cb',
              borderRadius: '6px',
              padding: '15px',
              marginBottom: '15px'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#155724' }}>🛒 Order Details</h4>
              <div><strong>Order ID:</strong> {result.order_id}</div>
              {result.order_number && (
                <div><strong>Order Number:</strong> {result.order_number}</div>
              )}
              {result.invoice_id && (
                <div><strong>Invoice ID:</strong> {result.invoice_id}</div>
              )}
              <div><strong>Product:</strong> {formData.productName}</div>
              <div><strong>Price:</strong> {formData.price} CZK</div>
              <div><strong>Cycle:</strong> {formData.cycle}</div>
              {result.affiliate_assigned && (
                <div><strong>Affiliate Assigned:</strong> ✅ Yes (ID: {formData.affiliateId})</div>
              )}
            </div>
          )}

          {result.errors && result.errors.length > 0 && (
            <div style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '6px',
              padding: '15px'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>⚠️ Warnings</h4>
              {result.errors.map((error, index) => (
                <div key={index} style={{ color: '#856404' }}>• {error}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div style={{
        backgroundColor: '#e2e3e5',
        border: '1px solid #d6d8db',
        borderRadius: '8px',
        padding: '15px'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#383d41' }}>ℹ️ Information</h3>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#383d41' }}>
          <li>This test creates a real order directly via HostBill API</li>
          <li>Order includes affiliate assignment using setOrderReferrer</li>
          <li>Uses existing client ID (must exist in HostBill)</li>
          <li>Commission tracking is handled automatically by HostBill</li>
        </ul>
      </div>
    </div>
  );
}
