import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AffiliateTest() {
  const router = useRouter();
  const [affiliateData, setAffiliateData] = useState(null);
  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    // Get current affiliate data
    if (typeof window !== 'undefined' && window.hostbillAffiliate) {
      setAffiliateData(window.hostbillAffiliate.getAffiliateData());
    }
  }, []);

  const addTestResult = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, { message, type, timestamp }]);
  };

  const testAffiliateVisit = () => {
    const testAffiliateId = 'TEST123';
    if (window.hostbillAffiliate) {
      window.hostbillAffiliate.trackVisit(testAffiliateId);
      addTestResult(`✅ Affiliate visit tracked for ID: ${testAffiliateId}`, 'success');
      
      // Update affiliate data
      setTimeout(() => {
        setAffiliateData(window.hostbillAffiliate.getAffiliateData());
      }, 100);
    } else {
      addTestResult('❌ HostBill affiliate system not initialized', 'error');
    }
  };

  const testConversion = async () => {
    const testOrderData = {
      orderId: `TEST-ORDER-${Date.now()}`,
      amount: 1500,
      currency: 'CZK',
      products: ['VPS Standard', 'WordPress', 'SSL Certificate'],
      customerEmail: 'test@example.com',
      os: 'linux',
      applications: ['nginx', 'wordpress', 'mysql'],
      period: 'monthly',
      serverSpecs: { cpu: '2 cores', ram: '4GB', disk: '80GB SSD' }
    };

    if (window.hostbillAffiliate) {
      try {
        await window.hostbillAffiliate.trackConversion(testOrderData);
        addTestResult(`✅ Conversion tracked for order: ${testOrderData.orderId}`, 'success');
        
        // Update affiliate data
        setTimeout(() => {
          setAffiliateData(window.hostbillAffiliate.getAffiliateData());
        }, 100);
      } catch (error) {
        addTestResult(`❌ Conversion tracking failed: ${error.message}`, 'error');
      }
    } else {
      addTestResult('❌ HostBill affiliate system not initialized', 'error');
    }
  };

  const debugAffiliate = () => {
    if (window.hostbillAffiliate) {
      window.hostbillAffiliate.debug();
      addTestResult('🔍 Debug info logged to console', 'info');
    }
  };

  const clearAffiliateData = () => {
    // Clear cookies and localStorage
    document.cookie = 'hb_affiliate=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    localStorage.removeItem('hb_affiliate_data');
    localStorage.removeItem('hb_conversion_data');
    
    setAffiliateData(null);
    addTestResult('🧹 Affiliate data cleared', 'info');
  };

  const simulateAffiliateLink = () => {
    const testAffiliateId = 'PARTNER456';
    const currentUrl = new URL(window.location);
    currentUrl.searchParams.set('aff', testAffiliateId);
    
    addTestResult(`🔗 Simulating affiliate link: ${currentUrl.toString()}`, 'info');
    
    // Reload page with affiliate parameter
    window.location.href = currentUrl.toString();
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">HostBill Affiliate System - Test Panel</h1>
        
        {/* Current Affiliate Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Affiliate Status</h2>
          
          {affiliateData?.affiliateId ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium">
                ✅ Active Affiliate: {affiliateData.affiliateId}
              </p>
              {affiliateData.visitData && (
                <div className="mt-2 text-sm text-green-700">
                  <p>Visit Time: {new Date(affiliateData.visitData.visitTime).toLocaleString()}</p>
                  <p>Landing Page: {affiliateData.visitData.landingPage}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-600">No active affiliate session</p>
            </div>
          )}
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={testAffiliateVisit}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              🎯 Test Affiliate Visit
            </button>
            
            <button
              onClick={testConversion}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              💰 Test Conversion
            </button>
            
            <button
              onClick={simulateAffiliateLink}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              🔗 Simulate Affiliate Link
            </button>
            
            <button
              onClick={debugAffiliate}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
            >
              🔍 Debug Info
            </button>
            
            <button
              onClick={clearAffiliateData}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              🧹 Clear Data
            </button>
            
            <button
              onClick={() => router.push('/payment')}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              🛒 Go to Payment
            </button>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          
          {testResults.length === 0 ? (
            <p className="text-gray-500">No test results yet. Run some tests above.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg text-sm ${
                    result.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                    result.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
                    'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}
                >
                  <span className="font-mono text-xs text-gray-500">{result.timestamp}</span>
                  <span className="ml-2">{result.message}</span>
                </div>
              ))}
            </div>
          )}
          
          {testResults.length > 0 && (
            <button
              onClick={() => setTestResults([])}
              className="mt-4 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Results
            </button>
          )}
        </div>

        {/* Documentation */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">How to Use</h2>
          
          <div className="prose max-w-none">
            <h3>1. Test Affiliate Links</h3>
            <p>Use URLs like: <code>http://localhost:3000?aff=PARTNER123</code></p>
            
            <h3>2. Check Console</h3>
            <p>Open Developer Tools (F12) to see detailed tracking logs.</p>
            
            <h3>3. Test Conversion Flow</h3>
            <ol>
              <li>Click "Simulate Affiliate Link" to set affiliate cookie</li>
              <li>Go to Payment page and complete an order</li>
              <li>Check console for conversion tracking</li>
            </ol>
            
            <h3>4. Production Setup</h3>
            <p>Update <code>.env.local</code> with your actual HostBill domain and API keys.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
