import { useState } from 'react';
import Head from 'next/head';

export default function AdvancedOrderTest() {
  const [formData, setFormData] = useState({
    // Customer Data
    firstName: 'Jan',
    lastName: 'Novák',
    email: 'jan.novak@example.com',
    phone: '+420123456789',
    address: 'Testovací ulice 123',
    city: 'Praha',
    postalCode: '11000',
    country: 'CZ',
    company: 'Test s.r.o.',
    
    // Product Data
    productId: '1',
    productName: 'VPS Basic',
    price: 299,
    cycle: 'm',
    
    // VPS Configuration
    os: 'linux',
    ram: '4GB',
    cpu: '2',
    storage: '80GB',
    bandwidth: '1TB',
    
    // Add-ons
    addons: {
      backup_daily: false,
      backup_weekly: false,
      ssl_certificate: false,
      monitoring: false
    },
    
    // Affiliate & Payment
    affiliateId: '2',
    paymentMethod: 'banktransfer'
  });
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleInputChange = (field, value) => {
    if (field.startsWith('addons.')) {
      const addonName = field.replace('addons.', '');
      setFormData(prev => ({
        ...prev,
        addons: {
          ...prev.addons,
          [addonName]: value
        }
      }));
    } else {
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

      setFormData(prev => ({ ...prev, ...updates }));
    }
  };

  const calculateTotal = () => {
    let total = formData.price;
    
    // Add addon prices
    if (formData.addons.backup_daily) total += 99;
    if (formData.addons.backup_weekly) total += 49;
    if (formData.addons.ssl_certificate) total += 199;
    if (formData.addons.monitoring) total += 149;
    
    return total;
  };

  const createAdvancedOrder = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🛒 Creating advanced order...');

      // Prepare order data with all configuration
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
        items: [{
          productId: formData.productId,
          name: formData.productName,
          price: formData.price,
          cycle: formData.cycle,
          configOptions: {
            os: formData.os,
            ram: formData.ram,
            cpu: formData.cpu,
            storage: formData.storage,
            bandwidth: formData.bandwidth
          }
        }],
        addons: Object.entries(formData.addons)
          .filter(([_, enabled]) => enabled)
          .map(([name, _]) => ({ name, enabled: true })),
        affiliate: {
          id: formData.affiliateId
        },
        payment: {
          method: formData.paymentMethod,
          total: calculateTotal()
        }
      };

      console.log('📤 Advanced order data:', orderData);

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
        console.log('✅ Advanced order created:', data);
      } else {
        setError(data.error || 'Order creation failed');
        console.error('❌ Advanced order failed:', data);
      }
    } catch (err) {
      setError(err.message);
      console.error('❌ Error creating advanced order:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <Head>
        <title>Advanced Order Test</title>
      </Head>

      <h1>🚀 Advanced Order Test</h1>
      <p>Test pokročilého vytvoření objednávky s kompletní konfigurací</p>

      {/* Customer Information */}
      <div style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#495057' }}>👤 Customer Information</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>First Name:</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Last Name:</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email:</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Phone:</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Company:</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px' }}
            />
          </div>
        </div>
      </div>

      {/* Product Configuration */}
      <div style={{
        backgroundColor: '#e8f5e8',
        border: '1px solid #4caf50',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#2e7d32' }}>🖥️ VPS Configuration</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Product:</label>
            <select
              value={formData.productId}
              onChange={(e) => handleInputChange('productId', e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px' }}
            >
              <option value="1">VPS Basic (299 CZK)</option>
              <option value="2">VPS Pro (499 CZK)</option>
              <option value="3">VPS Premium (899 CZK)</option>
              <option value="4">VPS Enterprise (1299 CZK)</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Operating System:</label>
            <select
              value={formData.os}
              onChange={(e) => handleInputChange('os', e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px' }}
            >
              <option value="linux">Linux (Ubuntu 22.04)</option>
              <option value="windows">Windows Server 2022</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>RAM:</label>
            <select
              value={formData.ram}
              onChange={(e) => handleInputChange('ram', e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px' }}
            >
              <option value="2GB">2GB</option>
              <option value="4GB">4GB</option>
              <option value="8GB">8GB</option>
              <option value="16GB">16GB</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>CPU Cores:</label>
            <select
              value={formData.cpu}
              onChange={(e) => handleInputChange('cpu', e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '4px' }}
            >
              <option value="1">1 Core</option>
              <option value="2">2 Cores</option>
              <option value="4">4 Cores</option>
              <option value="8">8 Cores</option>
            </select>
          </div>
        </div>
      </div>

      {/* Add-ons */}
      <div style={{
        backgroundColor: '#fff3e0',
        border: '1px solid #ff9800',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#f57c00' }}>🔧 Add-ons</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          {[
            { key: 'backup_daily', name: 'Daily Backup', price: 99 },
            { key: 'backup_weekly', name: 'Weekly Backup', price: 49 },
            { key: 'ssl_certificate', name: 'SSL Certificate', price: 199 },
            { key: 'monitoring', name: 'Server Monitoring', price: 149 }
          ].map(addon => (
            <label key={addon.key} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.addons[addon.key]}
                onChange={(e) => handleInputChange(`addons.${addon.key}`, e.target.checked)}
                style={{ marginRight: '10px' }}
              />
              <span>{addon.name} (+{addon.price} CZK)</span>
            </label>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div style={{
        backgroundColor: '#e3f2fd',
        border: '1px solid #2196f3',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#1976d2' }}>💰 Order Summary</h3>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1976d2' }}>
          Total: {calculateTotal()} CZK / month
        </div>
      </div>

      <button
        onClick={createAdvancedOrder}
        disabled={loading}
        style={{
          padding: '15px 30px',
          backgroundColor: loading ? '#6c757d' : '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '18px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {loading ? '⏳ Creating Order...' : '🚀 Create Advanced Order'}
      </button>

      {/* Results */}
      {error && (
        <div style={{ backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#721c24' }}>❌ Error</h3>
          <p style={{ margin: 0, color: '#721c24' }}>{error}</p>
        </div>
      )}

      {result && (
        <div style={{ backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '8px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#155724' }}>✅ Advanced Order Created Successfully</h3>

          {/* Order Summary */}
          {result.summary && (
            <div style={{ backgroundColor: 'white', border: '1px solid #c3e6cb', borderRadius: '6px', padding: '15px', marginBottom: '15px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#155724' }}>📋 Order Summary</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                <div><strong>Customer:</strong> {result.summary.customer}</div>
                <div><strong>Email:</strong> {result.summary.email}</div>
                <div><strong>Products:</strong> {result.summary.products}</div>
                <div><strong>Add-ons:</strong> {result.summary.addons}</div>
                <div><strong>Total:</strong> {result.summary.total} {result.summary.currency}</div>
              </div>
            </div>
          )}

          {/* Processing Details */}
          <div style={{ backgroundColor: 'white', border: '1px solid #c3e6cb', borderRadius: '6px', padding: '15px', marginBottom: '15px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#155724' }}>🔧 Processing Details</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div><strong>Processing ID:</strong> {result.processingId}</div>
              <div><strong>Client ID:</strong> {result.clientId}</div>
              <div><strong>Orders Created:</strong> {result.orders?.length || 0}</div>
              <div><strong>Affiliate:</strong> {result.affiliate ? 'Assigned' : 'None'}</div>
            </div>
          </div>

          {/* Product Mapping */}
          {result.mapping && (
            <div style={{ backgroundColor: 'white', border: '1px solid #c3e6cb', borderRadius: '6px', padding: '15px', marginBottom: '15px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#155724' }}>🔗 Product Mapping</h4>
              <div style={{ fontSize: '14px' }}>
                {Object.entries(result.mapping.productMapping).map(([cloudVps, hostbill]) => (
                  <div key={cloudVps} style={{ marginBottom: '5px' }}>
                    Cloud VPS ID <strong>{cloudVps}</strong> → HostBill ID <strong>{hostbill}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Orders Details */}
          {result.orders && result.orders.length > 0 && (
            <div style={{ backgroundColor: 'white', border: '1px solid #c3e6cb', borderRadius: '6px', padding: '15px', marginBottom: '15px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#155724' }}>📦 Created Orders</h4>
              {result.orders.map((order, index) => (
                <div key={index} style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                  <div><strong>Order ID:</strong> {order.orderId}</div>
                  <div><strong>Product:</strong> {order.productName}</div>
                  <div><strong>Cloud VPS ID:</strong> {order.cloudVpsProductId}</div>
                  <div><strong>HostBill ID:</strong> {order.hostbillProductId}</div>
                  <div><strong>Price:</strong> {order.price} CZK</div>
                </div>
              ))}
            </div>
          )}

          {/* Raw Response (Collapsible) */}
          <details style={{ marginTop: '15px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#155724' }}>
              🔍 View Raw Response
            </summary>
            <pre style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '4px', overflow: 'auto', marginTop: '10px', fontSize: '12px' }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
