import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function HostBillModulesTest() {
  const router = useRouter();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiInfo, setApiInfo] = useState(null);

  useEffect(() => {
    loadHostBillModules();
  }, []);

  const loadHostBillModules = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading HostBill payment modules...');
      const response = await fetch('/api/hostbill/payment-modules');
      const data = await response.json();

      if (data.success) {
        setModules(data.modules || []);
        setApiInfo(data.apiInfo);
        console.log('✅ HostBill modules loaded:', data.modules);
      } else {
        throw new Error(data.error || 'Failed to load HostBill modules');
      }
    } catch (err) {
      console.error('❌ Error loading HostBill modules:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getModuleStatusColor = (module) => {
    if (module.enabled) {
      return module.known ? '#28a745' : '#ffc107';
    }
    return '#dc3545';
  };

  const getModuleStatusIcon = (module) => {
    if (module.enabled) {
      return module.known ? '✅' : '⚠️';
    }
    return '❌';
  };

  const getModuleStatusText = (module) => {
    if (module.enabled) {
      return module.known ? 'Active & Mapped' : 'Active (Unknown)';
    }
    return 'Inactive';
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <Head>
        <title>HostBill Payment Modules - Cloud VPS</title>
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

      <h1>🏢 HostBill Payment Modules</h1>
      <p>Skutečné aktivní platební moduly načtené z HostBill API</p>

      {/* API Info */}
      {apiInfo && (
        <div style={{
          backgroundColor: '#e3f2fd',
          border: '1px solid #2196f3',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>🔌 API Information:</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#1976d2' }}>
            <li><strong>getPaymentModules Available:</strong> {apiInfo.hasGetPaymentModules ? '✅ Yes' : '❌ No'}</li>
            <li><strong>Server Time:</strong> {new Date(apiInfo.serverTime * 1000).toLocaleString()}</li>
            <li><strong>Data Source:</strong> HostBill API (getPaymentModules)</li>
          </ul>
        </div>
      )}

      {/* Refresh Button */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={loadHostBillModules}
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
          {loading ? '🔄 Loading...' : '🔄 Refresh HostBill Modules'}
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

      {/* Modules Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {modules.map((module) => {
          const statusColor = getModuleStatusColor(module);
          
          return (
            <div
              key={module.id}
              style={{
                backgroundColor: 'white',
                border: `2px solid ${statusColor}`,
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                <span style={{ fontSize: '24px', marginRight: '10px' }}>{module.icon}</span>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, color: '#495057' }}>{module.name}</h3>
                  <small style={{ color: '#6c757d' }}>
                    Module ID: {module.id} | Method: {module.method}
                  </small>
                </div>
                <div style={{
                  padding: '4px 8px',
                  backgroundColor: statusColor,
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {getModuleStatusIcon(module)} {getModuleStatusText(module)}
                </div>
              </div>

              <div style={{ marginBottom: '15px', fontSize: '14px' }}>
                <div><strong>HostBill Module ID:</strong> {module.hostbillModuleId}</div>
                <div><strong>Payment Method:</strong> {module.method}</div>
                <div><strong>Type:</strong> {module.type}</div>
                <div><strong>Source:</strong> {module.source}</div>
                <div><strong>Known Mapping:</strong> {module.known ? '✅ Yes' : '❌ No'}</div>
                {module.enabled && (
                  <div style={{ color: '#28a745' }}>
                    <strong>Status:</strong> ✅ Active in HostBill
                  </div>
                )}
              </div>

              {!module.known && module.enabled && (
                <div style={{
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffeaa7',
                  borderRadius: '4px',
                  padding: '10px',
                  marginBottom: '15px',
                  fontSize: '14px'
                }}>
                  <strong>⚠️ Unknown Module:</strong> This module is active in HostBill but not mapped in our system. 
                  Custom integration may be required.
                </div>
              )}

              <div style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                padding: '10px',
                fontSize: '12px'
              }}>
                <strong>Integration Status:</strong><br/>
                {module.enabled ? (
                  module.known ? (
                    <span style={{ color: '#28a745' }}>
                      ✅ Ready for use - Module is active and properly mapped
                    </span>
                  ) : (
                    <span style={{ color: '#ffc107' }}>
                      ⚠️ Requires attention - Active but unknown module type
                    </span>
                  )
                ) : (
                  <span style={{ color: '#dc3545' }}>
                    ❌ Not available - Module not active in HostBill
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modules.length === 0 && !loading && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          color: '#6c757d'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>🏢</div>
          <div>No HostBill payment modules found</div>
        </div>
      )}

      {/* Summary */}
      {modules.length > 0 && (
        <div style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>📊 Modules Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', color: '#28a745' }}>
                {modules.filter(m => m.enabled && m.known).length}
              </div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>Active & Mapped</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', color: '#ffc107' }}>
                {modules.filter(m => m.enabled && !m.known).length}
              </div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>Active (Unknown)</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', color: '#dc3545' }}>
                {modules.filter(m => !m.enabled).length}
              </div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>Inactive</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', color: '#007bff' }}>
                {modules.length}
              </div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>Total</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
