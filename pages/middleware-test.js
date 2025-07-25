import { useState } from 'react';
import Head from 'next/head';

export default function MiddlewareTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🔍 Running middleware test...');
      const response = await fetch('/api/middleware/test-affiliate');
      const data = await response.json();

      if (data.success) {
        setResult(data);
        console.log('✅ Middleware test completed:', data);
      } else {
        setError(data.error || 'Test failed');
        console.error('❌ Middleware test failed:', data);
      }
    } catch (err) {
      setError(err.message);
      console.error('❌ Error running middleware test:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <Head>
        <title>Middleware Test</title>
      </Head>

      <h1>🔗 Middleware Test</h1>
      <p>Test komunikace s middleware serverem na portu 3005</p>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={runTest}
          disabled={loading}
          style={{
            padding: '12px 24px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {loading ? '⏳ Testování...' : '🚀 Spustit Test'}
        </button>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#721c24' }}>❌ Chyba</h3>
          <p style={{ margin: 0, color: '#721c24' }}>{error}</p>
        </div>
      )}

      {result && (
        <div style={{
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '4px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#155724' }}>✅ Test Results</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <strong>Middleware URL:</strong> {result.middleware_url}
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <strong>Timestamp:</strong> {new Date(result.timestamp).toLocaleString()}
          </div>

          <h4 style={{ color: '#155724' }}>Test Results:</h4>
          
          {Object.entries(result.tests).map(([testName, testResult]) => (
            <div key={testName} style={{
              backgroundColor: testResult.success ? '#d1ecf1' : '#f8d7da',
              border: `1px solid ${testResult.success ? '#bee5eb' : '#f5c6cb'}`,
              borderRadius: '4px',
              padding: '10px',
              marginBottom: '10px'
            }}>
              <h5 style={{ 
                margin: '0 0 8px 0', 
                color: testResult.success ? '#0c5460' : '#721c24' 
              }}>
                {testResult.success ? '✅' : '❌'} {testName.replace(/_/g, ' ').toUpperCase()}
              </h5>
              <div><strong>Status:</strong> {testResult.status}</div>
              <div><strong>Success:</strong> {testResult.success ? 'Yes' : 'No'}</div>
              {testResult.data && (
                <details style={{ marginTop: '8px' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                    View Response Data
                  </summary>
                  <pre style={{
                    backgroundColor: '#f8f9fa',
                    padding: '10px',
                    borderRadius: '4px',
                    overflow: 'auto',
                    fontSize: '12px',
                    marginTop: '8px'
                  }}>
                    {JSON.stringify(testResult.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{
        backgroundColor: '#e2e3e5',
        border: '1px solid #d6d8db',
        borderRadius: '4px',
        padding: '15px',
        marginTop: '20px'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#383d41' }}>ℹ️ Informace</h3>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#383d41' }}>
          <li>Middleware server musí běžet na portu 3005</li>
          <li>Test ověřuje health check, affiliate info a produkty</li>
          <li>Všechny testy by měly být úspěšné pro správnou funkcionalnost</li>
        </ul>
      </div>
    </div>
  );
}
