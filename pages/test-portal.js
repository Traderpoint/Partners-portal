import Head from 'next/head';
import Link from 'next/link';

export default function TestPortal() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8f9fa',
      fontFamily: 'Arial, sans-serif'
    }}>
      <Head>
        <title>HostBill Test Portal</title>
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
            🧪 HostBill Test Portal
          </h1>
          <p style={{ margin: '5px 0 0 0', opacity: 0.8 }}>
            Testovací nástroje pro HostBill API a affiliate systém
          </p>
        </div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        
        {/* Configuration Info */}
        <div style={{
          backgroundColor: '#d1ecf1',
          border: '1px solid #bee5eb',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '30px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#0c5460' }}>
            🔧 API Configuration
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
            <div>
              <h4 style={{ margin: '0 0 8px 0', color: '#0c5460' }}>HostBill Direct API</h4>
              <div style={{ fontSize: '14px', color: '#0c5460' }}>
                <div><strong>Domain:</strong> {process.env.NEXT_PUBLIC_HOSTBILL_DOMAIN || 'vps.kabel1it.cz'}</div>
                <div><strong>API URL:</strong> {process.env.NEXT_PUBLIC_HOSTBILL_URL || 'https://vps.kabel1it.cz'}/admin/api.php</div>
                <div><strong>API ID:</strong> {process.env.HOSTBILL_API_ID ? `${process.env.HOSTBILL_API_ID.substring(0, 8)}...` : 'adcdebb0...'}</div>
                <div><strong>Status:</strong> <span style={{ color: '#28a745' }}>✅ Configured</span></div>
              </div>
            </div>
            <div>
              <h4 style={{ margin: '0 0 8px 0', color: '#0c5460' }}>Middleware API</h4>
              <div style={{ fontSize: '14px', color: '#0c5460' }}>
                <div><strong>URL:</strong> {process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:3005'}</div>
                <div><strong>Health:</strong> /health</div>
                <div><strong>Affiliates:</strong> /api/affiliates</div>
                <div><strong>Status:</strong> <span style={{ color: '#28a745' }}>✅ Available</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Warning Banner */}
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '30px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#856404' }}>
            ⚠️ Testovací prostředí
          </h3>
          <p style={{ margin: 0, color: '#856404' }}>
            Testovací prostředí obsahuje jak middleware testy (doporučené), tak přímé HostBill API testy.
            Všechny API klíče jsou nakonfigurovány v .env.local souboru.
          </p>
        </div>

        {/* Test Categories */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>

          {/* Middleware Tests */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '25px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#28a745' }}>
              🔗 Middleware Testy
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link href="/middleware-dashboard" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#e1f5fe',
                border: '2px solid #0288d1',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#0277bd',
                transition: 'all 0.2s',
                fontWeight: 'bold'
              }}>
                🎛️ Middleware Dashboard
              </Link>

              <Link href="/middleware-test" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#d4edda',
                border: '1px solid #28a745',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#155724',
                transition: 'all 0.2s'
              }}>
                🚀 Middleware Connection Test
              </Link>

              <Link href="/middleware-affiliate-test" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#e3f2fd',
                border: '1px solid #2196f3',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#1976d2',
                transition: 'all 0.2s'
              }}>
                🎯 Middleware Affiliate Test
              </Link>



              <Link href="/middleware-affiliate-products" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#d1ecf1',
                border: '1px solid #17a2b8',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#0c5460',
                transition: 'all 0.2s'
              }}>
                📦 Middleware Products (Affiliate/All)
              </Link>

              <Link href="/middleware-order-test" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#fff3e0',
                border: '1px solid #ff9800',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#f57c00',
                transition: 'all 0.2s'
              }}>
                🛒 Middleware Order Test
              </Link>

              <Link href="/product-mapping-test" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#f3e5f5',
                border: '1px solid #9c27b0',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#7b1fa2',
                transition: 'all 0.2s'
              }}>
                🔗 Product Mapping Test
              </Link>

              <Link href="/advanced-order-test" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#e8f5e8',
                border: '1px solid #4caf50',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#2e7d32',
                transition: 'all 0.2s'
              }}>
                🚀 Advanced Order Test (Middleware)
              </Link>
            </div>
          </div>

          {/* Direct HostBill Tests */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '25px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#007bff' }}>
              👥 Direct HostBill Testy
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link href="/affiliate-test" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#e3f2fd',
                border: '1px solid #2196f3',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#1976d2',
                transition: 'all 0.2s'
              }}>
                🔍 Základní Affiliate Test
              </Link>
              
              <Link href="/affiliate-test-real" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#e8f5e8',
                border: '1px solid #4caf50',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#2e7d32',
                transition: 'all 0.2s'
              }}>
                🛒 Reálný Affiliate Test
              </Link>
              
              <Link href="/affiliate-products-test" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#fff3e0',
                border: '1px solid #ff9800',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#f57c00',
                transition: 'all 0.2s'
              }}>
                📦 Direct HostBill Products (Affiliate/All)
              </Link>

              <Link href="/direct-order-test" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#e8f5e8',
                border: '1px solid #4caf50',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#2e7d32',
                transition: 'all 0.2s'
              }}>
                🛒 Direct HostBill Order Test
              </Link>

              <Link href="/direct-advanced-order-test" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#ffebee',
                border: '1px solid #f44336',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#c62828',
                transition: 'all 0.2s'
              }}>
                ⚡ Direct Advanced Order Test
              </Link>

              <Link href="/affiliate-scenarios" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#f3e5f5',
                border: '1px solid #9c27b0',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#7b1fa2',
                transition: 'all 0.2s'
              }}>
                🎭 Affiliate Scénáře
              </Link>
            </div>
          </div>

          {/* Debug Tools */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '25px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#dc3545' }}>
              🐛 Debug Nástroje
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link href="/debug-affiliate" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#ffebee',
                border: '1px solid #f44336',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#c62828',
                transition: 'all 0.2s'
              }}>
                🔧 Debug Affiliate Data
              </Link>
              
              <a href="/api/hostbill/test-affiliate-api" target="_blank" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#e1f5fe',
                border: '1px solid #00bcd4',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#00838f',
                transition: 'all 0.2s'
              }}>
                🔗 Test HostBill API
              </a>
              
              <a href="/api/hostbill/get-all-affiliates" target="_blank" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#f1f8e9',
                border: '1px solid #8bc34a',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#558b2f',
                transition: 'all 0.2s'
              }}>
                📋 Všichni Affiliates
              </a>
            </div>
          </div>

          {/* Production Links */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '25px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#28a745' }}>
              🚀 Produkční Aplikace
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link href="/" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#d4edda',
                border: '1px solid #28a745',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#155724',
                transition: 'all 0.2s'
              }}>
                🏠 Hlavní Stránka
              </Link>
              
              <Link href="/checkout" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#d4edda',
                border: '1px solid #28a745',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#155724',
                transition: 'all 0.2s'
              }}>
                🛒 Checkout (Middleware)
              </Link>
              
              <Link href="/pricing" style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: '#d4edda',
                border: '1px solid #28a745',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#155724',
                transition: 'all 0.2s'
              }}>
                💰 Ceník
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer style={{
          marginTop: '50px',
          padding: '20px 0',
          borderTop: '1px solid #dee2e6',
          textAlign: 'center',
          color: '#6c757d'
        }}>
          <p style={{ margin: 0 }}>
            Test Portal pro HostBill API | 
            <button 
              onClick={() => setIsAuthenticated(false)}
              style={{
                marginLeft: '10px',
                background: 'none',
                border: 'none',
                color: '#007bff',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Odhlásit se
            </button>
          </p>
        </footer>
      </div>
    </div>
  );
}
