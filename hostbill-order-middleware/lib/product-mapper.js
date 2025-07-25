/**
 * Product Mapping Utility
 * Maps Cloud VPS product IDs to HostBill product IDs
 */

const logger = require('../utils/logger');

class ProductMapper {
  constructor() {
    this.mapping = this.loadMapping();
    this.reverseMapping = this.createReverseMapping();
  }

  /**
   * Load product mapping from environment variables
   * @returns {Object} Mapping object
   */
  loadMapping() {
    const mapping = {};
    
    // Load all PRODUCT_MAPPING_* environment variables
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('PRODUCT_MAPPING_')) {
        const cloudVpsId = key.replace('PRODUCT_MAPPING_', '');
        const hostbillId = process.env[key];
        
        if (cloudVpsId && hostbillId) {
          mapping[cloudVpsId] = hostbillId;
          logger.debug('Product mapping loaded', {
            cloudVpsId,
            hostbillId,
            envKey: key
          });
        }
      }
    });

    logger.info('Product mapping initialized', {
      totalMappings: Object.keys(mapping).length,
      mappings: mapping
    });

    return mapping;
  }

  /**
   * Create reverse mapping (HostBill -> Cloud VPS)
   * @returns {Object} Reverse mapping object
   */
  createReverseMapping() {
    const reverse = {};
    Object.keys(this.mapping).forEach(cloudVpsId => {
      const hostbillId = this.mapping[cloudVpsId];
      reverse[hostbillId] = cloudVpsId;
    });
    return reverse;
  }

  /**
   * Map Cloud VPS product ID to HostBill product ID
   * @param {string|number} cloudVpsProductId - Cloud VPS product ID
   * @returns {string|null} HostBill product ID or null if not found
   */
  mapToHostBill(cloudVpsProductId) {
    const id = String(cloudVpsProductId);
    const hostbillId = this.mapping[id];
    
    if (hostbillId) {
      logger.debug('Product mapped to HostBill', {
        cloudVpsId: id,
        hostbillId
      });
      return hostbillId;
    }

    logger.warn('No HostBill mapping found for Cloud VPS product', {
      cloudVpsId: id,
      availableMappings: Object.keys(this.mapping)
    });
    
    return null;
  }

  /**
   * Map HostBill product ID to Cloud VPS product ID
   * @param {string|number} hostbillProductId - HostBill product ID
   * @returns {string|null} Cloud VPS product ID or null if not found
   */
  mapToCloudVPS(hostbillProductId) {
    const id = String(hostbillProductId);
    const cloudVpsId = this.reverseMapping[id];
    
    if (cloudVpsId) {
      logger.debug('Product mapped to Cloud VPS', {
        hostbillId: id,
        cloudVpsId
      });
      return cloudVpsId;
    }

    logger.warn('No Cloud VPS mapping found for HostBill product', {
      hostbillId: id,
      availableReverseMappings: Object.keys(this.reverseMapping)
    });
    
    return null;
  }

  /**
   * Get all mappings
   * @returns {Object} All mappings
   */
  getAllMappings() {
    return {
      cloudVpsToHostBill: this.mapping,
      hostbillToCloudVps: this.reverseMapping
    };
  }

  /**
   * Validate if Cloud VPS product ID has mapping
   * @param {string|number} cloudVpsProductId - Cloud VPS product ID
   * @returns {boolean} True if mapping exists
   */
  hasCloudVpsMapping(cloudVpsProductId) {
    return String(cloudVpsProductId) in this.mapping;
  }

  /**
   * Validate if HostBill product ID has mapping
   * @param {string|number} hostbillProductId - HostBill product ID
   * @returns {boolean} True if mapping exists
   */
  hasHostBillMapping(hostbillProductId) {
    return String(hostbillProductId) in this.reverseMapping;
  }

  /**
   * Get mapping statistics
   * @returns {Object} Mapping statistics
   */
  getStats() {
    return {
      totalMappings: Object.keys(this.mapping).length,
      cloudVpsProducts: Object.keys(this.mapping),
      hostbillProducts: Object.keys(this.reverseMapping),
      mappings: this.mapping
    };
  }
}

// Export singleton instance
module.exports = new ProductMapper();
