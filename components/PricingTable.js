import { useCart } from '../contexts/CartContext';

const plans = [
  {
    id: 1,
    name: 'VPS Start',
    cpu: '2 jádra',
    ram: '4 GB',
    storage: '50 GB',
    price: '249 Kč',
    hostbillPid: 1
  },
  {
    id: 2,
    name: 'VPS Profi',
    cpu: '4 jádra',
    ram: '8 GB',
    storage: '100 GB',
    price: '499 Kč',
    hostbillPid: 2
  },
  {
    id: 3,
    name: 'VPS Expert',
    cpu: '8 jader',
    ram: '16 GB',
    storage: '200 GB',
    price: '999 Kč',
    hostbillPid: 3
  },
  {
    id: 4,
    name: 'VPS Ultra',
    cpu: '12 jader',
    ram: '32 GB',
    storage: '400 GB',
    price: '1899 Kč',
    hostbillPid: 4
  }
];

export default function PricingTable({ simple }) {
  const { addItem } = useCart();

  // simple = pouze 3 plány pro homepage
  const visiblePlans = simple ? plans.slice(0, 3) : plans;

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
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full bg-white rounded-2xl shadow-xl border border-gray-100">
          <thead>
            <tr className="bg-gradient-to-r from-primary-50 to-primary-100 border-b border-primary-200">
              <th className="p-6 text-left font-bold text-gray-900">Plán</th>
              <th className="p-6 text-left font-bold text-gray-900">CPU</th>
              <th className="p-6 text-left font-bold text-gray-900">RAM</th>
              <th className="p-6 text-left font-bold text-gray-900">NVMe SSD</th>
              <th className="p-6 text-left font-bold text-gray-900">Cena/měsíc</th>
              <th className="p-6"></th>
            </tr>
          </thead>
          <tbody>
            {visiblePlans.map((p, index) => (
              <tr key={p.id} className="border-b border-gray-100 hover:bg-primary-25 transition-colors group">
                <td className="p-6">
                  <div className="font-bold text-lg text-gray-900">{p.name}</div>
                  {index === 1 && <span className="inline-block bg-primary-100 text-primary-700 text-xs font-semibold px-2 py-1 rounded-full mt-1">Nejpopulárnější</span>}
                </td>
                <td className="p-6 text-gray-700 font-medium">{p.cpu}</td>
                <td className="p-6 text-gray-700 font-medium">{p.ram}</td>
                <td className="p-6 text-gray-700 font-medium">{p.storage}</td>
                <td className="p-6">
                  <div className="text-2xl font-bold text-primary-600">{p.price}</div>
                  <div className="text-sm text-gray-500">bez DPH</div>
                </td>
                <td className="p-6">
                  <button
                    onClick={() => handleAddToCart(p)}
                    className="bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:bg-primary-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 group-hover:scale-105"
                  >
                    Přidat do košíku
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden grid gap-6">
        {visiblePlans.map((p, index) => (
          <div key={p.id} className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 relative overflow-hidden">
            {index === 1 && (
              <div className="absolute top-0 right-0 bg-primary-600 text-white px-4 py-2 rounded-bl-2xl text-sm font-semibold">
                Nejpopulárnější
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{p.name}</h3>
              <div className="text-3xl font-bold text-primary-600 mb-1">{p.price}</div>
              <div className="text-sm text-gray-500">bez DPH / měsíc</div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-primary-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700"><strong>CPU:</strong> {p.cpu}</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-primary-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700"><strong>RAM:</strong> {p.ram}</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-primary-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700"><strong>Storage:</strong> {p.storage} NVMe SSD</span>
              </div>
            </div>

            <button
              onClick={() => handleAddToCart(p)}
              className="w-full bg-primary-600 text-white px-6 py-4 rounded-xl font-semibold shadow-lg hover:bg-primary-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            >
              Přidat do košíku
            </button>
          </div>
        ))}
      </div>

      <div className="text-center text-gray-500 mt-8">
        <p className="text-sm">Všechny ceny jsou uvedeny bez DPH. Aktivace do 24 hodin.</p>
      </div>
    </div>
  );
}
