// Utility functions for affiliate tracking and HostBill integration

/**
 * Extract affiliate parameters from URL
 * @param {string} url - The URL to parse
 * @returns {object} - Object containing affiliate ID and code
 */
export function extractAffiliateParams(url) {
  const urlParams = new URLSearchParams(url.split('?')[1] || '');
  
  return {
    id: urlParams.get('aff') || urlParams.get('affiliate') || urlParams.get('ref'),
    code: urlParams.get('aff_code') || urlParams.get('affiliate_code'),
    campaign: urlParams.get('campaign') || urlParams.get('utm_campaign'),
    source: urlParams.get('source') || urlParams.get('utm_source'),
    medium: urlParams.get('medium') || urlParams.get('utm_medium')
  };
}

/**
 * Store affiliate information in localStorage
 * @param {object} affiliateData - Affiliate data to store
 */
export function storeAffiliateData(affiliateData) {
  if (typeof window !== 'undefined') {
    const dataToStore = {
      ...affiliateData,
      timestamp: Date.now(),
      expires: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
    };
    
    localStorage.setItem('affiliate_data', JSON.stringify(dataToStore));
  }
}

/**
 * Retrieve affiliate information from localStorage
 * @returns {object|null} - Stored affiliate data or null if expired/not found
 */
export function getStoredAffiliateData() {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('affiliate_data');
      if (stored) {
        const data = JSON.parse(stored);
        
        // Check if data has expired
        if (data.expires && Date.now() > data.expires) {
          localStorage.removeItem('affiliate_data');
          return null;
        }
        
        return data;
      }
    } catch (error) {
      console.error('Error retrieving affiliate data:', error);
    }
  }
  
  return null;
}

/**
 * Generate HostBill cart URL with affiliate tracking
 * @param {array} items - Array of cart items
 * @param {object} affiliateData - Affiliate tracking data
 * @param {string} hostbillUrl - Base HostBill URL
 * @returns {string} - Complete cart URL with affiliate tracking
 */
export function generateHostBillCartUrl(items, affiliateData = {}, hostbillUrl = 'https://vas-hostbill.cz') {
  if (!items || items.length === 0) {
    return `${hostbillUrl}/cart.php`;
  }

  let cartUrl = `${hostbillUrl}/cart.php?`;
  
  // Add first product
  const firstItem = items[0];
  cartUrl += `a=add&pid=${firstItem.hostbillPid}`;
  
  if (firstItem.quantity > 1) {
    cartUrl += `&qty=${firstItem.quantity}`;
  }
  
  // Add additional products
  if (items.length > 1) {
    items.slice(1).forEach(item => {
      cartUrl += `&pid[]=${item.hostbillPid}`;
      if (item.quantity > 1) {
        cartUrl += `&qty[${item.hostbillPid}]=${item.quantity}`;
      }
    });
  }
  
  // Add affiliate tracking parameters
  if (affiliateData.id) {
    cartUrl += `&aff=${affiliateData.id}`;
  }
  
  if (affiliateData.code) {
    cartUrl += `&aff_code=${affiliateData.code}`;
  }
  
  if (affiliateData.campaign) {
    cartUrl += `&campaign=${encodeURIComponent(affiliateData.campaign)}`;
  }
  
  if (affiliateData.source) {
    cartUrl += `&source=${encodeURIComponent(affiliateData.source)}`;
  }
  
  if (affiliateData.medium) {
    cartUrl += `&medium=${encodeURIComponent(affiliateData.medium)}`;
  }
  
  return cartUrl;
}

/**
 * Generate affiliate referral link for a specific product
 * @param {object} product - Product information
 * @param {string} affiliateId - Affiliate ID
 * @param {string} affiliateCode - Optional affiliate code
 * @param {string} baseUrl - Base URL of the site
 * @returns {string} - Affiliate referral link
 */
