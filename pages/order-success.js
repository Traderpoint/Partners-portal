import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function OrderSuccess() {
  const router = useRouter();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get order data from session storage
    const storedData = sessionStorage.getItem('orderResult');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        setOrderData(data);
        // Clear the data after use
        sessionStorage.removeItem('orderResult');
      } catch (error) {
        console.error('Error parsing order data:', error);
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Načítání...</p>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Chyba</h1>
            <p className="text-gray-600 mb-6">Nepodařilo se načíst údaje o objednávce.</p>
            <Link href="/pricing" className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors">
              Zpět na ceník
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Success Header */}
          <div className="bg-green-50 px-6 py-8 text-center">
            <div className="text-green-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Objednávka úspěšně vytvořena!</h1>
            <p className="text-gray-600">Děkujeme za vaši objednávku. Brzy vás budeme kontaktovat.</p>
          </div>

          {/* Order Details */}
          <div className="px-6 py-8">
            {/* Client Information */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Informace o zákazníkovi</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium text-gray-700">Jméno:</span>
                    <span className="ml-2 text-gray-900">{orderData.client.name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Email:</span>
                    <span className="ml-2 text-gray-900">{orderData.client.email}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Client ID:</span>
                    <span className="ml-2 text-gray-900">#{orderData.client.id}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Affiliate Information */}
            {orderData.affiliate && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Affiliate Partner</h2>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="text-blue-500 mr-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{orderData.affiliate.name}</p>
                      <p className="text-sm text-gray-600">Partner ID: #{orderData.affiliate.id}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Orders */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Objednané služby</h2>
              <div className="space-y-4">
                {orderData.orders.map((order, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{order.productName}</h3>
                        <p className="text-sm text-gray-600 mt-1">Order ID: #{order.orderId}</p>
                        {order.invoiceId && (
                          <p className="text-sm text-gray-600">Invoice ID: #{order.invoiceId}</p>
                        )}
                      </div>
                      <div className="text-green-600 font-medium">
                        <svg className="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Vytvořeno
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Errors (if any) */}
            {orderData.errors && orderData.errors.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-red-600 mb-4">Upozornění</h2>
                <div className="bg-red-50 rounded-lg p-4">
                  <ul className="list-disc list-inside space-y-1">
                    {orderData.errors.map((error, index) => (
                      <li key={index} className="text-red-700">{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Další kroky</h2>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">1.</span>
                  Na váš email jsme odeslali potvrzení objednávky
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">2.</span>
                  Brzy vás budeme kontaktovat ohledně dalších kroků
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">3.</span>
                  Vaše služby budou aktivovány po zpracování platby
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pricing" className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors text-center">
                Objednat další služby
              </Link>
              <Link href="/" className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors text-center">
                Zpět na hlavní stránku
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
