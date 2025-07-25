import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function MiddlewareAffiliateProducts() {
  const router = useRouter();
  const [affiliateId, setAffiliateId] = useState('2');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [affiliates, setAffiliates] = useState([]);
  const [affiliatesLoading, setAffiliatesLoading] = useState(true);
  const [viewMode, setViewMode] = useState('affiliate'); // 'affiliate' or 'all'

  // Load all affiliates on component mount
  useEffect(() => {
    loadAllAffiliates();
  }, []);

  // Auto-load on page load if affiliate_id in URL
  useEffect(() => {
    const { affiliate_id } = router.query;
    if (affiliate_id) {
      setAffiliateId(affiliate_id);
      loadAffiliateProducts(affiliate_id);
    }
  }, [router.query]);

  // Reload products when view mode changes
  useEffect(() => {
    if (viewMode === 'all' || affiliateId) {
      loadAffiliateProducts();
    }
  }, [viewMode]);

  const loadAllAffiliates = async () => {
    setAffiliatesLoading(true);
    try {
      console.log('🔍 Loading all affiliates via middleware...');
      const response = await fetch('/api/middleware/get-affiliates');
      const result = await response.json();

      if (result.success && result.affiliates) {
        setAffiliates(result.affiliates);
        console.log(`✅ Loaded ${result.affiliates.length} affiliates via middleware`);
      } else {
        console.error('❌ Failed to load affiliates via middleware:', result.error);
      }
    } catch (err) {
      console.error('❌ Error loading affiliates via middleware:', err);
    } finally {
      setAffiliatesLoading(false);
    }
  };

  const loadAffiliateProducts = async (affId = affiliateId) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      let url, logMessage;
      if (viewMode === 'all') {
        url = `/api/middleware/get-affiliate-products?affiliate_id=${affId}&mode=all`;
        logMessage = `🔍 Loading ALL products for affiliate ID: ${affId} via middleware`;
      } else {
        url = `/api/middleware/get-affiliate-products?affiliate_id=${affId}&mode=affiliate`;
        logMessage = `🔍 Loading APPLIED products for affiliate ID: ${affId} via middleware`;
      }

      console.log(logMessage);
      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setData(result);
        console.log('✅ Products loaded via middleware:', result);
      } else {
        setError(result.error || 'Failed to load products');
        console.error('❌ Failed to load products via middleware:', result);
      }
    } catch (err) {
      setError(err.message);
      console.error('❌ Error loading products via middleware:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return price && parseFloat(price) > 0 ? `${price} CZK` : 'N/A';
  };

  const formatCommission = (commission) => {
    if (!commission || !commission.rate) return 'N/A';
    
    if (commission.type === 'Percent') {
      return `${commission.rate}%`;
    } else if (commission.type === 'Fixed') {
      return `${commission.rate} CZK`;
    }
    return commission.rate;
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <Head>
        <title>Middleware Affiliate Products Test</title>
      </Head>

      <h1>🎯 Middleware Affiliate Products Test</h1>
      <p>Test získání produktů s provizemi přes middleware na portu 3005</p>

      {/* Quick Affiliate Links */}
      <div style={{
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: '#e3f2fd',
        borderRadius: '8px',
        border: '1px solid #2196f3'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#1976d2' }}>🔗 Quick Affiliate Links</h3>
        {affiliatesLoading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <span>⏳ Loading affiliates...</span>
          </div>
        ) : affiliates.length > 0 ? (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {affiliates.map(affiliate => (
              <a
                key={affiliate.id}
                href={`/middleware-affiliate-products?affiliate_id=${affiliate.id}`}
                style={{
                  padding: '10px 16px',
                  backgroundColor: affiliateId === affiliate.id ? '#1976d2' : '#2196f3',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  border: affiliateId === affiliate.id ? '2px solid #0d47a1' : 'none',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  if (affiliateId !== affiliate.id) {
                    e.target.style.backgroundColor = '#1976d2';
                  }
                }}
                onMouseOut={(e) => {
                  if (affiliateId !== affiliate.id) {
                    e.target.style.backgroundColor = '#2196f3';
                  }
                }}
              >
                #{affiliate.id} - {affiliate.firstname} {affiliate.lastname}
                <div style={{ fontSize: '11px', opacity: '0.9' }}>
                  {affiliate.status} • Visits: {affiliate.visits || 0}
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            ⚠️ No affiliates found
          </div>
        )}
      </div>

      {/* Input Section */}
      <div style={{
        backgroundColor: '#f5f5f5',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3>🔧 Test Parameters</h3>

        {/* View Mode Selector */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
          <label>
            <strong>View Mode:</strong>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              style={{
                marginLeft: '10px',
                padding: '5px 10px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '14px'
              }}
            >
              <option value="affiliate">Applied Affiliate Products (Middleware)</option>
              <option value="all">All Products (Middleware)</option>
            </select>
          </label>
        </div>

        {/* Affiliate ID Input - only show when affiliate mode */}
        {viewMode === 'affiliate' && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
            <label>
              <strong>Affiliate ID:</strong>
            <input
              type="text"
              value={affiliateId}
              onChange={(e) => setAffiliateId(e.target.value)}
              style={{
                marginLeft: '10px',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
              placeholder="Enter affiliate ID"
            />
          </label>
          <button
            onClick={() => loadAffiliateProducts()}
            disabled={loading || !affiliateId}
            style={{
              padding: '8px 16px',
              backgroundColor: loading ? '#ccc' : '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '⏳ Loading...' : '🔍 Load Products'}
          </button>
          </div>
        )}

        {/* Load All Products Button - only show when all mode */}
        {viewMode === 'all' && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
            <button
              onClick={() => loadAffiliateProducts()}
              disabled={loading}
              style={{
                padding: '8px 16px',
                backgroundColor: loading ? '#ccc' : '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '⏳ Loading...' : '🔍 Load All Products'}
            </button>
          </div>
        )}

        <div style={{ fontSize: '14px', color: '#6c757d' }}>
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
          <h3>⏳ Loading affiliate products...</h3>
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
      {data && (
        <div style={{
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#155724' }}>
            ✅ Products loaded via Middleware
          </h3>
          
          <div style={{ marginBottom: '15px', fontSize: '14px', color: '#155724' }}>
            <strong>Source:</strong> {data.source} |
            <strong> Mode:</strong> {data.mode} |
            <strong> Middleware URL:</strong> {data.middleware_url || 'http://localhost:3005'} |
            <strong> Affiliate ID:</strong> {data.affiliate?.id}
          </div>

          {/* Summary */}
          {data.summary && (
            <div style={{
              backgroundColor: '#fff3e0',
              border: '1px solid #ff9800',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '15px'
            }}>
              <h4 style={{ color: '#f57c00', margin: '0 0 10px 0' }}>
                📊 Summary - {data.mode === 'all' ? 'All Products Mode' : 'Applied Products Mode'}
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                <div><strong>Total Products:</strong> {data.summary.total_products}</div>
                <div><strong>With Commission:</strong> {data.summary.products_with_commission}</div>
                <div><strong>Without Commission:</strong> {data.summary.products_without_commission}</div>
                <div><strong>Commission Plans:</strong> {data.summary.commission_plans_count}</div>
              </div>
              {data.note && (
                <div style={{
                  marginTop: '10px',
                  padding: '8px',
                  backgroundColor: 'rgba(255,152,0,0.1)',
                  borderRadius: '4px',
                  fontSize: '13px',
                  color: '#f57c00'
                }}>
                  ℹ️ {data.note}
                </div>
              )}
            </div>
          )}

          {data.products && data.products.length > 0 ? (
            <div>
              <h4 style={{ color: '#155724' }}>Products ({data.products.length}):</h4>
              {data.products.map((product, index) => (
                <div key={index} style={{
                  backgroundColor: 'white',
                  border: '1px solid #c3e6cb',
                  borderRadius: '6px',
                  padding: '15px',
                  marginBottom: '15px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                    <div>
                      <h5 style={{ margin: '0 0 5px 0', color: '#155724' }}>
                        {product.name} (ID: {product.id})
                      </h5>
                      <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                        Category: {product.category?.name || product.orderpage_name}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: product.commission?.has_commission ? '#2e7d32' : '#f57c00'
                      }}>
                        {product.commission?.has_commission ? (
                          <>Commission: {formatCommission(product.commission)}</>
                        ) : (
                          <>No Commission Plan</>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        Plan: {product.commission?.plan_name || 'None'}
                      </div>
                      {product.commission?.has_commission === false && (
                        <div style={{ fontSize: '10px', color: '#f57c00', marginTop: '2px' }}>
                          ⚠️ Not applicable for this affiliate
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                    <div><strong>Monthly:</strong> {formatPrice(product.monthly_price)}</div>
                    <div><strong>Quarterly:</strong> {formatPrice(product.quarterly_price)}</div>
                    <div><strong>Annually:</strong> {formatPrice(product.annually_price)}</div>
                    {product.commission?.has_commission && (
                      <>
                        <div><strong>Monthly Commission:</strong> {product.commission.monthly_amount} CZK</div>
                        <div><strong>Quarterly Commission:</strong> {product.commission.quarterly_amount} CZK</div>
                        <div><strong>Annually Commission:</strong> {product.commission.annually_amount} CZK</div>
                      </>
                    )}
                  </div>
                  {product.description && (
                    <div style={{ marginTop: '10px', fontSize: '14px', color: '#6c757d' }}>
                      {product.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#155724' }}>No products found for this affiliate.</p>
          )}
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
          <li>This test uses middleware API instead of direct HostBill calls</li>
          <li>Middleware server must be running on port 3005</li>
          <li>Products include commission information for the specified affiliate</li>
        </ul>
      </div>
    </div>
  );
}
