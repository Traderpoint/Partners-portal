/**
 * HostBill Affiliate Tracking Script
 * Umístění: /includes/affiliate/tracking.js
 * Verze: 1.0.0
 * 
 * Tento soubor nahrajte na váš HostBill server do složky:
 * /path/to/hostbill/includes/affiliate/tracking.js
 */

(function() {
    'use strict';
    
    // HostBill Affiliate Tracking Script
    window.HostBillTracking = {
        version: '1.0.0',
        apiUrl: '/includes/affiliate/api.php',
        debug: false,
        
        init: function() {
            this.log('HostBill Affiliate Tracking initialized');
            this.trackVisit();
            this.bindEvents();
        },
        
        trackVisit: function() {
            var affiliateId = this.getAffiliateId();
            if (!affiliateId) {
                this.log('No affiliate ID found');
                return;
            }
            
            this.log('Tracking visit for affiliate: ' + affiliateId);
            this.sendRequest('track_visit', {
                affiliate_id: affiliateId,
                page: window.location.pathname,
                referrer: document.referrer,
                timestamp: Date.now()
            });
        },
        
        trackConversion: function(orderData) {
            var affiliateId = this.getAffiliateId();
            if (!affiliateId) {
                this.log('No affiliate ID for conversion tracking');
                return;
            }
            
            this.log('Tracking conversion for affiliate: ' + affiliateId, orderData);
            this.sendRequest('track_conversion', {
                affiliate_id: affiliateId,
                order_id: orderData.orderId,
                amount: orderData.amount,
                currency: orderData.currency || 'CZK',
                products: orderData.products || [],
                timestamp: Date.now()
            });
        },
        
        trackPageView: function(page) {
            var affiliateId = this.getAffiliateId();
            if (!affiliateId) return;
            
            this.sendRequest('track_pageview', {
                affiliate_id: affiliateId,
                page: page || window.location.pathname,
                referrer: document.referrer,
                timestamp: Date.now()
            });
        },
        
        getAffiliateId: function() {
            // Try to get from cookie first
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = cookies[i].trim();
                if (cookie.indexOf('hb_affiliate=') === 0) {
                    return cookie.substring('hb_affiliate='.length);
                }
            }
            
            // Try to get from URL parameter
            var urlParams = new URLSearchParams(window.location.search);
            var affiliateId = urlParams.get('aff');
            if (affiliateId) {
                this.setAffiliateCookie(affiliateId);
                return affiliateId;
            }
            
            return null;
        },
        
        setAffiliateCookie: function(affiliateId) {
            var expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30); // 30 days
            
            document.cookie = 'hb_affiliate=' + affiliateId + 
                '; expires=' + expiryDate.toUTCString() + 
                '; path=/; SameSite=Lax';
            
            this.log('Affiliate cookie set: ' + affiliateId);
        },
        
        sendRequest: function(action, data) {
            var self = this;
            var xhr = new XMLHttpRequest();
            
            xhr.open('POST', this.apiUrl, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        try {
                            var response = JSON.parse(xhr.responseText);
                            self.log('API Response:', response);
                        } catch (e) {
                            self.log('Failed to parse API response', 'error');
                        }
                    } else {
                        self.log('API request failed: ' + xhr.status, 'error');
                    }
                }
            };
            
            var payload = JSON.stringify({
                action: action,
                data: data
            });
            
            this.log('Sending request:', payload);
            xhr.send(payload);
        },
        
        bindEvents: function() {
            var self = this;
            
            // Track form submissions (for conversions)
            var forms = document.querySelectorAll('form[data-affiliate-track]');
            for (var i = 0; i < forms.length; i++) {
                forms[i].addEventListener('submit', function(e) {
                    var orderData = {
                        orderId: this.dataset.orderId || 'form-' + Date.now(),
                        amount: this.dataset.amount || 0,
                        currency: this.dataset.currency || 'CZK',
                        products: this.dataset.products ? this.dataset.products.split(',') : []
                    };
                    self.trackConversion(orderData);
                });
            }
            
            // Track clicks on affiliate links
            var links = document.querySelectorAll('a[data-affiliate-track]');
            for (var i = 0; i < links.length; i++) {
                links[i].addEventListener('click', function(e) {
                    self.trackPageView(this.href);
                });
            }
        },
        
        log: function(message, type, data) {
            if (!this.debug) return;
            
            var timestamp = new Date().toISOString();
            var logMessage = '[HostBill Affiliate ' + timestamp + '] ' + message;
            
            switch (type) {
                case 'error':
                    console.error(logMessage, data || '');
                    break;
                case 'warn':
                    console.warn(logMessage, data || '');
                    break;
                default:
                    console.log(logMessage, data || '');
            }
        }
    };
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            window.HostBillTracking.init();
        });
    } else {
        window.HostBillTracking.init();
    }
    
    // Global functions for manual tracking
    window.trackAffiliateConversion = function(orderData) {
        window.HostBillTracking.trackConversion(orderData);
    };
    
    window.trackAffiliatePageView = function(page) {
        window.HostBillTracking.trackPageView(page);
    };
    
})();