export function generateAffiliateLink(product, affiliateId, affiliateCode = null, baseUrl = 'https://systrix.cz') {
  let link = `${baseUrl}/pricing?product=${product.id}`;
  
  if (affiliateId) {
    link += `&aff=${affiliateId}`;
  }
  
  if (affiliateCode) {
    link += `&aff_code=${affiliateCode}`;
  }
  
  return link;
}

/**
 * Track affiliate conversion
 * @param {string} orderId - Order ID
 * @param {object} affiliateData - Affiliate data
 * @param {number} orderValue - Order value
 */
export async function trackAffiliateConversion(orderId, affiliateData, orderValue) {
  if (!affiliateData.id && !affiliateData.code) {
    return;
  }
  
  try {
    // Send conversion tracking to your analytics service
    // This could be Google Analytics, Facebook Pixel, or custom tracking
    
    // Example: Google Analytics 4 event
    if (typeof gtag !== 'undefined') {
      gtag('event', 'purchase', {
        transaction_id: orderId,
        value: orderValue,
        currency: 'CZK',
        affiliate_id: affiliateData.id,
        affiliate_code: affiliateData.code
      });
    }
    
    // Example: Facebook Pixel
    if (typeof fbq !== 'undefined') {
      fbq('track', 'Purchase', {
        value: orderValue,
        currency: 'CZK',
        content_ids: [orderId],
        custom_data: {
          affiliate_id: affiliateData.id,
          affiliate_code: affiliateData.code
        }
      });
    }
    
    // Send to your own tracking endpoint
    await fetch('/api/track-conversion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId,
        affiliateData,
        orderValue,
        timestamp: Date.now()
      })
    });
    
  } catch (error) {
    console.error('Error tracking affiliate conversion:', error);
  }
}

/**
 * Validate affiliate code/ID
 * @param {string} affiliateId - Affiliate ID to validate
 * @returns {Promise<boolean>} - Whether the affiliate ID is valid
 */
export async function validateAffiliateId(affiliateId) {
  if (!affiliateId) {
    return false;
  }
  
  try {
    const response = await fetch(`/api/validate-affiliate?id=${affiliateId}`);
    const result = await response.json();
    return result.valid === true;
  } catch (error) {
    console.error('Error validating affiliate ID:', error);
    return false;
  }
}

/**
 * Get affiliate commission rate for a product
 * @param {string} affiliateId - Affiliate ID
 * @param {string} productId - Product ID
 * @returns {Promise<number>} - Commission rate (percentage)
 */
export async function getAffiliateCommissionRate(affiliateId, productId) {
  try {
    const response = await fetch(`/api/affiliate-commission?affiliate=${affiliateId}&product=${productId}`);
    const result = await response.json();
    return result.rate || 0;
  } catch (error) {
    console.error('Error getting commission rate:', error);
    return 0;
  }
}

/**
 * Initialize affiliate tracking on page load
 */
export function initializeAffiliateTracking() {
  if (typeof window === 'undefined') {
    return;
  }
  
  // Extract affiliate parameters from current URL
  const affiliateParams = extractAffiliateParams(window.location.href);
  
  // If affiliate parameters are present, store them
  if (affiliateParams.id || affiliateParams.code) {
    storeAffiliateData(affiliateParams);
    
    // Optional: Clean URL by removing affiliate parameters
    const url = new URL(window.location);
    ['aff', 'affiliate', 'ref', 'aff_code', 'affiliate_code', 'campaign', 'utm_campaign', 'source', 'utm_source', 'medium', 'utm_medium'].forEach(param => {
      url.searchParams.delete(param);
    });
    
    // Update URL without reloading the page
    window.history.replaceState({}, document.title, url.toString());
  }
}

/**
 * Create affiliate dashboard data
 * @param {string} affiliateId - Affiliate ID
 * @returns {Promise<object>} - Affiliate dashboard data
 */
export async function getAffiliateDashboardData(affiliateId) {
  try {
    const response = await fetch(`/api/affiliate-dashboard?id=${affiliateId}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching affiliate dashboard data:', error);
    return null;
  }
}
