import mongoose from 'mongoose';

const InvoiceSchema = new mongoose.Schema({
  // Invoice Number (Numeric stored as String)
  invoiceNumber: { type: String, unique: true, required: true },
  
  // Basic Invoice Details
  Date: { type: String, required: true },
  dueDate: { type: String, required: false },
  poNumber: { type: String, required: false },
  type: { type: String, enum: ['Tax', 'Proforma'], default: 'Tax', required: true }, // Tax or Proforma
  
  // Company Reference
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },

  // Billing Information
  billTo: {
    name: { type: String, required: false },
    address: { type: String, required: false },
    gstin: { type: String, required: false }
  },

  shipTo: {
    name: { type: String, required: false },
    address: { type: String, required: false }
  },

  // Items Array (Standard Invoice Items)
  items: [{
    productName: { type: String, required: true },
    hsnCode: { type: String, required: false },
    quantity: { type: Number, required: true, default: 1 },
    rate: { type: Number, required: true, default: 0 },
    amount: { type: Number, required: true }
  }],

  // Financial Details
  subtotal: { type: Number, required: true },
  cgstRate: { type: Number, default: 0 },
  cgstAmount: { type: Number, default: 0 },
  sgstRate: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  ugstRate: { type: Number, default: 0 },
  ugstAmount: { type: Number, default: 0 },
  igstRate: { type: Number, default: 0 },
  igstAmount: { type: Number, default: 0 },
  totalTaxAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  
  // Terms and Conditions
  paymentTerms: { type: String, required: false },
  termsConditions: { type: String, required: false },

  // Bank Details
  bankDetails: {
    bankName: { type: String, required: false },
    accountName: { type: String, required: false },
    accountNumber: { type: String, required: false },
    ifscCode: { type: String, required: false }
  }
}, {
  timestamps: true
});

export default mongoose.model('Invoice', InvoiceSchema);
