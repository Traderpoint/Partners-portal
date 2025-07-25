import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function ProductMappingTest() {
  const [mappingData, setMappingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadMapping = async () => {
    setLoading(true);
    setError(null);
    setMappingData(null);

    try {
      console.log('🔍 Loading product mapping from middleware...');
      
      const response = await fetch('/api/middleware/get-product-mapping');
      const result = await response.json();

      if (result.success) {
        setMappingData(result);
        console.log('✅ Product mapping loaded:', result);
      } else {
        setError(result.error || 'Failed to load product mapping');
        console.error('❌ Failed to load product mapping:', result);
      }
    } catch (err) {
      setError(err.message);
      console.error('❌ Error loading product mapping:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMapping();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <Head>
        <title>Product Mapping Test</title>
      </Head>

      <h1>🔗 Product Mapping Test</h1>
      <p>Test mapování produktů mezi Cloud VPS a HostBill</p>

      {/* Control Panel */}
      <div style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>🔧 Controls</h3>
        
        <button
          onClick={loadMapping}
          disabled={loading}
          style={{
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
          {loading ? '⏳ Loading...' : '🔄 Reload Mapping'}
        </button>

        <div style={{ marginTop: '15px', fontSize: '14px', color: '#6c757d' }}>
          <strong>Middleware URL:</strong> {process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:3005'}
        </div>
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
          <h3>⏳ Loading product mapping...</h3>
          <p>Fetching data from middleware API...</p>
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
      {mappingData && (
        <div style={{
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#155724' }}>
            ✅ Product Mapping Loaded
          </h3>
          
          <div style={{ marginBottom: '15px', fontSize: '14px', color: '#155724' }}>
            <strong>Total Mappings:</strong> {mappingData.totalMappings} |
            <strong> Timestamp:</strong> {new Date(mappingData.timestamp).toLocaleString()}
          </div>

          {/* Mapping Table */}
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #c3e6cb',
            borderRadius: '6px',
            padding: '15px',
            marginBottom: '15px'
          }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#155724' }}>🔗 Product Mappings</h4>
            
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ 
                    padding: '12px', 
                    textAlign: 'left', 
                    border: '1px solid #dee2e6',
                    fontWeight: 'bold'
                  }}>
                    Cloud VPS ID
                  </th>
                  <th style={{ 
                    padding: '12px', 
                    textAlign: 'left', 
                    border: '1px solid #dee2e6',
                    fontWeight: 'bold'
                  }}>
                    HostBill ID
                  </th>
                  <th style={{ 
                    padding: '12px', 
                    textAlign: 'left', 
                    border: '1px solid #dee2e6',
                    fontWeight: 'bold'
                  }}>
                    Product Name
                  </th>
                  <th style={{ 
                    padding: '12px', 
                    textAlign: 'left', 
                    border: '1px solid #dee2e6',
                    fontWeight: 'bold'
                  }}>
                    Direction
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(mappingData.mappings).map(([cloudVpsId, hostbillId]) => (
                  <tr key={cloudVpsId}>
                    <td style={{ 
                      padding: '10px', 
                      border: '1px solid #dee2e6',
                      fontWeight: 'bold',
                      color: '#007bff'
                    }}>
                      {cloudVpsId}
                    </td>
                    <td style={{ 
                      padding: '10px', 
                      border: '1px solid #dee2e6',
                      fontWeight: 'bold',
                      color: '#28a745'
                    }}>
                      {hostbillId}
                    </td>
                    <td style={{ 
                      padding: '10px', 
                      border: '1px solid #dee2e6'
                    }}>
                      {getProductName(cloudVpsId)}
                    </td>
                    <td style={{ 
                      padding: '10px', 
                      border: '1px solid #dee2e6',
                      textAlign: 'center'
                    }}>
                      <span style={{ 
                        fontSize: '16px',
                        color: '#6c757d'
                      }}>
                        →
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Statistics */}
          <div style={{
            backgroundColor: '#fff3e0',
            border: '1px solid #ff9800',
            borderRadius: '6px',
            padding: '15px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#f57c00' }}>📊 Statistics</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div><strong>Total Mappings:</strong> {mappingData.totalMappings}</div>
              <div><strong>Cloud VPS Products:</strong> {mappingData.cloudVpsProducts?.length || 0}</div>
              <div><strong>HostBill Products:</strong> {mappingData.hostbillProducts?.length || 0}</div>
            </div>
          </div>
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
          <li>Product mapping je uložen v middleware .env souboru</li>
          <li>Cloud VPS používá interní ID (1, 2, 3, 4)</li>
          <li>HostBill používá skutečné product ID (10, 11, 12, 5)</li>
          <li>Middleware automaticky mapuje Cloud VPS ID na HostBill ID</li>
        </ul>
      </div>
    </div>
  );
}

function getProductName(cloudVpsId) {
  const names = {
    '1': 'VPS Basic',
    '2': 'VPS Pro', 
    '3': 'VPS Premium',
    '4': 'VPS Enterprise'
  };
  return names[cloudVpsId] || 'Unknown Product';
}
