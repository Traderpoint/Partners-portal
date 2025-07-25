import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useCart } from '../contexts/CartContext';
import PricingTable from '../components/PricingTable';
import { ToastContainer, useToast } from '../components/Toast';
import { extractAffiliateParams, storeAffiliateData, validateAffiliateId } from '../utils/affiliate';

export default function Pricing() {
  const router = useRouter();
  const { setAffiliate } = useCart();
  const [affiliateInfo, setAffiliateInfo] = useState(null);
  const [affiliateValidated, setAffiliateValidated] = useState(false);
  const { toasts, removeToast, showAffiliate, showError } = useToast();

  // Handle affiliate tracking on page load
  useEffect(() => {
    const handleAffiliateTracking = async () => {
      const affiliateParams = extractAffiliateParams(window.location.href);
      
      if (affiliateParams.id || affiliateParams.code) {
        console.log('Pricing - Affiliate parameters found:', affiliateParams);
        
        storeAffiliateData(affiliateParams);
        setAffiliate(affiliateParams.id, affiliateParams.code);
        
        if (affiliateParams.id) {
          try {
            const isValid = await validateAffiliateId(affiliateParams.id);
            if (isValid) {
              setAffiliateValidated(true);
              
              const response = await fetch(`/api/validate-affiliate?id=${affiliateParams.id}`);
              const result = await response.json();
              if (result.success && result.affiliate) {
                setAffiliateInfo(result.affiliate);
                showAffiliate(`Vítejte na ceníku! Partner: ${result.affiliate.name}`, 5000);
              }
            } else {
              showError('Neplatný affiliate kód', 3000);
            }
          } catch (error) {
            console.error('Error validating affiliate:', error);
          }
        }
        
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
  }, [router, setAffiliate, showAffiliate, showError]);

  return (
    <div className="container mx-auto py-16 max-w-4xl">
      {/* Affiliate Banner */}
      {affiliateInfo && affiliateValidated && (
        <div className="mb-8 bg-gradient-to-r from-green-500 to-blue-600 text-white py-4 px-6 rounded-lg shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 715.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium">
                Přišli jste přes partnera: <span className="font-bold">{affiliateInfo.name}</span>
              </p>
              <p className="text-sm opacity-90">Vaše objednávka bude přiřazena k tomuto partnerovi</p>
            </div>
            <div className="ml-auto">
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium">
                Partner ID: {affiliateInfo.id}
              </span>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-4xl font-bold mb-4">Systrix Cloud & VPS Ceník</h1>
      <p className="mb-6">Vyberte si plán, který vám nejvíce vyhovuje. Kliknutím na Objednat pokračujete do objednávky v HostBill.</p>
      
      <PricingTable />
      
      <div className="mt-8 text-gray-500 text-sm">Ceny jsou uvedeny bez DPH.</div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
