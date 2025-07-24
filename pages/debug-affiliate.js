import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function DebugAffiliate() {
  const [debugInfo, setDebugInfo] = useState({});
  const [clearResult, setClearResult] = useState(null);

  useEffect(() => {
    // Get all affiliate-related data
    const getDebugInfo = () => {
      const info = {
        cookies: {},
        localStorage: {},
        sessionStorage: {},
        urlParams: {}
      };

      // Get cookies
      if (typeof document !== 'undefined') {
        document.cookie.split(';').forEach(cookie => {
          const [name, value] = cookie.trim().split('=');
          if (name.includes('affiliate') || name.includes('hb_') || name.includes('aff')) {
            info.cookies[name] = value;
          }
        });

        // Get localStorage
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('affiliate') || key.includes('cart') || key.includes('hb_'))) {
              info.localStorage[key] = localStorage.getItem(key);
            }
          }
        } catch (e) {
          info.localStorage.error = e.message;
        }

        // Get sessionStorage
        try {
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && (key.includes('affiliate') || key.includes('cart') || key.includes('hb_'))) {
              info.sessionStorage[key] = sessionStorage.getItem(key);
            }
          }
        } catch (e) {
          info.sessionStorage.error = e.message;
        }

        // Get URL params
        const urlParams = new URLSearchParams(window.location.search);
        for (const [key, value] of urlParams.entries()) {
          if (key.includes('aff') || key.includes('affiliate')) {
            info.urlParams[key] = value;
          }
        }
      }

      return info;
    };

    setDebugInfo(getDebugInfo());
  }, []);

  const clearAllAffiliateData = async () => {
    try {
      // Clear localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('affiliate_data');
        localStorage.removeItem('cart');
        localStorage.removeItem('hb_affiliate_data');
        localStorage.removeItem('hb_conversion_data');
      }

      // Clear sessionStorage
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('affiliate_data');
        sessionStorage.removeItem('cart');
        sessionStorage.removeItem('hb_affiliate_data');
      }

      // Clear cookies via API
      const response = await fetch('/api/clear-affiliate-data', {
        method: 'POST'
      });
      
      const result = await response.json();
      
      // Clear cookies manually as well
      if (typeof document !== 'undefined') {
        document.cookie = 'hb_affiliate=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'affiliate_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      }

      setClearResult({
        success: true,
        message: 'All affiliate data cleared successfully!',
        details: result
      });

      // Refresh debug info
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      setClearResult({
        success: false,
        message: 'Error clearing affiliate data',
        error: error.message
      });
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <Head>
        <title>Debug Affiliate Data</title>
      </Head>

      <h1>🔧 Debug Affiliate Data</h1>
      <p>Tato stránka zobrazuje všechna affiliate data uložená v prohlížeči.</p>

      {/* Clear Button */}
      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '8px' }}>
        <h3>🧹 Vyčistit affiliate data</h3>
        <p>Klikněte pro vymazání všech affiliate dat z localStorage, sessionStorage a cookies:</p>
        <button
          onClick={clearAllAffiliateData}
          style={{
            padding: '12px 24px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🗑️ Vymazat všechna affiliate data
        </button>
      </div>

      {/* Clear Result */}
      {clearResult && (
        <div style={{ 
          marginBottom: '30px',
          padding: '20px', 
          backgroundColor: clearResult.success ? '#d4edda' : '#f8d7da',
          border: `1px solid ${clearResult.success ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '8px'
        }}>
          <h3>{clearResult.success ? '✅ Úspěch!' : '❌ Chyba'}</h3>
          <p>{clearResult.message}</p>
          {clearResult.success && <p><em>Stránka se za 2 sekundy obnoví...</em></p>}
          {clearResult.error && <p><strong>Chyba:</strong> {clearResult.error}</p>}
        </div>
      )}

      {/* Debug Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* Cookies */}
        <div style={{ padding: '20px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '8px' }}>
          <h3>🍪 Cookies</h3>
          {Object.keys(debugInfo.cookies || {}).length > 0 ? (
            <pre style={{ fontSize: '12px', overflow: 'auto', backgroundColor: 'white', padding: '10px', borderRadius: '4px' }}>
              {JSON.stringify(debugInfo.cookies, null, 2)}
            </pre>
          ) : (
            <p style={{ color: '#28a745' }}>✅ Žádné affiliate cookies</p>
          )}
        </div>

        {/* localStorage */}
        <div style={{ padding: '20px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '8px' }}>
          <h3>💾 localStorage</h3>
          {Object.keys(debugInfo.localStorage || {}).length > 0 ? (
            <pre style={{ fontSize: '12px', overflow: 'auto', backgroundColor: 'white', padding: '10px', borderRadius: '4px' }}>
              {JSON.stringify(debugInfo.localStorage, null, 2)}
            </pre>
          ) : (
            <p style={{ color: '#28a745' }}>✅ Žádná affiliate data v localStorage</p>
          )}
        </div>

        {/* sessionStorage */}
        <div style={{ padding: '20px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '8px' }}>
          <h3>📝 sessionStorage</h3>
          {Object.keys(debugInfo.sessionStorage || {}).length > 0 ? (
            <pre style={{ fontSize: '12px', overflow: 'auto', backgroundColor: 'white', padding: '10px', borderRadius: '4px' }}>
              {JSON.stringify(debugInfo.sessionStorage, null, 2)}
            </pre>
          ) : (
            <p style={{ color: '#28a745' }}>✅ Žádná affiliate data v sessionStorage</p>
          )}
        </div>

        {/* URL Parameters */}
        <div style={{ padding: '20px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '8px' }}>
          <h3>🔗 URL Parametry</h3>
          {Object.keys(debugInfo.urlParams || {}).length > 0 ? (
            <pre style={{ fontSize: '12px', overflow: 'auto', backgroundColor: 'white', padding: '10px', borderRadius: '4px' }}>
              {JSON.stringify(debugInfo.urlParams, null, 2)}
            </pre>
          ) : (
            <p style={{ color: '#666' }}>Žádné affiliate parametry v URL</p>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#e7f3ff', border: '1px solid #b3d9ff', borderRadius: '8px' }}>
        <h3>📋 Instrukce</h3>
        <ol>
          <li><strong>Vyčistit data:</strong> Klikněte na tlačítko "Vymazat všechna affiliate data"</li>
          <li><strong>Obnovit stránku:</strong> Stránka se automaticky obnoví</li>
          <li><strong>Testovat:</strong> Jděte na <code>/vps?affid=1</code> pro test s affiliate ID 1</li>
          <li><strong>Ověřit:</strong> Zkontrolujte Developer Tools → Network tab</li>
        </ol>
      </div>

      {/* Test Links */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <h3>🧪 Test odkazy</h3>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a 
            href="/vps?affid=1" 
            style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '6px' }}
          >
            Test s affid=1
          </a>
          <a 
            href="/vps?aff=1" 
            style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', textDecoration: 'none', borderRadius: '6px' }}
          >
            Test s aff=1
          </a>
          <a 
            href="/vps" 
            style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', textDecoration: 'none', borderRadius: '6px' }}
          >
            Test bez affiliate
          </a>
        </div>
      </div>
    </div>
  );
}
