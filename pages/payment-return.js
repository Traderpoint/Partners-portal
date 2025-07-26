import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function PaymentReturn() {
  const router = useRouter();
  const [paymentStatus, setPaymentStatus] = useState('processing');
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get payment parameters from URL
    const { 
      orderId, 
      invoiceId, 
      paymentId, 
      status, 
      amount, 
      currency,
      method,
      transactionId 
    } = router.query;

    if (orderId || invoiceId || paymentId) {
      processPaymentReturn({
        orderId,
        invoiceId,
        paymentId,
        status,
        amount,
        currency,
        method,
        transactionId
      });
    }
  }, [router.query]);

  const processPaymentReturn = async (params) => {
    try {
      console.log('🔄 Processing payment return:', params);

      // Verify payment status with backend
      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
      });

      const result = await response.json();

      if (result.success) {
        setPaymentStatus(result.status || 'success');
        setPaymentDetails({
          orderId: params.orderId,
          invoiceId: params.invoiceId,
          paymentId: params.paymentId,
          amount: params.amount || result.amount,
          currency: params.currency || result.currency || 'CZK',
          method: params.method || result.method,
          transactionId: params.transactionId || result.transactionId,
          timestamp: new Date().toISOString()
        });
      } else {
        setPaymentStatus('failed');
        setPaymentDetails({
          orderId: params.orderId,
          error: result.error || 'Payment verification failed'
        });
      }
    } catch (error) {
      console.error('❌ Payment verification error:', error);
      setPaymentStatus('error');
      setPaymentDetails({
        orderId: params.orderId,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Ověřujeme platbu...</h2>
          <p className="text-gray-600">Prosím čekejte, zpracováváme výsledek platby.</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'success':
      case 'completed':
        return (
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'failed':
      case 'cancelled':
        return (
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'pending':
        return (
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getStatusTitle = () => {
    switch (paymentStatus) {
      case 'success':
      case 'completed':
        return 'Platba byla úspěšná!';
      case 'failed':
        return 'Platba se nezdařila';
      case 'cancelled':
        return 'Platba byla zrušena';
      case 'pending':
        return 'Platba je zpracovávána';
      default:
        return 'Neznámý stav platby';
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'success':
      case 'completed':
        return 'Vaše platba byla úspěšně zpracována. Objednávka bude brzy zpracována.';
      case 'failed':
        return paymentDetails?.error || 'Platba se nezdařila. Prosím zkuste to znovu nebo kontaktujte podporu.';
      case 'cancelled':
        return 'Platba byla zrušena. Můžete zkusit platbu znovu nebo zvolit jiný způsob platby.';
      case 'pending':
        return 'Platba je stále zpracovávána. Výsledek vám zašleme emailem.';
      default:
        return 'Nepodařilo se určit stav platby. Prosím kontaktujte podporu.';
    }
  };

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
          
          {/* Status Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 text-center mb-8">
            {getStatusIcon()}
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {getStatusTitle()}
            </h1>
            
            <p className="text-gray-600 mb-6">
              {getStatusMessage()}
            </p>

            {/* Payment Details */}
            {paymentDetails && (
              <div className="bg-gray-50 rounded-lg p-4 text-left mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Detaily platby</h3>
                <div className="space-y-2 text-sm">
                  {paymentDetails.orderId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Objednávka:</span>
                      <span className="font-medium">#{paymentDetails.orderId}</span>
                    </div>
                  )}
                  {paymentDetails.paymentId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Platba ID:</span>
                      <span className="font-medium">{paymentDetails.paymentId}</span>
                    </div>
                  )}
                  {paymentDetails.amount && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Částka:</span>
                      <span className="font-medium">{paymentDetails.amount} {paymentDetails.currency}</span>
                    </div>
                  )}
                  {paymentDetails.method && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Způsob platby:</span>
                      <span className="font-medium">{paymentDetails.method}</span>
                    </div>
                  )}
                  {paymentDetails.transactionId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transakce ID:</span>
                      <span className="font-medium font-mono text-xs">{paymentDetails.transactionId}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {paymentStatus === 'success' || paymentStatus === 'completed' ? (
                <>
                  <Link
                    href={`/order-confirmation?orderId=${paymentDetails?.orderId}`}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Zobrazit objednávku
                  </Link>
                  <Link
                    href="/vps"
                    className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    Pokračovat v nákupu
                  </Link>
                </>
              ) : paymentStatus === 'failed' || paymentStatus === 'cancelled' ? (
                <>
                  <Link
                    href="/payment"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Zkusit znovu
                  </Link>
                  <Link
                    href="/contact"
                    className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    Kontaktovat podporu
                  </Link>
                </>
              ) : (
                <Link
                  href="/"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Zpět na hlavní stránku
                </Link>
              )}
            </div>
          </div>

          {/* Additional Info */}
          <div className="text-center text-sm text-gray-500">
            <p>
              Máte problémy s platbou? {' '}
              <Link href="/contact" className="text-blue-600 hover:underline">
                Kontaktujte naši podporu
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
