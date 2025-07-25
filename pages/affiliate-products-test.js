import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AffiliateProductsTest() {
  const router = useRouter();
  const [affiliateId, setAffiliateId] = useState('1');
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
      console.log('🔍 Loading all affiliates...');
      const response = await fetch('/api/hostbill/get-all-affiliates');
      const result = await response.json();

      if (result.success && result.affiliates) {
        setAffiliates(result.affiliates);
        console.log(`✅ Loaded ${result.affiliates.length} affiliates`);
      } else {
        console.error('❌ Failed to load affiliates:', result.error);
      }
    } catch (err) {
      console.error('❌ Error loading affiliates:', err);
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
        url = `/api/hostbill/get-affiliate-products?affiliate_id=${affId}&mode=all`;
        logMessage = `🔍 Loading ALL products for affiliate ID: ${affId} (with commission info)`;
      } else {
        url = `/api/hostbill/get-affiliate-products?affiliate_id=${affId}&mode=affiliate`;
        logMessage = `🔍 Loading APPLIED products for affiliate ID: ${affId} (commission plans only)`;
      }

      console.log(logMessage);
      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setData(result);
        console.log('✅ Products loaded successfully:', result);
      } else {
        setError(result.error || 'Failed to load products');
        console.error('❌ Failed to load products:', result);
      }
    } catch (err) {
      setError(err.message);
      console.error('❌ Error loading products:', err);
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
      <h1>🎯 Direct HostBill Products Test</h1>
      <p>Test přímého API pro získání produktů podle affiliate ID nebo všech produktů</p>

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
                href={`/affiliate-products-test?affiliate_id=${affiliate.id}`}
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
                  {affiliate.status} • Balance: {affiliate.balance} {affiliate.currency?.code || 'CZK'}
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
              <option value="affiliate">Applied Affiliate Products (Commission Plans Only)</option>
              <option value="all">All Products (With Commission Info)</option>
            </select>
          </label>
        </div>

        {/* Affiliate ID Input - only show when affiliate mode */}
        {viewMode === 'affiliate' && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
          <h3>⏳ Loading products...</h3>
          <p>Fetching data directly from HostBill API...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div style={{ 
          backgroundColor: '#ffebee', 
          border: '1px solid #f44336',
          borderRadius: '8px', 
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#d32f2f', margin: '0 0 10px 0' }}>❌ Error</h3>
          <p style={{ margin: 0, color: '#d32f2f' }}>{error}</p>
        </div>
      )}

      {/* Success State */}
      {data && (
        <div>
          {/* Affiliate Info */}
          <div style={{ 
            backgroundColor: '#e8f5e8', 
            border: '1px solid #4caf50',
            borderRadius: '8px', 
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h3 style={{ color: '#2e7d32', margin: '0 0 15px 0' }}>
              ✅ Affiliate: {data.affiliate.firstname} {data.affiliate.lastname}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div><strong>ID:</strong> {data.affiliate.id}</div>
              <div><strong>Status:</strong> {data.affiliate.status}</div>
              <div><strong>Balance:</strong> {data.affiliate.balance} {data.affiliate.currency?.code || 'CZK'}</div>
              <div><strong>Visits:</strong> {data.affiliate.visits}</div>
              <div><strong>Conversions:</strong> {data.affiliate.conversion}</div>
              <div><strong>Client ID:</strong> {data.affiliate.client_id}</div>
            </div>
          </div>

          {/* Summary */}
          <div style={{ 
            backgroundColor: '#fff3e0', 
            border: '1px solid #ff9800',
            borderRadius: '8px', 
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h3 style={{ color: '#f57c00', margin: '0 0 15px 0' }}>
              📊 Summary - {data.mode === 'all' ? 'All Products Mode' : 'Applied Products Mode'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div><strong>Categories:</strong> {data.summary.total_categories}</div>
              <div><strong>Total Products:</strong> {data.summary.total_products}</div>
              <div><strong>With Commission:</strong> {data.summary.products_with_commission || data.summary.total_applicable_products}</div>
              <div><strong>Without Commission:</strong> {data.summary.products_without_commission || 0}</div>
              <div><strong>Commission Plans:</strong> {data.commission_plans?.length || 0}</div>
            </div>
            {data.note && (
              <div style={{
                marginTop: '10px',
                padding: '10px',
                backgroundColor: 'rgba(255,152,0,0.1)',
                borderRadius: '4px',
                fontSize: '14px',
                color: '#f57c00'
              }}>
                ℹ️ {data.note}
              </div>
            )}
          </div>

          {/* Commission Plans */}
          {data.commission_plans && data.commission_plans.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3>💰 Commission Plans</h3>
              {data.commission_plans.map(plan => (
                <div key={plan.id} style={{ 
                  backgroundColor: '#f3e5f5', 
                  border: '1px solid #9c27b0',
                  borderRadius: '8px', 
                  padding: '15px',
                  marginBottom: '10px'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#7b1fa2' }}>
                    {plan.name} (ID: {plan.id})
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                    <div><strong>Type:</strong> {plan.type}</div>
                    <div><strong>Rate:</strong> {formatCommission(plan)}</div>
                    <div><strong>Recurring:</strong> {plan.recurring === '1' ? 'Yes' : 'No'}</div>
                    <div><strong>Default:</strong> {plan.default === '1' ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Products */}
          {data.products && data.products.length > 0 ? (
            <div>
              <h3>🛍️ Available Products ({data.products.length})</h3>
              <div style={{ display: 'grid', gap: '20px' }}>
                {data.products.map(product => (
                  <div key={product.id} style={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #ddd',
                    borderRadius: '8px', 
                    padding: '20px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                      <div>
                        <h4 style={{ margin: '0 0 5px 0', color: '#0066cc' }}>
                          {product.name} (ID: {product.id})
                        </h4>
                        <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                          Category: {product.category.name}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: '18px',
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

                    {/* Pricing */}
                    <div style={{ 
                      backgroundColor: '#f8f9fa', 
                      padding: '15px', 
                      borderRadius: '6px',
                      marginBottom: '15px'
                    }}>
                      <h5 style={{ margin: '0 0 10px 0' }}>💰 Pricing & Commission</h5>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                        <div>
                          <strong>Monthly:</strong> {formatPrice(product.m)}
                          {product.commission.monthly_amount > 0 && (
                            <div style={{ color: '#2e7d32', fontSize: '12px' }}>
                              Commission: {product.commission.monthly_amount} CZK
                            </div>
                          )}
                        </div>
                        <div>
                          <strong>Quarterly:</strong> {formatPrice(product.q)}
                          {product.commission.quarterly_amount > 0 && (
                            <div style={{ color: '#2e7d32', fontSize: '12px' }}>
                              Commission: {product.commission.quarterly_amount} CZK
                            </div>
                          )}
                        </div>
                        <div>
                          <strong>Semi-annually:</strong> {formatPrice(product.s)}
                          {product.commission.semiannually_amount > 0 && (
                            <div style={{ color: '#2e7d32', fontSize: '12px' }}>
                              Commission: {product.commission.semiannually_amount} CZK
                            </div>
                          )}
                        </div>
                        <div>
                          <strong>Annually:</strong> {formatPrice(product.a)}
                          {product.commission.annually_amount > 0 && (
                            <div style={{ color: '#2e7d32', fontSize: '12px' }}>
                              Commission: {product.commission.annually_amount} CZK
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Product Details */}
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      <div><strong>Type:</strong> {product.ptype}</div>
                      <div><strong>Visible:</strong> {product.visible === '1' ? 'Yes' : 'No'}</div>
                      <div><strong>Stock:</strong> {product.stock || 'Unlimited'}</div>
                      <div><strong>Active Accounts:</strong> {product.accounts || '0'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : data && (
            <div style={{ 
              backgroundColor: '#fff3e0', 
              border: '1px solid #ff9800',
              borderRadius: '8px', 
              padding: '20px',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#f57c00' }}>⚠️ No Products Found</h3>
              <p>No products with commissions found for affiliate ID {affiliateId}</p>
            </div>
          )}

          {/* Raw Data (Collapsible) */}
          <details style={{ marginTop: '30px' }}>
            <summary style={{ 
              cursor: 'pointer', 
              padding: '10px', 
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              fontWeight: 'bold'
            }}>
              🔍 Raw API Response
            </summary>
            <pre style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '15px', 
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px',
              marginTop: '10px'
            }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </div>
      )}


    </div>
  );
}
