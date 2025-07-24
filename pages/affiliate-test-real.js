import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function AffiliateTestReal() {
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [affiliateData, setAffiliateData] = useState(null);

  // Detekce affiliate parametrů z URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const affid = urlParams.get('affid') || urlParams.get('aff');
    
    if (affid) {
      setAffiliateData({
        id: affid,
        detected: true,
        timestamp: new Date().toISOString()
      });

      // Automaticky spustit tracking test
      handleTrackingTest(affid);
    }
  }, []);

  const handleTrackingTest = async (affiliateId) => {
    setLoading(true);
    try {
      // Test new affiliate tracking endpoint
      const trackingResponse = await fetch('/api/hostbill/affiliate-tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aff: affiliateId,
          action: 'visit',
          url: window.location.href,
          referrer: document.referrer || 'direct',
          timestamp: Date.now()
        }),
      });

      const trackingResult = await trackingResponse.json();

      // Store affiliate data in cookie if successful
      if (trackingResult.success && trackingResult.cookie_data) {
        document.cookie = `${trackingResult.cookie_data.name}=${trackingResult.cookie_data.value}; max-age=${trackingResult.cookie_data.expires * 24 * 60 * 60}; path=/`;
      }

      setTestResults(trackingResult);
    } catch (error) {
      setTestResults({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApiTest = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/hostbill/test-affiliate-api');
      const result = await response.json();
      setTestResults(result);
    } catch (error) {
      setTestResults({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProductsTest = async () => {
    if (!affiliateData?.id) {
      alert('Nejprve navštivte stránku s affiliate parametrem (?affid=1 nebo ?affid=2)');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/hostbill/products?affiliate_id=${affiliateData.id}`);
      const result = await response.json();
      setTestResults(result);
    } catch (error) {
      setTestResults({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOrderTest = async () => {
    if (!affiliateData?.id) {
      alert('Nejprve navštivte stránku s affiliate parametrem (?affid=1 nebo ?affid=2)');
      return;
    }

    setLoading(true);
    try {
      // Simulate order creation
      const response = await fetch('/api/hostbill/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: '1', // Test client ID
          product_id: '1', // Test product ID
          cycle: 'm', // Monthly
          affiliate_id: affiliateData.id
        }),
      });

      const result = await response.json();
      setTestResults(result);
    } catch (error) {
      setTestResults({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <Head>
        <title>HostBill Affiliate Test - Reálné ID</title>
      </Head>

      <h1>🧪 HostBill Affiliate Test - Reálné ID</h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f8ff', border: '1px solid #0066cc', borderRadius: '5px' }}>
        <h2>📋 Test Links:</h2>
        <p><strong>Affiliate ID 1:</strong> <a href="?affid=1" style={{ color: '#0066cc' }}>?affid=1</a></p>
        <p><strong>Affiliate ID 2:</strong> <a href="?affid=2" style={{ color: '#0066cc' }}>?affid=2</a></p>
        <p><strong>HostBill Format:</strong> <a href="https://vps.kabel1it.cz/?affid=1" target="_blank" style={{ color: '#0066cc' }}>https://vps.kabel1it.cz/?affid=1</a></p>
      </div>

      {affiliateData && (
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0fff0', border: '1px solid #00cc66', borderRadius: '5px' }}>
          <h2>✅ Affiliate Detected</h2>
          <p><strong>ID:</strong> {affiliateData.id}</p>
          <p><strong>Detected:</strong> {affiliateData.detected ? 'Yes' : 'No'}</p>
          <p><strong>Timestamp:</strong> {affiliateData.timestamp}</p>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={handleApiTest}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {loading ? '⏳ Testing...' : '🧪 Test HostBill API'}
        </button>

        {affiliateData && (
          <>
            <button
              onClick={() => handleTrackingTest(affiliateData.id)}
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: '#00cc66',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginRight: '10px'
              }}
            >
              {loading ? '⏳ Tracking...' : '📊 Test Tracking'}
            </button>

            <button
              onClick={handleProductsTest}
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: '#ff6600',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginRight: '10px'
              }}
            >
              {loading ? '⏳ Loading...' : '🛍️ Test Products'}
            </button>

            <button
              onClick={handleOrderTest}
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: '#cc0066',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '⏳ Creating...' : '🛒 Test Order'}
            </button>
          </>
        )}
      </div>

      {testResults && (
        <div style={{ marginTop: '20px' }}>
          <h2>📊 Test Results</h2>
          <div style={{ 
            padding: '15px', 
            backgroundColor: testResults.success ? '#f0fff0' : '#fff0f0', 
            border: `1px solid ${testResults.success ? '#00cc66' : '#cc0066'}`, 
            borderRadius: '5px',
            maxHeight: '600px',
            overflow: 'auto'
          }}>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#fffacd', border: '1px solid #ffd700', borderRadius: '5px' }}>
        <h2>📝 Test Instructions</h2>
        <ol>
          <li><strong>Klikněte na test linky výše</strong> pro simulaci affiliate návštěvy</li>
          <li><strong>Zkontrolujte detekci</strong> affiliate parametrů</li>
          <li><strong>Otestujte API calls</strong> pro ověření HostBill komunikace</li>
          <li><strong>Ověřte tracking</strong> funkcionalitu</li>
        </ol>
        
        <h3>🎯 Expected Results:</h3>
        <ul>
          <li>✅ <strong>Affiliate ID detekce</strong> z URL parametrů (?affid=1, ?affid=2)</li>
          <li>✅ <strong>HostBill API verification</strong> - ověření existence affiliate</li>
          <li>✅ <strong>Pixel tracking</strong> - spolehlivé tracking návštěv</li>
          <li>✅ <strong>Cookie storage</strong> - uložení affiliate data na 30 dní</li>
          <li>✅ <strong>Products API</strong> - produkty s affiliate provizemi</li>
          <li>✅ <strong>Order creation</strong> - objednávka s přiřazeným affiliate</li>
        </ul>

        <h3>🔧 Available Endpoints:</h3>
        <ul>
          <li><code>/api/hostbill/affiliate-tracking</code> - Správný affiliate tracking</li>
          <li><code>/api/hostbill/products</code> - Produkty s affiliate info</li>
          <li><code>/api/hostbill/create-order</code> - Objednávka s affiliate</li>
          <li><code>/api/hostbill/test-affiliate-api</code> - API connectivity test</li>
        </ul>
      </div>
    </div>
  );
}
