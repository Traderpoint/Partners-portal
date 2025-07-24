import { useEffect } from 'react';
import { useRouter } from 'next/router';

const HostBillAffiliate = () => {
  const router = useRouter();

  useEffect(() => {
    // HostBill Affiliate Tracking Configuration
    const HOSTBILL_CONFIG = {
      // 🔧 Použití environment variables
      apiUrl: process.env.HOSTBILL_API_URL || 'https://vps.kabel1it.cz/api',
      affiliateUrl: process.env.NEXT_PUBLIC_HOSTBILL_URL || 'https://vps.kabel1it.cz/',
      trackingDomain: process.env.NEXT_PUBLIC_HOSTBILL_DOMAIN || 'vps.kabel1it.cz',
      apiKey: process.env.NEXT_PUBLIC_HOSTBILL_API_KEY || '341697c41aeb1c842f0d',
      
      // Tracking settings
      cookieDuration: 30, // days
      trackingParam: 'aff', // URL parameter for affiliate ID
      conversionGoal: 'purchase'
    };

    // Initialize HostBill Affiliate Tracking
    const initializeHostBillTracking = () => {
      // Create global tracking object
      window.hostbillAffiliate = {
        config: HOSTBILL_CONFIG,
        
        // Track affiliate visit (CSP-safe)
        trackVisit: (affiliateId) => {
          try {
            // Set affiliate cookie with secure settings
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + HOSTBILL_CONFIG.cookieDuration);

            const cookieValue = `hb_affiliate=${affiliateId}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
            document.cookie = cookieValue;

            // Send tracking request using fetch (CSP-safe)
            const trackingData = {
              aff: affiliateId,
              action: 'visit',
              url: window.location.href,
              referrer: document.referrer,
              timestamp: Date.now()
            };

            // Use fetch API endpoint for CSP compliance
            fetch('/api/hostbill/track-visit', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(trackingData)
            }).catch(error => {
              console.warn('⚠️ HostBill tracking fallback:', error);
              // Fallback to image pixel if API fails
              const trackingPixel = new Image();
              trackingPixel.src = `${HOSTBILL_CONFIG.affiliateUrl.replace(/\/$/, '')}/includes/affiliate/track.php?${new URLSearchParams(trackingData).toString()}`;
            });

            console.log('🎯 HostBill: Affiliate visit tracked', { affiliateId, url: window.location.href });

            // Store in localStorage for debugging (CSP-safe)
            const debugData = {
              affiliateId,
              visitTime: new Date().toISOString(),
              referrerUrl: document.referrer,
              landingPage: window.location.href
            };
            localStorage.setItem('hb_affiliate_data', JSON.stringify(debugData));

          } catch (error) {
            console.error('❌ HostBill tracking error:', error);
          }
        },

        // Track page view
        trackPageView: (page) => {
          try {
            const affiliateId = getCookie('hb_affiliate');
            if (affiliateId) {
              const trackingPixel = new Image();
              trackingPixel.src = `${HOSTBILL_CONFIG.affiliateUrl}/track.php?aff=${affiliateId}&action=pageview&page=${encodeURIComponent(page)}`;

              console.log('📄 HostBill: Page view tracked', { affiliateId, page });
            }
          } catch (error) {
            console.error('❌ HostBill page view tracking error:', error);
          }
        },

        // Track conversion (purchase)
        trackConversion: async (orderData) => {
          try {
            const affiliateId = getCookie('hb_affiliate');
            if (!affiliateId) {
              console.log('ℹ️ No affiliate ID found, skipping conversion tracking');
              return;
            }

            const conversionData = {
              affiliate_id: affiliateId,
              order_id: orderData.orderId,
              amount: orderData.amount,
              currency: orderData.currency || 'CZK',
              products: orderData.products || [],
              customer_email: orderData.customerEmail,
              conversion_time: new Date().toISOString(),
              
              // Additional data
              os: orderData.os,
              applications: orderData.applications,
              period: orderData.period,
              server_specs: orderData.serverSpecs
            };

            console.log('💰 HostBill: Tracking conversion', conversionData);

            // Method 1: Tracking pixel
            const trackingPixel = new Image();
            const pixelParams = new URLSearchParams({
              aff: affiliateId,
              action: 'conversion',
              order_id: orderData.orderId,
              amount: orderData.amount,
              currency: orderData.currency || 'CZK'
            });
            trackingPixel.src = `${HOSTBILL_CONFIG.affiliateUrl}/track.php?${pixelParams.toString()}`;

            // Method 2: API call to HostBill
            if (HOSTBILL_CONFIG.apiKey && HOSTBILL_CONFIG.apiKey !== 'your-api-key') {
              const apiResponse = await fetch(`${HOSTBILL_CONFIG.apiUrl}/affiliate/conversion`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${HOSTBILL_CONFIG.apiKey}`
                },
                body: JSON.stringify(conversionData)
              });

              if (apiResponse.ok) {
                const result = await apiResponse.json();
                console.log('✅ HostBill API: Conversion tracked successfully', result);
              } else {
                console.error('❌ HostBill API: Conversion tracking failed', await apiResponse.text());
              }
            }

            // Method 3: Send to your backend for processing
            await fetch('/api/hostbill/track-conversion', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(conversionData)
            });

            // Store conversion data for debugging
            localStorage.setItem('hb_conversion_data', JSON.stringify(conversionData));
            
            // Clear affiliate cookie after successful conversion
            document.cookie = 'hb_affiliate=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            
          } catch (error) {
            console.error('❌ HostBill conversion tracking error:', error);
          }
        },

        // Get current affiliate data
        getAffiliateData: () => {
          const affiliateId = getCookie('hb_affiliate');
          const visitData = localStorage.getItem('hb_affiliate_data');
          const conversionData = localStorage.getItem('hb_conversion_data');
          
          return {
            affiliateId,
            visitData: visitData ? JSON.parse(visitData) : null,
            conversionData: conversionData ? JSON.parse(conversionData) : null
          };
        },

        // Debug function
        debug: () => {
          console.log('🔍 HostBill Affiliate Debug Info:', {
            config: HOSTBILL_CONFIG,
            currentAffiliate: getCookie('hb_affiliate'),
            visitData: localStorage.getItem('hb_affiliate_data'),
            conversionData: localStorage.getItem('hb_conversion_data'),
            cookies: document.cookie
          });
        }
      };

      // Check for affiliate parameter in URL
      const urlParams = new URLSearchParams(window.location.search);
      const affiliateId = urlParams.get(HOSTBILL_CONFIG.trackingParam) || urlParams.get('affiliate');
      
      if (affiliateId) {
        window.hostbillAffiliate.trackVisit(affiliateId);
      }
    };

    // Helper function to get cookie value
    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return null;
    };

    // Initialize tracking when component mounts
    initializeHostBillTracking();

    // Track page views for affiliate analytics
    const handleRouteChange = (url) => {
      const affiliateId = getCookie('hb_affiliate');
      if (affiliateId) {
        const trackingPixel = new Image();
        trackingPixel.src = `${HOSTBILL_CONFIG.affiliateUrl}/track.php?aff=${affiliateId}&action=pageview&url=${encodeURIComponent(url)}`;
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    // Cleanup
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  return null; // This component doesn't render anything
};

export default HostBillAffiliate;
