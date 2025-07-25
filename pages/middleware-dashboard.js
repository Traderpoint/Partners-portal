import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function MiddlewareDashboard() {
  const [status, setStatus] = useState(null);
  const [mapping, setMapping] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const middlewareUrl = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:3005';

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('📊 Loading middleware dashboard data...');

      // Load multiple endpoints in parallel
      const [healthResponse, mappingResponse] = await Promise.all([
        fetch(`${middlewareUrl}/health`).catch(() => ({ ok: false })),
        fetch('/api/middleware/get-product-mapping').catch(() => ({ ok: false }))
      ]);

      // Process health status
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setStatus({
          online: true,
          ...healthData
        });
      } else {
        setStatus({
          online: false,
          error: 'Middleware server not responding'
        });
      }

      // Process product mapping
      if (mappingResponse.ok) {
        const mappingData = await mappingResponse.json();
        setMapping(mappingData);
      }

      // Set config info
      setConfig({
        middlewareUrl,
        port: '3005',
        environment: 'development'
      });

      setLastUpdate(new Date());
      console.log('✅ Dashboard data loaded successfully');

    } catch (err) {
      setError(err.message);
      console.error('❌ Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (!status) return '#6c757d';
    return status.online ? '#28a745' : '#dc3545';
  };

  const getStatusText = () => {
    if (!status) return 'Loading...';
    return status.online ? 'Online' : 'Offline';
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <Head>
        <title>Middleware Dashboard</title>
      </Head>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: '0 0 5px 0' }}>🎛️ Middleware Dashboard</h1>
          <p style={{ margin: 0, color: '#666' }}>Monitoring a správa HostBill Order Middleware</p>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <button
            onClick={loadDashboardData}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: loading ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '10px'
            }}
          >
            {loading ? '⏳ Refreshing...' : '🔄 Refresh'}
          </button>
          {lastUpdate && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              Last update: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {/* Status Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        
        {/* Server Status */}
        <div style={{
          backgroundColor: 'white',
          border: `2px solid ${getStatusColor()}`,
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: getStatusColor() }}>
            🖥️ Server Status
          </h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: getStatusColor(), marginBottom: '10px' }}>
            {getStatusText()}
          </div>
          {status && (
            <div style={{ fontSize: '14px', color: '#666' }}>
              <div>Port: {status.port || '3005'}</div>
              <div>Version: {status.version || '1.0.0'}</div>
              {status.timestamp && (
                <div>Uptime: {new Date(status.timestamp).toLocaleString()}</div>
              )}
            </div>
          )}
        </div>

        {/* Product Mapping */}
        <div style={{
          backgroundColor: 'white',
          border: '2px solid #9c27b0',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#9c27b0' }}>
            🔗 Product Mapping
          </h3>
          {mapping ? (
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9c27b0', marginBottom: '10px' }}>
                {mapping.totalMappings} Products
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                <div>Cloud VPS: {mapping.cloudVpsProducts?.length || 0}</div>
                <div>HostBill: {mapping.hostbillProducts?.length || 0}</div>
                <div>Status: Active</div>
              </div>
            </div>
          ) : (
            <div style={{ color: '#666' }}>Loading mapping data...</div>
          )}
        </div>

        {/* Configuration */}
        <div style={{
          backgroundColor: 'white',
          border: '2px solid #ff9800',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#ff9800' }}>
            ⚙️ Configuration
          </h3>
          {config && (
            <div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ff9800', marginBottom: '10px' }}>
                Development
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                <div>URL: {config.middlewareUrl}</div>
                <div>Port: {config.port}</div>
                <div>Environment: {config.environment}</div>
              </div>
            </div>
          )}
        </div>

        {/* API Health */}
        <div style={{
          backgroundColor: 'white',
          border: '2px solid #4caf50',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#4caf50' }}>
            🔌 API Health
          </h3>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#4caf50', marginBottom: '10px' }}>
            {status?.online ? 'Healthy' : 'Unhealthy'}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            <div>HostBill API: {status?.online ? 'Connected' : 'Disconnected'}</div>
            <div>Order Processing: {status?.online ? 'Available' : 'Unavailable'}</div>
            <div>Product Sync: {mapping ? 'Active' : 'Inactive'}</div>
          </div>
        </div>
      </div>

      {/* Product Mapping Details */}
      {mapping && (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#495057' }}>🔗 Product Mapping Details</h3>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>
                    Cloud VPS ID
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>
                    Cloud VPS Name
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>
                    HostBill ID
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>
                    HostBill Name
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(mapping.mappings || {}).map(([cloudVpsId, hostbillId]) => (
                  <tr key={cloudVpsId}>
                    <td style={{ padding: '10px', border: '1px solid #dee2e6', fontWeight: 'bold', color: '#007bff' }}>
                      {cloudVpsId}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                      {getCloudVpsProductName(cloudVpsId)}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #dee2e6', fontWeight: 'bold', color: '#28a745' }}>
                      {hostbillId}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                      {getHostBillProductName(hostbillId)}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        backgroundColor: '#d4edda', 
                        color: '#155724',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        ✅ Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#495057' }}>⚡ Quick Actions</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <a
            href="/middleware-order-test"
            style={{
              display: 'block',
              padding: '15px',
              backgroundColor: '#e8f5e8',
              border: '1px solid #4caf50',
              borderRadius: '6px',
              textDecoration: 'none',
              color: '#2e7d32',
              textAlign: 'center',
              transition: 'all 0.2s'
            }}
          >
            🛒 Test Order Processing
          </a>
          
          <a
            href="/product-mapping-test"
            style={{
              display: 'block',
              padding: '15px',
              backgroundColor: '#f3e5f5',
              border: '1px solid #9c27b0',
              borderRadius: '6px',
              textDecoration: 'none',
              color: '#7b1fa2',
              textAlign: 'center',
              transition: 'all 0.2s'
            }}
          >
            🔗 Check Product Mapping
          </a>
          
          <a
            href="/middleware-affiliate-products"
            style={{
              display: 'block',
              padding: '15px',
              backgroundColor: '#fff3e0',
              border: '1px solid #ff9800',
              borderRadius: '6px',
              textDecoration: 'none',
              color: '#f57c00',
              textAlign: 'center',
              transition: 'all 0.2s'
            }}
          >
            👥 Affiliate Products
          </a>
          
          <a
            href="/advanced-order-test"
            style={{
              display: 'block',
              padding: '15px',
              backgroundColor: '#e3f2fd',
              border: '1px solid #2196f3',
              borderRadius: '6px',
              textDecoration: 'none',
              color: '#1976d2',
              textAlign: 'center',
              transition: 'all 0.2s'
            }}
          >
            🚀 Advanced Order Test
          </a>
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

      {/* Footer Info */}
      <div style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '15px',
        fontSize: '14px',
        color: '#666'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>ℹ️ System Information</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px' }}>
          <div><strong>Middleware URL:</strong> {middlewareUrl}</div>
          <div><strong>Auto-refresh:</strong> Every 30 seconds</div>
          <div><strong>Dashboard Version:</strong> 1.0.0</div>
          <div><strong>Last Check:</strong> {lastUpdate ? lastUpdate.toLocaleString() : 'Never'}</div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getCloudVpsProductName(id) {
  const names = {
    '1': 'VPS Basic',
    '2': 'VPS Pro',
    '3': 'VPS Premium',
    '4': 'VPS Enterprise'
  };
  return names[id] || 'Unknown Product';
}

function getHostBillProductName(id) {
  const names = {
    '5': 'VPS Start',
    '10': 'VPS Profi',
    '11': 'VPS Premium',
    '12': 'VPS Enterprise'
  };
  return names[id] || 'Unknown Product';
}
