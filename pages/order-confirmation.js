import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function OrderConfirmation() {
  const router = useRouter();
  const { orderId } = router.query;
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      // In a real implementation, you would fetch order details from your API
      // For now, we'll simulate this
      setTimeout(() => {
        setOrderDetails({
          id: orderId,
          status: 'pending',
          createdAt: new Date().toISOString()
        });
        setLoading(false);
      }, 1000);
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="container mx-auto py-16 px-4 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p>Načítám detaily objednávky...</p>
      </div>
    );
  }

  if (!orderId) {
    return (
      <div className="container mx-auto py-16 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Objednávka nenalezena</h1>
        <p className="mb-8">Neplatné ID objednávky.</p>
        <Link
          href="/pricing"
          className="bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700"
        >
          Zpět na ceník
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-16 px-4 max-w-2xl">
      {/* Success Icon */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-green-600 mb-2">
          Objednávka byla úspěšně vytvořena!
        </h1>
        <p className="text-gray-600">
          Děkujeme za vaši objednávku. Brzy vás budeme kontaktovat.
        </p>
      </div>

      {/* Order Details */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Detaily objednávky</h2>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Číslo objednávky:</span>
            <span className="font-semibold">#{orderId}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Datum vytvoření:</span>
            <span className="font-semibold">
              {new Date().toLocaleDateString('cs-CZ')}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Stav:</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Čeká na zpracování
            </span>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-blue-50 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold mb-4 text-blue-900">Další kroky</h2>
        
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
              1
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">Potvrzení emailem</h3>
              <p className="text-blue-700 text-sm">
                Na váš email jsme odeslali potvrzení objednávky s dalšími instrukcemi.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
              2
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">Zpracování objednávky</h3>
              <p className="text-blue-700 text-sm">
                Naši specialisté vaši objednávku zpracují do 24 hodin.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
              3
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">Aktivace služeb</h3>
              <p className="text-blue-700 text-sm">
                Po dokončení platby vám zašleme přístupové údaje k vašim službám.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-gray-50 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Potřebujete pomoc?</h2>
        
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold">Technická podpora</h3>
            <p className="text-gray-600 text-sm">
              Email: <a href="mailto:podpora@systrix.cz" className="text-primary-600 hover:underline">podpora@systrix.cz</a>
            </p>
            <p className="text-gray-600 text-sm">
              Telefon: <a href="tel:+420123456789" className="text-primary-600 hover:underline">+420 123 456 789</a>
            </p>
          </div>

          <div>
            <h3 className="font-semibold">Obchodní oddělení</h3>
            <p className="text-gray-600 text-sm">
              Email: <a href="mailto:obchod@systrix.cz" className="text-primary-600 hover:underline">obchod@systrix.cz</a>
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/"
          className="bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 text-center font-semibold"
        >
          Zpět na hlavní stránku
        </Link>
        
        <Link
          href="/contact"
          className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-300 text-center font-semibold"
        >
          Kontaktovat podporu
        </Link>
      </div>

      {/* Additional Information */}
      <div className="mt-12 text-center text-sm text-gray-500">
        <p>
          Máte-li jakékoli dotazy ohledně vaší objednávky, neváhejte nás kontaktovat.
          Jsme tu pro vás 24/7.
        </p>
        
        <div className="mt-4 flex justify-center space-x-6">
          <a href="/terms" className="hover:text-primary-600">Obchodní podmínky</a>
          <a href="/privacy" className="hover:text-primary-600">Ochrana osobních údajů</a>
          <a href="/faq" className="hover:text-primary-600">FAQ</a>
        </div>
      </div>
    </div>
  );
}
