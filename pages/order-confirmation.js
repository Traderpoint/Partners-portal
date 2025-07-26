import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function OrderConfirmation() {
  const router = useRouter();
  const { orderId, paymentId, manual } = router.query;
  const [orderDetails, setOrderDetails] = useState(null);
  const [paymentInstructions, setPaymentInstructions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      const { affiliate } = router.query;

      // Simulate order details
      setTimeout(() => {
        setOrderDetails({
          id: orderId,
          status: manual === 'true' ? 'pending_payment' : 'confirmed',
          createdAt: new Date().toISOString(),
          affiliateId: affiliate || '1',
          product: 'VPS Start',
          price: '1 CZK', // Test amount
          paymentMethod: getPaymentMethodFromId(paymentId)
        });

        // Add payment instructions for manual payments
        if (manual === 'true') {
          setPaymentInstructions({
            method: 'Bankovní převod',
            amount: '1 CZK',
            accountNumber: '123456789/0100',
            bankName: 'Komerční banka',
            variableSymbol: orderId.replace(/[^0-9]/g, '').slice(-10),
            specificSymbol: paymentId?.replace(/[^0-9]/g, '').slice(-10) || '001',
            message: `Platba za objednávku ${orderId}`,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('cs-CZ')
          });
        }

        setLoading(false);
      }, 1000);

      // Track conversion for affiliate
      if (affiliate) {
        trackConversion(orderId, affiliate);
      }
    }
  }, [orderId, paymentId, manual, router.query]);

  const getPaymentMethodFromId = (paymentId) => {
    if (!paymentId) return 'Neznámá';

    const id = paymentId.toLowerCase();
    if (id.includes('card') || id.includes('stripe')) return 'Platební karta';
    if (id.includes('paypal')) return 'PayPal';
    if (id.includes('bank')) return 'Bankovní převod';
    if (id.includes('crypto')) return 'Kryptoměny';

    return 'Online platba';
  };

  const trackConversion = async (orderId, affiliateId) => {
    try {
      console.log('🎯 Tracking conversion:', { orderId, affiliateId });

      // Call affiliate tracking API
      await fetch('/api/hostbill/affiliate-tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          affiliate_id: affiliateId,
          action: 'conversion',
          order_id: orderId,
          amount: 299,
          currency: 'CZK'
        })
      });

      console.log('✅ Conversion tracked successfully');
    } catch (error) {
      console.error('❌ Conversion tracking failed:', error);
    }
  };

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
          {orderDetails?.status === 'pending_payment'
            ? 'Objednávka vytvořena - čeká na platbu'
            : 'Objednávka byla úspěšně vytvořena!'
          }
        </h1>
        <p className="text-gray-600">
          {orderDetails?.status === 'pending_payment'
            ? 'Vaše objednávka byla vytvořena. Pro dokončení prosím proveďte platbu podle instrukcí níže.'
            : 'Děkujeme za vaši objednávku. Brzy vás budeme kontaktovat.'
          }
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
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              orderDetails?.status === 'pending_payment'
                ? 'bg-orange-100 text-orange-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {orderDetails?.status === 'pending_payment' ? 'Čeká na platbu' : 'Čeká na zpracování'}
            </span>
          </div>

          {orderDetails?.paymentMethod && (
            <div className="flex justify-between">
              <span className="text-gray-600">Způsob platby:</span>
              <span className="font-semibold">{orderDetails.paymentMethod}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-gray-600">Produkt:</span>
            <span className="font-semibold">{orderDetails?.product}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Cena:</span>
            <span className="font-semibold text-green-600">{orderDetails?.price}</span>
          </div>
        </div>
      </div>

      {/* Payment Instructions */}
      {paymentInstructions && (
        <div className="bg-orange-50 rounded-xl p-6 mb-8 border border-orange-200">
          <h2 className="text-xl font-bold mb-4 text-orange-900 flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            Platební instrukce
          </h2>

          <div className="bg-white rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Částka k úhradě</label>
                <div className="text-lg font-bold text-green-600">{paymentInstructions.amount}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Splatnost</label>
                <div className="text-lg font-semibold text-orange-600">{paymentInstructions.dueDate}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Číslo účtu</label>
                <div className="text-lg font-mono font-semibold">{paymentInstructions.accountNumber}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Banka</label>
                <div className="text-lg font-semibold">{paymentInstructions.bankName}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Variabilní symbol</label>
                <div className="text-lg font-mono font-semibold text-blue-600">{paymentInstructions.variableSymbol}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specifický symbol</label>
                <div className="text-lg font-mono font-semibold">{paymentInstructions.specificSymbol}</div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Zpráva pro příjemce</label>
              <div className="text-lg font-semibold">{paymentInstructions.message}</div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 className="font-semibold text-yellow-800 mb-1">Důležité upozornění</h4>
                <p className="text-sm text-yellow-700">
                  Prosím použijte přesně uvedené údaje pro platbu. Bez správného variabilního symbolu
                  nebude možné platbu automaticky přiřadit k vaší objednávce.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
