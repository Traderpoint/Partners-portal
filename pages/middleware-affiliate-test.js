import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function MiddlewareAffiliateTest() {
  const router = useRouter();
  const [affiliates, setAffiliates] = useState([]);
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [affiliatesLoading, setAffiliatesLoading] = useState(true);
  const [testResults, setTestResults] = useState([]);

  // Load all affiliates on component mount
  useEffect(() => {
    loadAllAffiliates();
  }, []);

  const addTestResult = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, { message, type, timestamp }]);
  };

  const loadAllAffiliates = async () => {
    setAffiliatesLoading(true);
    try {
      console.log('🔍 Loading all affiliates via middleware...');
      addTestResult('🔍 Loading all affiliates via middleware...', 'info');
      
      const response = await fetch('/api/middleware/get-affiliates');
      const result = await response.json();

      if (result.success && result.affiliates) {
        setAffiliates(result.affiliates);
        addTestResult(`✅ Loaded ${result.affiliates.length} affiliates via middleware`, 'success');
        console.log(`✅ Loaded ${result.affiliates.length} affiliates via middleware`);
      } else {
        addTestResult(`❌ Failed to load affiliates: ${result.error}`, 'error');
        console.error('❌ Failed to load affiliates via middleware:', result.error);
      }
    } catch (err) {
      addTestResult(`❌ Error loading affiliates: ${err.message}`, 'error');
      console.error('❌ Error loading affiliates via middleware:', err);
    } finally {
      setAffiliatesLoading(false);
    }
  };

  const testAffiliateDetails = async (affiliateId) => {
    setLoading(true);
    try {
      addTestResult(`🔍 Testing affiliate details for ID: ${affiliateId}`, 'info');
      
      const response = await fetch(`/api/middleware/get-affiliate-products?affiliate_id=${affiliateId}`);
      const result = await response.json();

      if (result.success) {
        setSelectedAffiliate(result);
        addTestResult(`✅ Affiliate details loaded: ${result.affiliate.name}`, 'success');
        addTestResult(`📦 Found ${result.products.length} products with commissions`, 'success');
      } else {
        addTestResult(`❌ Failed to load affiliate details: ${result.error}`, 'error');
      }
    } catch (err) {
      addTestResult(`❌ Error testing affiliate: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const testMiddlewareConnection = async () => {
    try {
      addTestResult('🔍 Testing middleware connection...', 'info');
      
      const response = await fetch('/api/middleware/test-affiliate');
      const result = await response.json();

      if (result.success) {
        addTestResult('✅ Middleware connection successful', 'success');
        addTestResult(`🔗 Middleware URL: ${result.middleware_url}`, 'info');
        
        // Test each endpoint
        Object.entries(result.tests).forEach(([testName, testResult]) => {
          if (testResult.success) {
            addTestResult(`✅ ${testName.replace(/_/g, ' ').toUpperCase()}: OK`, 'success');
          } else {
            addTestResult(`❌ ${testName.replace(/_/g, ' ').toUpperCase()}: Failed`, 'error');
          }
        });
      } else {
        addTestResult(`❌ Middleware connection failed: ${result.error}`, 'error');
      }
    } catch (err) {
      addTestResult(`❌ Middleware connection error: ${err.message}`, 'error');
    }
  };

  const clearTestResults = () => {
    setTestResults([]);
    setSelectedAffiliate(null);
  };

  const formatPrice = (price) => {
    return price && parseFloat(price) > 0 ? `${price} CZK` : 'N/A';
  };

  const formatCommission = (commission) => {
    if (!commission || !commission.rate) return 'N/A';
    
    if (commission.type === 'Percent') {
      return `${commission.rate}%`;
    } else if (commission.type === 'Fixed') {
      return `${commission.rate} CZK`;
    }
    return commission.rate;
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <Head>
        <title>Middleware Affiliate Test</title>
      </Head>

      <h1>🎯 Middleware Affiliate System Test</h1>
      <p>Komplexní test affiliate systému přes middleware na portu 3005</p>

      {/* Test Controls */}
      <div style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>🔧 Test Controls</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={testMiddlewareConnection}
            style={{
              padding: '10px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔍 Test Middleware Connection
          </button>
          <button
            onClick={loadAllAffiliates}
            disabled={affiliatesLoading}
            style={{
              padding: '10px 16px',
              backgroundColor: affiliatesLoading ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: affiliatesLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {affiliatesLoading ? '⏳ Loading...' : '🔄 Reload Affiliates'}
          </button>
          <button
            onClick={clearTestResults}
            style={{
              padding: '10px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🧹 Clear Results
          </button>
        </div>
      </div>

      {/* Affiliates List */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>👥 Available Affiliates</h3>
        {affiliatesLoading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <span>⏳ Loading affiliates...</span>
          </div>
        ) : affiliates.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
            {affiliates.map(affiliate => (
              <div
                key={affiliate.id}
                style={{
                  border: '1px solid #dee2e6',
                  borderRadius: '6px',
                  padding: '15px',
                  backgroundColor: '#f8f9fa',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => testAffiliateDetails(affiliate.id)}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#e9ecef';
                  e.currentTarget.style.borderColor = '#007bff';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                  e.currentTarget.style.borderColor = '#dee2e6';
                }}
              >
                <h4 style={{ margin: '0 0 8px 0', color: '#007bff' }}>
                  #{affiliate.id} - {affiliate.firstname} {affiliate.lastname}
                </h4>
                <div style={{ fontSize: '14px', color: '#6c757d' }}>
                  <div><strong>Status:</strong> {affiliate.status}</div>
                  <div><strong>Visits:</strong> {affiliate.visits || 0}</div>
                  <div><strong>Created:</strong> {affiliate.date_created}</div>
                  {affiliate.companyname && (
                    <div><strong>Company:</strong> {affiliate.companyname}</div>
                  )}
                </div>
                <div style={{ 
                  marginTop: '10px', 
                  padding: '5px 10px', 
                  backgroundColor: '#007bff', 
                  color: 'white', 
                  borderRadius: '4px', 
                  textAlign: 'center',
                  fontSize: '12px'
                }}>
                  Click to test products & commissions
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            ⚠️ No affiliates found
          </div>
        )}
      </div>

      {/* Selected Affiliate Details */}
      {selectedAffiliate && (
        <div style={{
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#155724' }}>
            ✅ Affiliate Details: {selectedAffiliate.affiliate.name}
          </h3>
          
          <div style={{ marginBottom: '15px', fontSize: '14px', color: '#155724' }}>
            <strong>Source:</strong> {selectedAffiliate.source} | 
            <strong> Middleware URL:</strong> {selectedAffiliate.middleware_url} | 
            <strong> Affiliate ID:</strong> {selectedAffiliate.affiliate_id}
          </div>

          {selectedAffiliate.products && selectedAffiliate.products.length > 0 ? (
            <div>
              <h4 style={{ color: '#155724' }}>Products ({selectedAffiliate.products.length}):</h4>
              {selectedAffiliate.products.map((product, index) => (
                <div key={index} style={{
                  backgroundColor: 'white',
                  border: '1px solid #c3e6cb',
                  borderRadius: '6px',
                  padding: '15px',
                  marginBottom: '15px'
                }}>
                  <h5 style={{ margin: '0 0 10px 0', color: '#155724' }}>
                    {product.name} (ID: {product.id})
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                    <div><strong>Monthly:</strong> {formatPrice(product.monthly_price)}</div>
                    <div><strong>Quarterly:</strong> {formatPrice(product.quarterly_price)}</div>
                    <div><strong>Annually:</strong> {formatPrice(product.annually_price)}</div>
                    <div><strong>Commission:</strong> {formatCommission(product.commission)}</div>
                  </div>
                  {product.description && (
                    <div style={{ marginTop: '10px', fontSize: '14px', color: '#6c757d' }}>
                      {product.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#155724' }}>No products found for this affiliate.</p>
          )}
        </div>
      )}

      {/* Test Results */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '20px'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>📋 Test Results</h3>
        {testResults.length > 0 ? (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {testResults.map((result, index) => (
              <div
                key={index}
                style={{
                  padding: '8px 12px',
                  marginBottom: '5px',
                  borderRadius: '4px',
                  backgroundColor: 
                    result.type === 'success' ? '#d4edda' :
                    result.type === 'error' ? '#f8d7da' : '#e2e3e5',
                  borderLeft: `4px solid ${
                    result.type === 'success' ? '#28a745' :
                    result.type === 'error' ? '#dc3545' : '#6c757d'
                  }`
                }}
              >
                <span style={{ fontSize: '12px', color: '#6c757d' }}>[{result.timestamp}]</span>
                <span style={{ marginLeft: '10px' }}>{result.message}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
            No test results yet. Click the test buttons above to start testing.
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{
        backgroundColor: '#e2e3e5',
        border: '1px solid #d6d8db',
        borderRadius: '8px',
        padding: '15px',
        marginTop: '20px'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#383d41' }}>ℹ️ Information</h3>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#383d41' }}>
          <li>This test uses middleware API instead of direct HostBill calls</li>
          <li>Middleware server must be running on port 3005</li>
          <li>Click on any affiliate to test their products and commissions</li>
          <li>All tests are performed through the middleware layer</li>
        </ul>
      </div>
    </div>
  );
}
