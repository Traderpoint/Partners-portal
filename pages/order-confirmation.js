import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function OrderConfirmation() {
  const router = useRouter();
  const { orderId, orderNumber, realOrder } = router.query;
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const orderIdentifier = orderNumber || orderId;
    if (orderIdentifier) {
      const { affiliate } = router.query;

      if (realOrder === 'true' && orderNumber) {
        // Direct display of order number from checkout
        setOrderDetails({
          id: orderId,
          order_number: orderNumber,
          status: 'confirmed',
          createdAt: new Date().toISOString(),
          affiliateId: affiliate || '1',
          product: 'VPS Service',
          price: 'Podle tarifu'
        });
        setLoading(false);

        // Track conversion for affiliate
        if (affiliate) {
          trackConversion(orderIdentifier, affiliate);
        }
      } else {
        // Get real order details from HostBill
        fetchOrderDetails(orderIdentifier, affiliate);
      }
    }
  }, [orderId, orderNumber, realOrder, router.query]);

  const fetchOrderDetails = async (orderId, affiliate) => {
    try {
      console.log('🔍 Fetching order details for:', orderId);

      // Get order details from HostBill
      const response = await fetch('/api/hostbill/get-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order_id: orderId })
      });

      const result = await response.json();

      if (result.success && result.response.data.orders) {
        const order = result.response.data.orders.find(o => o.id === orderId.toString());

        if (order) {
          console.log('✅ Order found:', order);

          setOrderDetails({
            id: orderId,
            order_number: order.number,
            status: order.status,
            createdAt: order.date_created,
            affiliateId: affiliate || '1',
            product: 'VPS Service',
            price: `${order.total} CZK`,
            client_name: `${order.firstname} ${order.lastname}`,
            invoice_id: order.invoice_id,
            invoice_status: order.invstatus
          });
        } else {
          console.warn('⚠️ Order not found in HostBill, using fallback');
          // Fallback to basic details
          setOrderDetails({
            id: orderId,
            order_number: null,
            status: 'pending',
            createdAt: new Date().toISOString(),
            affiliateId: affiliate || '1',
            product: 'VPS Service',
            price: 'N/A'
          });
        }
      } else {
        console.error('❌ Failed to get order details:', result);
        // Fallback
        setOrderDetails({
          id: orderId,
          order_number: null,
          status: 'unknown',
          createdAt: new Date().toISOString(),
          affiliateId: affiliate || '1',
          product: 'VPS Service',
          price: 'N/A'
        });
      }

      // Track conversion for affiliate
      if (affiliate) {
        trackConversion(orderId, affiliate);
      }

    } catch (error) {
      console.error('❌ Error fetching order details:', error);

      // Fallback to basic details
      setOrderDetails({
        id: orderId,
        order_number: null,
        status: 'error',
        createdAt: new Date().toISOString(),
        affiliateId: affiliate || '1',
        product: 'VPS Service',
        price: 'N/A'
      });
    } finally {
      setLoading(false);
    }
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

  if (!orderId && !orderNumber) {
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
            <span className="font-semibold">{orderDetails.order_number || `Order #${orderId}`}</span>
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
