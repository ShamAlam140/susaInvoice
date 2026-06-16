export interface CompanyDetails {
  name: string
  address: string
  gstin: string
  pan?: string
  phone: string
  email: string
  logo: string
  stamp?: string
}

export interface InvoiceItem {
  productName: string
  hsnCode?: string
  quantity: number | string
  rate: number | string
  amount: number | string
}

export interface InvoiceData {
  _id?: string
  invoiceNumber: string
  Date: string
  dueDate: string
  poNumber: string
  type: 'Tax' | 'Proforma'
  currency?: string
  companyId: string
  billTo: {
    name: string
    address: string
    gstin: string
  }
  shipTo: {
    name: string
    address: string
  }
  items: InvoiceItem[]
  subtotal: number
  cgstRate: number
  cgstAmount: number
  sgstRate: number
  sgstAmount: number
  ugstRate: number
  ugstAmount: number
  igstRate: number
  igstAmount: number
  totalTaxAmount: number
  totalAmount: number
  paymentTerms: string
  termsConditions: string
  bankDetails: {
    bankName: string
    accountName: string
    accountNumber: string
    ifscCode: string
  }
}
