/**
 * API endpoint for validating affiliate codes/IDs
 * GET /api/validate-affiliate?id=AFFILIATE_ID
 */

import HostBillOrderService from '../../lib/hostbill-order';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        valid: false,
        error: 'Affiliate ID is required'
      });
    }

    console.log(`🔍 Validating affiliate ID: ${id}`);

    const orderService = new HostBillOrderService();
    const affiliate = await orderService.validateAffiliateCode(id);

    if (affiliate) {
      res.status(200).json({
        success: true,
        valid: true,
        affiliate: {
          id: affiliate.id,
          name: affiliate.name,
          status: affiliate.status
        }
      });
    } else {
      res.status(200).json({
        success: true,
        valid: false,
        message: 'Affiliate not found or inactive'
      });
    }

  } catch (error) {
    console.error('❌ Affiliate validation error:', error);

    res.status(500).json({
      success: false,
      valid: false,
      error: 'Failed to validate affiliate',
      details: error.message
    });
  }
}
