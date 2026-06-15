import Invoice from '../models/invoices.js';
import Company from '../models/company.js';

// GET /api/dashboard/summary?companyId=optional
export const getDashboardSummary = async (req, res) => {
  try {
    const { companyId } = req.query || {};

    const match = {};
    if (companyId) {
      match.companyId = companyId;
    }

    // Parallel queries
    const [
      totalCompanies,
      totalInvoices,
      typeAgg,
      totalRevenueAgg,
      recentInvoices
    ] = await Promise.all([
      Company.countDocuments({}),
      Invoice.countDocuments(companyId ? { companyId } : {}),
      Invoice.aggregate([
        { $match: match },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      Invoice.aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$totalAmount', 0] } } } }
      ]),
      Invoice.find(match)
        .sort({ createdAt: -1 })
        .limit(5)
        .select('_id invoiceNumber type totalAmount Date billTo.name')
        .lean()
    ]);

    const typeCounts = typeAgg.reduce((acc, cur) => {
      acc[cur._id || 'Tax'] = cur.count;
      return acc;
    }, {});

    const summary = {
      totalCompanies,
      totalInvoices,
      taxInvoices: typeCounts['Tax'] || 0,
      proformaInvoices: typeCounts['Proforma'] || 0,
      totalRevenue: (totalRevenueAgg[0]?.total || 0),
      recentInvoices
    };

    return res.json({ success: true, data: summary });
  } catch (err) {
    console.error('Dashboard summary error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err?.message });
  }
};
