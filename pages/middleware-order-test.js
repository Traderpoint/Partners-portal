import { useState } from 'react';
import Head from 'next/head';

export default function MiddlewareOrderTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    firstName: 'Jan',
    lastName: 'Novák',
    email: 'jan.novak7@example.com',
    phone: '+420123456789',
    address: 'Testovací ulice 123',
    city: 'Praha',
    postalCode: '11000',
    country: 'CZ',
    company: 'Test s.r.o.',
    productId: '1',
    productName: 'VPS Basic',
    price: 299,
    cycle: 'm',
    affiliateId: '2',
    affiliateCode: 'test-affiliate',
    paymentMethod: 'banktransfer'
  });

  const handleInputChange = (field, value) => {
    let updates = { [field]: value };

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

    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  };

  const createTestOrder = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🛒 Creating test order via middleware...');
      console.log('🔍 Sending order with product ID:', formData.productId);

      const orderData = {
        customer: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country,
          company: formData.company
        },
        items: [
          {
            productId: formData.productId,
            name: formData.productName,
            price: parseFloat(formData.price),
            cycle: formData.cycle,
            quantity: 1,
            configOptions: {
              ram: '4GB',
              cpu: '2',
              storage: '50GB'
            }
          }
        ],
        affiliate: {
          id: formData.affiliateId,
          code: formData.affiliateCode
        },
        paymentMethod: formData.paymentMethod,
        newsletterSubscribe: false
      };

      console.log('Order data:', orderData);

      const response = await fetch('/api/middleware/create-test-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        console.log('✅ Test order created via middleware:', data);
      } else {
        setError(data.error || 'Order creation failed');
        console.error('❌ Test order failed via middleware:', data);
      }
    } catch (err) {
      setError(err.message);
      console.error('❌ Error creating test order via middleware:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <Head>
        <title>Middleware Order Test</title>
      </Head>

      <h1>🛒 Middleware Order Test</h1>
      <p>Test vytvoření objednávky přes middleware na portu 3005</p>

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
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              First Name:
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Last Name:
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Email:
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Product ID:
            </label>
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
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Price (CZK):
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Affiliate ID:
            </label>
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

        <div style={{ marginTop: '20px' }}>
          <button
            onClick={createTestOrder}
            disabled={loading}
            style={{
              padding: '12px 24px',
              backgroundColor: loading ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            {loading ? '⏳ Creating Order...' : '🚀 Create Test Order'}
          </button>
        </div>
      </div>

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
            ✅ Order Created via Middleware
          </h3>
          
          <div style={{ marginBottom: '15px', fontSize: '14px', color: '#155724' }}>
            <strong>Source:</strong> {result.source} |
            <strong> Middleware URL:</strong> {result.middleware_url} |
            <strong> Processing ID:</strong> {result.processingId}
            {result.orders && result.orders.length > 0 && result.orders[0].orderNumber && (
              <span> | <strong> Order Number:</strong> {result.orders[0].orderNumber}</span>
            )}
            {typeof result.affiliateAssigned !== 'undefined' && (
              <span> | <strong> Affiliate Assigned:</strong> {result.affiliateAssigned ? '✅ Yes' : '❌ No'}</span>
            )}
          </div>

          {result.clientId && (
            <div style={{
              backgroundColor: 'white',
              border: '1px solid #c3e6cb',
              borderRadius: '6px',
              padding: '15px',
              marginBottom: '15px'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#155724' }}>👤 Client</h4>
              <div><strong>ID:</strong> {result.clientId}</div>
              <div><strong>Name:</strong> {formData.firstName} {formData.lastName}</div>
              <div><strong>Email:</strong> {formData.email}</div>
              <div><strong>Company:</strong> {formData.company || 'N/A'}</div>
            </div>
          )}

          {result.affiliate && (
            <div style={{
              backgroundColor: 'white',
              border: '1px solid #c3e6cb',
              borderRadius: '6px',
              padding: '15px',
              marginBottom: '15px'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#155724' }}>👥 Affiliate</h4>
              <div><strong>ID:</strong> {result.affiliate.id}</div>
              <div><strong>Name:</strong> {result.affiliate.name}</div>
              <div><strong>Status:</strong> {result.affiliate.status}</div>
            </div>
          )}

          {result.orders && result.orders.length > 0 && (
            <div style={{
              backgroundColor: 'white',
              border: '1px solid #c3e6cb',
              borderRadius: '6px',
              padding: '15px',
              marginBottom: '15px'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#155724' }}>🛒 Orders ({result.orders.length})</h4>
              {result.orders.map((order, index) => (
                <div key={index} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #e9ecef' }}>
                  <div><strong>Order ID:</strong> {order.orderId}</div>
                  {order.orderNumber && (
                    <div><strong>Order Number:</strong> {order.orderNumber}</div>
                  )}
                  <div><strong>Invoice ID:</strong> {order.invoiceId}</div>
                  <div><strong>Product:</strong> {order.productName}</div>
                  <div><strong>Price:</strong> {order.price} CZK</div>
                  <div><strong>Status:</strong> {order.status}</div>
                </div>
              ))}
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
                <div key={index} style={{ color: '#856404' }}>{error}</div>
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
          <li>This test creates a real order via middleware</li>
          <li>Middleware server must be running on port 3005</li>
          <li>Order includes affiliate assignment and commission tracking</li>
          <li>Client will be automatically assigned to the specified affiliate</li>
        </ul>
      </div>
    </div>
  );
}
