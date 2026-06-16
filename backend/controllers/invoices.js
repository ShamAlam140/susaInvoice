import Invoice from "../models/invoices.js";

// Helper function to generate next invoice number
const generateNextInvoiceNumber = async () => {
  try {
    const latestInvoice = await Invoice.findOne({}).sort({ createdAt: -1 }).select('invoiceNumber');
    let maxNumber = 2500;
    
    if (latestInvoice) {
      const num = parseInt(latestInvoice.invoiceNumber);
      if (!isNaN(num) && num > maxNumber) {
        maxNumber = num;
      }
    }
    
    return String(maxNumber + 1);
  } catch (error) {
    console.error('Error generating invoice number:', error);
    return '2501';
  }
};

// CREATE New Invoice
export const createInvoice = async (req, res) => {
  try {
    const nextInvoiceNumber = await generateNextInvoiceNumber();
    
    const invoiceData = {
      ...req.body,
      invoiceNumber: nextInvoiceNumber
    };
    
    const newInvoice = new Invoice(invoiceData);
    const savedInvoice = await newInvoice.save();

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: savedInvoice,
      invoiceNumber: nextInvoiceNumber
    });
  } catch (error) {
    console.error('❌ Error creating invoice:', error);
    res.status(400).json({
      success: false,
      error: error.message,
      details: error.errors || 'Unknown error'
    });
  }
};

// GET all invoices
export const getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// GET invoice by ID
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found"
      });
    }
    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// UPDATE invoice by ID
export const updateInvoiceById = async (req, res) => {
  try {
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedInvoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found"
      });
    }
    
    res.json({
      success: true,
      message: 'Invoice updated successfully',
      data: updatedInvoice
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// DELETE invoice by ID
export const deleteInvoiceById = async (req, res) => {
  try {
    const deletedInvoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!deletedInvoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found"
      });
    }
    res.json({
      success: true,
      message: "Invoice deleted successfully",
      data: deletedInvoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// GET next invoice number (for frontend preview)
export const getNextInvoiceNumber = async (req, res) => {
  try {
    const nextInvoiceNumber = await generateNextInvoiceNumber();
    res.json({
      success: true,
      nextInvoiceNumber
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// GET unique billTo records by GSTIN
export const getBillToList = async (req, res) => {
  try {
    const allBillTo = await Invoice.find({}, 'billTo');
    const uniqueGstin = new Set();
    const filteredBillTo = [];

    allBillTo.forEach(doc => {
      if (doc.billTo?.gstin && !uniqueGstin.has(doc.billTo.gstin)) {
        uniqueGstin.add(doc.billTo.gstin);
        filteredBillTo.push(doc.billTo);
      }
    });

    res.json({
      success: true,
      count: filteredBillTo.length,
      data: filteredBillTo
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error', 
      error: error.message 
    });
  }
};

// SEARCH invoices by GSTIN, name or address
export const searchInvoicesByIdentifier = async (req, res) => {
  try {
    const { identifier } = req.params;

    const query = {
      $or: [
        { "billTo.gstin": identifier },
        { "billTo.name": { $regex: new RegExp(identifier, "i") } },
        { "billTo.address": { $regex: new RegExp(identifier, "i") } },
      ],
    };

    const invoices = await Invoice.find(query, { 
      invoiceNumber: 1, 
      Date: 1, 
      type: 1, 
      currency: 1,
      totalAmount: 1,
      billTo: 1
    }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error",
      error: error.message
    });
  }
};

// GET Invoice Summary by Company ID
export const getInvoiceSummaryByCompanyId = async (req, res) => {
  try {
    const { companyId } = req.params;

    const invoices = await Invoice.find({ companyId }).sort({ createdAt: -1 });

    const summary = {
      totalInvoices: invoices.length,
      totalAmount: invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0),
      taxInvoices: invoices.filter(inv => inv.type === 'Tax').length,
      proformaInvoices: invoices.filter(inv => inv.type === 'Proforma').length
    };

    res.json({
      success: true,
      summary,
      data: invoices
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Internal Server Error', 
      error: error.message 
    });
  }
};
