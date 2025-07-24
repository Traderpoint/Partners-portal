// HostBill Affiliate Tracking Library
class HostBillAffiliate {
  constructor(config) {
    this.hostbillUrl = config.hostbillUrl || 'https://your-hostbill-domain.com'
    this.affiliateParam = config.affiliateParam || 'aff'
    this.cookieName = config.cookieName || 'hb_affiliate'
    this.cookieDuration = config.cookieDuration || 30 // days
    this.debug = config.debug || false
    
    this.init()
  }

  // Initialize affiliate tracking
  init() {
    this.trackAffiliate()
    this.loadTrackingScript()
  }

  // Track affiliate from URL parameter
  trackAffiliate() {
    const urlParams = new URLSearchParams(window.location.search)
    const affiliateId = urlParams.get(this.affiliateParam)
    
    if (affiliateId) {
      this.setAffiliateCookie(affiliateId)
      this.log(`Affiliate tracked: ${affiliateId}`)
    }
  }

  // Set affiliate cookie
  setAffiliateCookie(affiliateId) {
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + this.cookieDuration)
    
    document.cookie = `${this.cookieName}=${affiliateId}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`
  }

  // Get affiliate ID from cookie
  getAffiliateId() {
    const cookies = document.cookie.split(';')
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=')
      if (name === this.cookieName) {
        return value
      }
    }
    return null
  }

  // Load HostBill tracking script
  loadTrackingScript() {
    const script = document.createElement('script')
    script.src = `${this.hostbillUrl}/includes/affiliate/tracking.js`
    script.async = true
    script.onload = () => this.log('HostBill tracking script loaded')
    script.onerror = () => this.log('Failed to load HostBill tracking script', 'error')
    document.head.appendChild(script)
  }

  // Track conversion (order completion)
  trackConversion(orderData) {
    const affiliateId = this.getAffiliateId()
    if (!affiliateId) return

    const conversionData = {
      affiliate_id: affiliateId,
      order_id: orderData.orderId,
      amount: orderData.amount,
      currency: orderData.currency || 'CZK',
      products: orderData.products || []
    }

    // Send conversion to HostBill
    fetch(`${this.hostbillUrl}/includes/affiliate/conversion.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(conversionData)
    })
    .then(response => response.json())
    .then(data => {
      this.log('Conversion tracked successfully', data)
    })
    .catch(error => {
      this.log('Conversion tracking failed', 'error', error)
    })
  }

  // Generate affiliate link
  generateAffiliateLink(url, affiliateId) {
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}${this.affiliateParam}=${affiliateId}`
  }

  // Track page view
  trackPageView(page) {
    const affiliateId = this.getAffiliateId()
    if (!affiliateId) return

    fetch(`${this.hostbillUrl}/includes/affiliate/pageview.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        affiliate_id: affiliateId,
        page: page,
        referrer: document.referrer,
        timestamp: Date.now()
      })
    })
    .catch(error => this.log('Page view tracking failed', 'error', error))
  }

  // Debug logging
  log(message, type = 'info', data = null) {
    if (!this.debug) return
    
    const timestamp = new Date().toISOString()
    const logMessage = `[HostBill Affiliate ${timestamp}] ${message}`
    
    switch (type) {
      case 'error':
        console.error(logMessage, data)
        break
      case 'warn':
        console.warn(logMessage, data)
        break
      default:
        console.log(logMessage, data)
    }
  }
}

// Export for use in Next.js
export default HostBillAffiliate

// Global initialization function
export const initHostBillAffiliate = (config) => {
  if (typeof window !== 'undefined') {
    window.hostbillAffiliate = new HostBillAffiliate(config)
    return window.hostbillAffiliate
  }
  return null
}
