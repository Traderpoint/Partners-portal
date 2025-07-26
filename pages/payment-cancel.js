import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function PaymentCancel() {
  const router = useRouter();
  const [cancelDetails, setCancelDetails] = useState(null);

  useEffect(() => {
    // Get cancellation parameters from URL
    const { orderId, invoiceId, paymentId, reason } = router.query;

    if (orderId || invoiceId || paymentId) {
      setCancelDetails({
        orderId,
        invoiceId,
        paymentId,
        reason: reason || 'Platba byla zrušena uživatelem',
        timestamp: new Date().toISOString()
      });

      // Log cancellation for analytics
      console.log('❌ Payment cancelled:', {
        orderId,
        invoiceId,
        paymentId,
        reason,
        timestamp: new Date().toISOString()
      });
    }
  }, [router.query]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Systrix</span>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          
          {/* Cancellation Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 text-center mb-8">
            {/* Cancel Icon */}
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Platba byla zrušena
            </h1>
            
            <p className="text-gray-600 mb-6">
              Vaše platba byla zrušena a žádné peníze nebyly strženy. 
              Můžete zkusit platbu znovu nebo zvolit jiný způsob platby.
            </p>

            {/* Cancellation Details */}
            {cancelDetails && (
              <div className="bg-gray-50 rounded-lg p-4 text-left mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Detaily zrušení</h3>
                <div className="space-y-2 text-sm">
                  {cancelDetails.orderId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Objednávka:</span>
                      <span className="font-medium">#{cancelDetails.orderId}</span>
                    </div>
                  )}
                  {cancelDetails.paymentId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Platba ID:</span>
                      <span className="font-medium">{cancelDetails.paymentId}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Důvod:</span>
                    <span className="font-medium">{cancelDetails.reason}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Čas zrušení:</span>
                    <span className="font-medium">
                      {new Date(cancelDetails.timestamp).toLocaleString('cs-CZ')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/payment"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Zkusit platbu znovu
              </Link>
              <Link
                href="/vps"
                className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Změnit objednávku
              </Link>
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-blue-50 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-bold mb-4 text-blue-900">Potřebujete pomoc?</h2>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">Zkuste jiný způsob platby</h3>
                  <p className="text-blue-700 text-sm">
                    Můžete zvolit platební kartu, bankovní převod nebo PayPal.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">Zkontrolujte údaje</h3>
                  <p className="text-blue-700 text-sm">
                    Ujistěte se, že máte dostatek prostředků a správně vyplněné údaje.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">Kontaktujte podporu</h3>
                  <p className="text-blue-700 text-sm">
                    Pokud problém přetrvává, naše podpora vám ráda pomůže.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Stále máte problémy s platbou?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                📞 Kontaktovat podporu
              </Link>
              <Link
                href="/faq"
                className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                ❓ Často kladené otázky
              </Link>
            </div>
          </div>

          {/* Additional Info */}
          <div className="text-center text-sm text-gray-500 mt-8">
            <p>
              Vaše objednávka zůstává aktivní po dobu 24 hodin. 
              Můžete se k ní kdykoli vrátit a dokončit platbu.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
