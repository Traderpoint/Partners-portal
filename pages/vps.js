import { useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import VPSCartSidebar from '../components/VPSCartSidebar';
import { getHostBillProductId } from '../lib/hostbill-config';

const plans = [
  {
    id: 1,
    name: 'VPS Start',
    cpu: '2 jádra',
    ram: '4 GB',
    storage: '50 GB',
    price: '249 Kč',
    hostbillPid: getHostBillProductId('1'), // Maps internal ID 1 to HostBill product ID
    popular: false
  },
  {
    id: 2,
    name: 'VPS Profi',
    cpu: '4 jádra',
    ram: '8 GB',
    storage: '100 GB',
    price: '499 Kč',
    hostbillPid: getHostBillProductId('2'), // Maps internal ID 2 to HostBill product ID
    popular: true
  },
  {
    id: 3,
    name: 'VPS Expert',
    cpu: '8 jader',
    ram: '16 GB',
    storage: '200 GB',
    price: '999 Kč',
    hostbillPid: getHostBillProductId('3'), // Maps internal ID 3 to HostBill product ID
    popular: false
  },
  {
    id: 4,
    name: 'VPS Ultra',
    cpu: '12 jader',
    ram: '32 GB',
    storage: '400 GB',
    price: '1899 Kč',
    hostbillPid: getHostBillProductId('4'), // Maps internal ID 4 to HostBill product ID
    popular: false
  }
];

export default function VPS() {
  const { addItem } = useCart();

  // Track page view for affiliate
  useEffect(() => {
    if (typeof window !== 'undefined' && window.hostbillAffiliate) {
      window.hostbillAffiliate.trackPageView('/vps');
    }
  }, []);

  const handleAddToCart = (plan) => {
    addItem({
      id: plan.id,
      name: plan.name,
      cpu: plan.cpu,
      ram: plan.ram,
      storage: plan.storage,
      price: plan.price,
      hostbillPid: plan.hostbillPid
    });

    // Track affiliate conversion
    if (typeof window !== 'undefined' && window.hostbillAffiliate) {
      window.hostbillAffiliate.trackConversion({
        orderId: `cart-${Date.now()}`,
        amount: parseFloat(plan.price.replace(/[^\d]/g, '')),
        currency: 'CZK',
        products: [plan.name]
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
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
                        className="w-full lg:w-auto bg-primary-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-primary-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                      >
                        Přidat do košíku
                      </button>
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
    </div>
  );
}
