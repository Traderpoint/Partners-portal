import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useCart } from '../contexts/CartContext';
import VPSCartSidebar from '../components/VPSCartSidebar';
import { ToastContainer, useToast } from '../components/Toast';
import { extractAffiliateParams, storeAffiliateData, validateAffiliateId } from '../utils/affiliate';

const plans = [
  {
    id: 1,
    name: 'VPS Start',
    cpu: '2 jádra',
    ram: '4 GB',
    storage: '50 GB',
    price: '249 Kč',
    hostbillPid: 1,
    popular: false
  },
  {
    id: 2,
    name: 'VPS Profi',
    cpu: '4 jádra',
    ram: '8 GB',
    storage: '100 GB',
    price: '499 Kč',
    hostbillPid: 2,
    popular: true
  },
  {
    id: 3,
    name: 'VPS Expert',
    cpu: '8 jader',
    ram: '16 GB',
    storage: '200 GB',
    price: '999 Kč',
    hostbillPid: 3,
    popular: false
  },
  {
    id: 4,
    name: 'VPS Ultra',
    cpu: '12 jader',
    ram: '32 GB',
    storage: '400 GB',
    price: '1899 Kč',
    hostbillPid: 4,
    popular: false
  }
];

export default function VPS() {
  const router = useRouter();
  const { addItem, affiliateId, affiliateCode, setAffiliate } = useCart();
  const [affiliateInfo, setAffiliateInfo] = useState(null);
  const [affiliateValidated, setAffiliateValidated] = useState(false);
  const { toasts, addToast, removeToast, showSuccess } = useToast();

  // Handle affiliate tracking on page load
  useEffect(() => {
    const handleAffiliateTracking = async () => {
      // Extract affiliate parameters from URL
      const affiliateParams = extractAffiliateParams(window.location.href);

      if (affiliateParams.id || affiliateParams.code) {
        console.log('🔍 Affiliate parameters found:', affiliateParams);

        // Store affiliate data
        storeAffiliateData(affiliateParams);

        // Update cart context
        setAffiliate(affiliateParams.id, affiliateParams.code);

        // Validate affiliate ID
        if (affiliateParams.id) {
          try {
            const isValid = await validateAffiliateId(affiliateParams.id);
            if (isValid) {
              console.log('✅ Affiliate validated successfully');
              setAffiliateValidated(true);

              // Get affiliate info for display
              const response = await fetch(`/api/validate-affiliate?id=${affiliateParams.id}`);
              const result = await response.json();
              if (result.success && result.affiliate) {
                setAffiliateInfo(result.affiliate);

                // Show affiliate welcome toast
                addToast(
                  `🎉 Vítejte! Přišli jste přes partnera ${result.affiliate.name}`,
                  'success',
                  5000
                );
              }
            } else {
              console.log('❌ Affiliate validation failed');
              addToast('Neplatný affiliate kód', 'error', 3000);
            }
          } catch (error) {
            console.error('Error validating affiliate:', error);
          }
        }

        // Clean URL (remove affiliate parameters)
        const url = new URL(window.location);
        ['aff', 'affiliate', 'ref', 'aff_code', 'affiliate_code'].forEach(param => {
          url.searchParams.delete(param);
        });
        router.replace(url.pathname + url.search, undefined, { shallow: true });
      }
    };

    if (typeof window !== 'undefined') {
      handleAffiliateTracking();
    }

    // Track page view for affiliate
    if (typeof window !== 'undefined' && window.hostbillAffiliate) {
      window.hostbillAffiliate.trackPageView('/vps');
    }
  }, []); // Run only once on mount

  const handleAddToCart = (plan) => {
    // Add item to cart
    addItem({
      id: plan.id,
      name: plan.name,
      cpu: plan.cpu,
      ram: plan.ram,
      storage: plan.storage,
      price: plan.price,
      hostbillPid: plan.hostbillPid
    });

    // Enhanced affiliate tracking
    console.log('🛒 Item added to cart:', plan.name);

    if (affiliateId || affiliateCode) {
      console.log('🎯 Affiliate tracking - Item added by affiliate:', {
        affiliateId,
        affiliateCode,
        product: plan.name,
        price: plan.price
      });
    }

    // Track affiliate conversion (legacy)
    if (typeof window !== 'undefined' && window.hostbillAffiliate) {
      window.hostbillAffiliate.trackConversion({
        orderId: `cart-${Date.now()}`,
        amount: parseFloat(plan.price.replace(/[^\d]/g, '')),
        currency: 'CZK',
        products: [plan.name],
        affiliate: {
          id: affiliateId,
          code: affiliateCode
        }
      });
    }

    // Show success message with affiliate info
    if (affiliateInfo) {
      console.log(`✅ ${plan.name} přidán do košíku pro partnera ${affiliateInfo.name}`);
      showSuccess(
        `✅ ${plan.name} přidán do košíku! Partner: ${affiliateInfo.name}`,
        4000
      );
    } else {
      showSuccess(`✅ ${plan.name} přidán do košíku!`, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Affiliate Banner */}
      {affiliateInfo && affiliateValidated && (
        <div className="relative z-50 bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 px-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">
                  🎉 Přišli jste přes partnera: <span className="font-bold">{affiliateInfo.name}</span>
                </p>
                <p className="text-xs opacity-90">
                  Vaše objednávka bude přiřazena k tomuto partnerovi pro sledování provizí
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium">
                Partner ID: {affiliateInfo.id}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Affiliate Code Display (for debugging) */}
      {(affiliateId || affiliateCode) && process.env.NODE_ENV === 'development' && (
        <div className="relative z-40 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">
                  <strong>Debug:</strong> Affiliate ID: {affiliateId}, Code: {affiliateCode}, Validated: {affiliateValidated ? '✅' : '❌'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Animated Tech Background */}
      <div className="absolute inset-0">
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }} />
        </div>

        {/* Floating Geometric Shapes */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-green-400/10 to-blue-400/10 rounded-lg rotate-45 blur-lg animate-bounce" style={{animationDuration: '3s'}}></div>
          <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-gradient-to-br from-cyan-400/10 to-blue-400/10 rounded-lg rotate-12 blur-xl animate-bounce" style={{animationDuration: '4s', animationDelay: '2s'}}></div>
        </div>

        {/* Circuit Board Pattern */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 800" fill="none">
          {/* Main Circuit Lines */}
          <g opacity="0.1">
            <path d="M100 100L300 100L300 200L500 200L500 400L700 400" stroke="url(#gradient1)" strokeWidth="2"/>
            <path d="M900 150L1100 150L1100 350L800 350L800 550" stroke="url(#gradient2)" strokeWidth="2"/>
            <path d="M200 600L400 600L400 450L600 450L600 250" stroke="url(#gradient3)" strokeWidth="2"/>
            <path d="M50 300L150 300L150 500L350 500L350 700" stroke="url(#gradient4)" strokeWidth="2"/>
          </g>

          {/* Connection Nodes */}
          <g opacity="0.15">
            <circle cx="300" cy="100" r="4" fill="#3B82F6"/>
            <circle cx="500" cy="200" r="4" fill="#10B981"/>
            <circle cx="700" cy="400" r="4" fill="#8B5CF6"/>
            <circle cx="1100" cy="150" r="4" fill="#F59E0B"/>
            <circle cx="800" cy="350" r="4" fill="#EF4444"/>
            <circle cx="400" cy="600" r="4" fill="#06B6D4"/>
            <circle cx="600" cy="450" r="4" fill="#84CC16"/>
            <circle cx="150" cy="300" r="4" fill="#F97316"/>
          </g>

          {/* Microchip Rectangles */}
          <g opacity="0.08">
            <rect x="250" y="80" width="40" height="40" rx="4" fill="#3B82F6"/>
            <rect x="480" y="180" width="40" height="40" rx="4" fill="#10B981"/>
            <rect x="680" y="380" width="40" height="40" rx="4" fill="#8B5CF6"/>
            <rect x="1080" y="130" width="40" height="40" rx="4" fill="#F59E0B"/>
            <rect x="780" y="330" width="40" height="40" rx="4" fill="#EF4444"/>
          </g>

          {/* Gradient Definitions */}
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6"/>
              <stop offset="100%" stopColor="#10B981"/>
            </linearGradient>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8B5CF6"/>
              <stop offset="100%" stopColor="#F59E0B"/>
            </linearGradient>
            <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06B6D4"/>
              <stop offset="100%" stopColor="#84CC16"/>
            </linearGradient>
            <linearGradient id="gradient4" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F97316"/>
              <stop offset="100%" stopColor="#EF4444"/>
            </linearGradient>
          </defs>
        </svg>

        {/* Data Flow Animation */}
        <div className="absolute inset-0">
          <div className="absolute top-32 left-20 w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
          <div className="absolute top-60 right-32 w-2 h-2 bg-green-400 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-40 left-1/3 w-2 h-2 bg-purple-400 rounded-full animate-ping" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-60 right-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-ping" style={{animationDelay: '3s'}}></div>
        </div>
      </div>
      <div className="container mx-auto py-6 px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">Systrix VPS Hosting</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Výkonný a flexibilní VPS hosting pro maximální svobodu. Plný root přístup,
            NVMe SSD disky, dedikovaná IP adresa a profesionální správa.
          </p>
        </div>

        {/* Main Content with Sidebar */}
        <div className="flex flex-col xl:flex-row gap-12">
          {/* VPS Plans */}
          <div className="xl:w-2/3">
            {/* VPS Plans Header */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-6">
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4">
                <h2 className="text-lg font-bold">Vyberte si svou VPS</h2>
              </div>
            </div>
            <div className="space-y-4">
              {plans.map((plan) => (
                <div key={plan.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 relative overflow-hidden hover:shadow-xl transition-all duration-300">
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1 rounded-bl-xl text-xs font-bold shadow-lg">
                      Nejpopulárnější
                    </div>
                  )}

                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="lg:w-1/3 mb-4 lg:mb-0">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                      <div className="text-3xl font-bold text-primary-600 mb-1">{plan.price}</div>
                      <div className="text-sm text-gray-500">bez DPH / měsíc</div>
                    </div>

                    <div className="lg:w-1/3 mb-4 lg:mb-0">
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-primary-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm text-gray-700"><strong>CPU:</strong> {plan.cpu}</span>
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-primary-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm text-gray-700"><strong>RAM:</strong> {plan.ram}</span>
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-primary-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm text-gray-700"><strong>Storage:</strong> {plan.storage} NVMe SSD</span>
                        </div>
                      </div>
                    </div>

                    <div className="lg:w-1/3 lg:text-right">
                      <button
                        onClick={() => handleAddToCart(plan)}
                        className={`w-full lg:w-auto px-6 py-3 rounded-xl font-bold shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${
                          affiliateValidated
                            ? 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white'
                            : 'bg-primary-600 hover:bg-primary-700 text-white'
                        } hover:shadow-xl`}
                      >
                        {affiliateValidated ? (
                          <div className="flex items-center justify-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span>Přidat do košíku</span>
                          </div>
                        ) : (
                          'Přidat do košíku'
                        )}
                      </button>
                      {affiliateValidated && (
                        <p className="text-xs text-gray-500 mt-2 text-center lg:text-right">
                          🎯 Partner provize aktivní
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Features moved here */}
            <div className="mt-6 bg-white rounded-xl shadow-lg p-4">
              <h3 className="text-base font-bold mb-3 text-gray-900">Klíčové výhody VPS</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: '🔑', title: 'Root přístup', desc: 'Plná kontrola' },
                  { icon: '⚡', title: 'Garantovaný výkon', desc: 'Dedikované zdroje' },
                  { icon: '💾', title: 'NVMe SSD', desc: 'Rychlé disky' },
                  { icon: '🛡️', title: 'DDoS ochrana', desc: 'Bezpečnost zdarma' },
                  { icon: '🌐', title: 'Dedikované IP', desc: 'IPv4 a IPv6' },
                  { icon: '📊', title: 'Webová správa', desc: 'Control panel' },
                  { icon: '🔄', title: 'Neomezený přenos', desc: 'Bez limitů' },
                  { icon: '🎛️', title: 'Volba OS', desc: 'Linux distribuce' }
                ].map((feature, index) => (
                  <div key={index} className="text-center p-2 rounded-lg hover:bg-primary-50 transition-colors">
                    <div className="text-lg mb-1">{feature.icon}</div>
                    <h4 className="font-semibold text-gray-900 text-xs mb-1">{feature.title}</h4>
                    <p className="text-xs text-gray-600">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 text-center text-gray-500">
              <p className="text-xs">Všechny ceny jsou uvedeny bez DPH. Aktivace do 24 hodin, podpora 24/7.</p>
            </div>
          </div>

          {/* Sidebar Cart */}
          <div className="xl:w-1/3">
            <VPSCartSidebar />
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
