import { useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';

export default function TestPage() {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const runTest = async (testName, url) => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      const endTime = Date.now();
      
      setTestResults(prev => [...prev, {
        name: testName,
        status: 'success',
        duration: endTime - startTime,
        data: data,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } catch (error) {
      const endTime = Date.now();
      setTestResults(prev => [...prev, {
        name: testName,
        status: 'error',
        duration: endTime - startTime,
        error: error.message,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
    
    setLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const tests = [
    { name: 'Status API', url: '/api/status' },
    { name: 'Health Check', url: '/api/health' },
    { name: 'Product Mapping', url: '/api/products' }
  ];

  return (
    <>
      <Head>
        <title>API Tests - Systrix Middleware Dashboard</title>
      </Head>

      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">API Tests</h1>
            <p className="text-gray-600">Test middleware API endpoints</p>
          </div>

          {/* Test Controls */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Tests</h2>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tests.map((test, index) => (
                <button
                  key={index}
                  onClick={() => runTest(test.name, test.url)}
                  disabled={loading}
                  className="btn-primary disabled:opacity-50"
                >
                  {loading ? '⏳' : '🧪'} {test.name}
                </button>
              ))}
            </div>

            <div className="mt-4 flex justify-between">
              <button
                onClick={clearResults}
                className="btn-secondary"
              >
                🗑️ Clear Results
              </button>
              <span className="text-sm text-gray-500">
                {testResults.length} test{testResults.length !== 1 ? 's' : ''} run
              </span>
            </div>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h2>
              
              <div className="space-y-4">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      result.status === 'success' 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        <span className={`mr-2 ${
                          result.status === 'success' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {result.status === 'success' ? '✅' : '❌'}
                        </span>
                        <span className="font-medium text-gray-900">{result.name}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {result.timestamp} ({result.duration}ms)
                      </div>
                    </div>
                    
                    {result.status === 'success' ? (
                      <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    ) : (
                      <div className="text-sm text-red-700">
                        Error: {result.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
