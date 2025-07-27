import { useState } from 'react';
import Head from 'next/head';

export default function AffiliateOrdersTest() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const testGetOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/hostbill-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          call: 'getOrders',
          params: {}
        })
      });
      
      const data = await response.json();
      setResults(prev => [...prev, {
        method: 'getOrders (všechny)',
        success: data.success,
        data: data,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } catch (error) {
      setResults(prev => [...prev, {
        method: 'getOrders (všechny)',
        success: false,
        error: error.message,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
    setLoading(false);
  };

  const testGetOrdersByAffiliate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/hostbill-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          call: 'getOrders',
          params: {
            'filter[affiliate_id]': '2'  // Test s affiliate ID 2
          }
        })
      });
      
      const data = await response.json();
      setResults(prev => [...prev, {
        method: 'getOrders (affiliate_id=2)',
        success: data.success,
        data: data,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } catch (error) {
      setResults(prev => [...prev, {
        method: 'getOrders (affiliate_id=2)',
        success: false,
        error: error.message,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
    setLoading(false);
  };

  const testGetAffiliateCommissions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/hostbill-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          call: 'getAffiliateCommissions',
          params: {
            id: '2'
          }
        })
      });
      
      const data = await response.json();
      setResults(prev => [...prev, {
        method: 'getAffiliateCommissions (id=2)',
        success: data.success,
        data: data,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } catch (error) {
      setResults(prev => [...prev, {
        method: 'getAffiliateCommissions (id=2)',
        success: false,
        error: error.message,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
    setLoading(false);
  };

  const testGetAffiliate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/hostbill-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          call: 'getAffiliate',
          params: {
            id: '2'
          }
        })
      });
      
      const data = await response.json();
      setResults(prev => [...prev, {
        method: 'getAffiliate (id=2)',
        success: data.success,
        data: data,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } catch (error) {
      setResults(prev => [...prev, {
        method: 'getAffiliate (id=2)',
        success: false,
        error: error.message,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
    setLoading(false);
  };

  const testGetOrderDetails = async () => {
    setLoading(true);
    try {
      // Nejdříve získáme seznam objednávek
      const ordersResponse = await fetch('/api/hostbill-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          call: 'getOrders',
          params: {}
        })
      });
      
      const ordersData = await ordersResponse.json();
      
      if (ordersData.success && ordersData.orders && ordersData.orders.length > 0) {
        // Vezmeme první objednávku pro test
        const firstOrderId = ordersData.orders[0].id;
        
        const response = await fetch('/api/hostbill-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            call: 'getOrderDetails',
            params: {
              id: firstOrderId
            }
          })
        });
        
        const data = await response.json();
        setResults(prev => [...prev, {
          method: `getOrderDetails (id=${firstOrderId})`,
          success: data.success,
          data: data,
          timestamp: new Date().toLocaleTimeString()
        }]);
      } else {
        setResults(prev => [...prev, {
          method: 'getOrderDetails',
          success: false,
          error: 'Žádné objednávky k testování',
          timestamp: new Date().toLocaleTimeString()
        }]);
      }
    } catch (error) {
      setResults(prev => [...prev, {
        method: 'getOrderDetails',
        success: false,
        error: error.message,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
    setLoading(false);
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8f9fa',
      fontFamily: 'Arial, sans-serif'
    }}>
      <Head>
        <title>Affiliate Orders Test - HostBill API</title>
      </Head>

      {/* Header */}
      <header style={{
        backgroundColor: '#343a40',
        color: 'white',
        padding: '20px 0',
        marginBottom: '30px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <h1 style={{ margin: 0, fontSize: '28px' }}>
            🛒 Affiliate Orders Test
          </h1>
          <p style={{ margin: '5px 0 0 0', opacity: 0.8 }}>
            Testování HostBill API pro získání objednávek podle affiliate ID
          </p>
        </div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        
        {/* Test Buttons */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '30px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#343a40' }}>
            🧪 API Test Methods
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
            <button
              onClick={testGetOrders}
              disabled={loading}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: loading ? 0.6 : 1
              }}
            >
              📋 getOrders (všechny)
            </button>

            <button
              onClick={testGetOrdersByAffiliate}
              disabled={loading}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: loading ? 0.6 : 1
              }}
            >
              🎯 getOrders (affiliate_id=2)
            </button>

            <button
              onClick={testGetAffiliateCommissions}
              disabled={loading}
              style={{
                backgroundColor: '#ffc107',
                color: '#212529',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: loading ? 0.6 : 1
              }}
            >
              💰 getAffiliateCommissions
            </button>

            <button
              onClick={testGetAffiliate}
              disabled={loading}
              style={{
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: loading ? 0.6 : 1
              }}
            >
              👤 getAffiliate
            </button>

            <button
              onClick={testGetOrderDetails}
              disabled={loading}
              style={{
                backgroundColor: '#6f42c1',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: loading ? 0.6 : 1
              }}
            >
              📄 getOrderDetails
            </button>

            <button
              onClick={clearResults}
              disabled={loading}
              style={{
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: loading ? 0.6 : 1
              }}
            >
              🗑️ Vymazat výsledky
            </button>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#343a40' }}>
              📊 Test Results ({results.length})
            </h3>
            
            {results.map((result, index) => (
              <div key={index} style={{
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                padding: '15px',
                marginBottom: '15px',
                backgroundColor: result.success ? '#d4edda' : '#f8d7da'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <h4 style={{ margin: 0, color: result.success ? '#155724' : '#721c24' }}>
                    {result.success ? '✅' : '❌'} {result.method}
                  </h4>
                  <span style={{ fontSize: '12px', color: '#6c757d' }}>
                    {result.timestamp}
                  </span>
                </div>
                
                {result.error && (
                  <div style={{
                    color: '#721c24',
                    backgroundColor: '#f5c6cb',
                    padding: '8px',
                    borderRadius: '4px',
                    marginBottom: '10px',
                    fontSize: '14px'
                  }}>
                    <strong>Error:</strong> {result.error}
                  </div>
                )}
                
                <pre style={{
                  backgroundColor: '#f8f9fa',
                  padding: '10px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  overflow: 'auto',
                  maxHeight: '300px',
                  margin: 0
                }}>
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#6c757d'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
            <div>Testování API...</div>
          </div>
        )}
      </div>
    </div>
  );
}
