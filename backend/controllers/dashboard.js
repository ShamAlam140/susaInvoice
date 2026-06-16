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
      currencyGroups,
      recentInvoices
    ] = await Promise.all([
      Company.countDocuments({}),
      Invoice.countDocuments(companyId ? { companyId } : {}),
      Invoice.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              currency: { $ifNull: ['$currency', 'INR'] },
              type: { $ifNull: ['$type', 'Tax'] }
            },
            count: { $sum: 1 },
            totalAmount: { $sum: { $ifNull: ['$totalAmount', 0] } }
          }
        }
      ]),
      Invoice.find(match)
        .sort({ createdAt: -1 })
        .limit(5)
        .select('_id invoiceNumber type currency totalAmount Date billTo.name')
        .lean()
    ]);

    const breakdown = {};
    let globalTaxCount = 0;
    let globalProformaCount = 0;
    let globalRevenue = 0;

    currencyGroups.forEach(group => {
      const currency = group._id.currency || 'INR';
      const type = group._id.type || 'Tax';
      
      if (!breakdown[currency]) {
        breakdown[currency] = {
          currency,
          totalInvoices: 0,
          totalAmount: 0,
          taxCount: 0,
          taxAmount: 0,
          proformaCount: 0,
          proformaAmount: 0
        };
      }
      
      breakdown[currency].totalInvoices += group.count;
      breakdown[currency].totalAmount += group.totalAmount;
      globalRevenue += group.totalAmount;
      
      if (type === 'Tax') {
        breakdown[currency].taxCount = group.count;
        breakdown[currency].taxAmount = group.totalAmount;
        globalTaxCount += group.count;
      } else if (type === 'Proforma') {
        breakdown[currency].proformaCount = group.count;
        breakdown[currency].proformaAmount = group.totalAmount;
        globalProformaCount += group.count;
      }
    });

    const currencyBreakdown = Object.values(breakdown);

    const summary = {
      totalCompanies,
      totalInvoices,
      taxInvoices: globalTaxCount,
      proformaInvoices: globalProformaCount,
      totalRevenue: globalRevenue,
      currencyBreakdown,
      recentInvoices
    };

    return res.json({ success: true, data: summary });
  } catch (err) {
    console.error('Dashboard summary error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err?.message });
  }
};
