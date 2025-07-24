import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function AffiliateScenarios() {
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState(null);

  const scenarios = [
    {
      id: 'basic',
      name: '🎯 Základní affiliate tracking',
      description: 'Standardní návštěva s affiliate ID',
      url: '?aff=1',
      expected: 'Detekce affiliate ID, cookie storage, pixel tracking'
    },
    {
      id: 'hostbill-format',
      name: '🏢 HostBill formát',
      description: 'Použití HostBill ?affid= formátu',
      url: '?affid=2',
      expected: 'Kompatibilita s HostBill affiliate systémem'
    },
    {
      id: 'multiple-params',
      name: '📊 Komplexní URL',
      description: 'URL s více parametry',
      url: '?aff=1&utm_source=google&utm_campaign=vps2024',
      expected: 'Správná extrakce affiliate ID mezi ostatními parametry'
    },
    {
      id: 'conversion',
      name: '💰 Konverzní tracking',
      description: 'Simulace objednávky s affiliate',
      url: '?aff=1&action=conversion',
      expected: 'Tracking konverze pro affiliate partnera'
    },
    {
      id: 'mobile',
      name: '📱 Mobilní návštěva',
      description: 'Test na mobilním zařízení',
      url: '?aff=1&mobile=1',
      expected: 'Správné fungování na mobilních zařízeních'
    },
    {
      id: 'invalid-id',
      name: '❌ Neplatné ID',
      description: 'Test s neexistujícím affiliate ID',
      url: '?aff=999',
      expected: 'Graceful handling neplatného ID'
    }
  ];

  const runAllScenarios = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/hostbill/test-scenarios');
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

  const runSingleScenario = async (scenario) => {
    setLoading(true);
    setSelectedScenario(scenario);
    
    try {
      // Simulace návštěvy s affiliate parametry
      const urlParams = new URLSearchParams(scenario.url.substring(1));
      const aff = urlParams.get('aff') || urlParams.get('affid');
      
      const response = await fetch('/api/hostbill/track-visit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aff: aff,
          action: urlParams.get('action') || 'visit',
          url: `${window.location.origin}${window.location.pathname}${scenario.url}`,
          referrer: document.referrer || 'direct',
          timestamp: Date.now()
        }),
      });

      const result = await response.json();
      setTestResults({
        success: true,
        single_scenario: true,
        scenario: scenario,
        result: result
      });
    } catch (error) {
      setTestResults({
        success: false,
        single_scenario: true,
        scenario: scenario,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PASS': return '#00cc66';
      case 'FAIL': return '#cc0066';
      case 'ERROR': return '#ff6600';
      default: return '#666666';
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <Head>
        <title>Affiliate Scenarios Test Suite</title>
      </Head>

      <h1>🧪 Affiliate Scenarios Test Suite</h1>
      
      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f0f8ff', border: '1px solid #0066cc', borderRadius: '8px' }}>
        <h2>📋 Test Scenarios</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px', marginTop: '15px' }}>
          {scenarios.map((scenario) => (
            <div key={scenario.id} style={{ 
              padding: '15px', 
              backgroundColor: 'white', 
              border: '1px solid #ddd', 
              borderRadius: '5px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'}
            onMouseLeave={(e) => e.target.style.boxShadow = 'none'}
            onClick={() => runSingleScenario(scenario)}
            >
              <h3 style={{ margin: '0 0 8px 0', color: '#0066cc' }}>{scenario.name}</h3>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>{scenario.description}</p>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontFamily: 'monospace', backgroundColor: '#f5f5f5', padding: '4px 8px', borderRadius: '3px' }}>
                {scenario.url}
              </p>
              <p style={{ margin: '0', fontSize: '12px', color: '#888' }}>
                <strong>Expected:</strong> {scenario.expected}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <button 
          onClick={runAllScenarios}
          disabled={loading}
          style={{
            padding: '15px 30px',
            backgroundColor: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            marginRight: '10px'
          }}
        >
          {loading ? '⏳ Running Tests...' : '🚀 Run All Scenarios'}
        </button>
        
        <button 
          onClick={() => setTestResults(null)}
          style={{
            padding: '15px 30px',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          🗑️ Clear Results
        </button>
      </div>

      {testResults && (
        <div style={{ marginTop: '30px' }}>
          <h2>📊 Test Results</h2>
          
          {testResults.single_scenario ? (
            // Single scenario result
            <div style={{ 
              padding: '20px', 
              backgroundColor: testResults.success ? '#f0fff0' : '#fff0f0', 
              border: `2px solid ${testResults.success ? '#00cc66' : '#cc0066'}`, 
              borderRadius: '8px'
            }}>
              <h3>{testResults.scenario?.name}</h3>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px', backgroundColor: 'rgba(0,0,0,0.05)', padding: '10px', borderRadius: '4px' }}>
                {JSON.stringify(testResults.result || testResults.error, null, 2)}
              </pre>
            </div>
          ) : (
            // All scenarios results
            <>
              {testResults.summary && (
                <div style={{ 
                  padding: '20px', 
                  backgroundColor: '#f0fff0', 
                  border: '2px solid #00cc66', 
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}>
                  <h3>📈 Summary</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0066cc' }}>{testResults.summary.total}</div>
                      <div>Total Tests</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00cc66' }}>{testResults.summary.passed}</div>
                      <div>Passed</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#cc0066' }}>{testResults.summary.failed}</div>
                      <div>Failed</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff6600' }}>{testResults.summary.errors}</div>
                      <div>Errors</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0066cc' }}>{testResults.summary.success_rate}%</div>
                      <div>Success Rate</div>
                    </div>
                  </div>
                </div>
              )}

              {testResults.scenarios && (
                <div style={{ marginBottom: '20px' }}>
                  <h3>🔍 Detailed Results</h3>
                  {testResults.scenarios.map((scenario, index) => (
                    <div key={index} style={{ 
                      padding: '15px', 
                      marginBottom: '10px',
                      backgroundColor: 'white',
                      border: `2px solid ${getStatusColor(scenario.status)}`, 
                      borderRadius: '5px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h4 style={{ margin: 0, color: getStatusColor(scenario.status) }}>{scenario.name}</h4>
                        <span style={{ 
                          padding: '4px 12px', 
                          backgroundColor: getStatusColor(scenario.status), 
                          color: 'white', 
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {scenario.status}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 10px 0', color: '#666' }}>{scenario.description}</p>
                      <details style={{ fontSize: '12px' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>View Details</summary>
                        <pre style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px', marginTop: '10px' }}>
                          {JSON.stringify(scenario, null, 2)}
                        </pre>
                      </details>
                    </div>
                  ))}
                </div>
              )}

              {testResults.recommendations && (
                <div style={{ 
                  padding: '20px', 
                  backgroundColor: '#fffacd', 
                  border: '2px solid #ffd700', 
                  borderRadius: '8px'
                }}>
                  <h3>💡 Recommendations</h3>
                  <ul>
                    {testResults.recommendations.map((rec, index) => (
                      <li key={index} style={{ marginBottom: '8px' }}>{rec}</li>
                    ))}
                  </ul>
                  
                  {testResults.next_steps && (
                    <>
                      <h4>🎯 Next Steps</h4>
                      <ol>
                        {testResults.next_steps.map((step, index) => (
                          <li key={index} style={{ marginBottom: '4px' }}>{step}</li>
                        ))}
                      </ol>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
