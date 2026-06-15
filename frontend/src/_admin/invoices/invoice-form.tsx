"use client"
import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import type { InvoiceData, InvoiceItem } from "./invoice-types"
import { Plus, Minus, FileText, ArrowLeft, Save } from "lucide-react"

interface InvoiceFormProps {
  isEdit?: boolean
}

export default function InvoiceForm({ isEdit = false }: InvoiceFormProps) {
  const { companyId, invoiceId } = useParams<{ companyId?: string; invoiceId?: string }>()
  const navigate = useNavigate()
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    invoiceNumber: "",
    Date: new Date().toISOString().split("T")[0],
    dueDate: new Date().toISOString().split("T")[0],
    poNumber: "",
    type: "Tax",
    companyId: companyId || "",
    billTo: {
      name: "",
      address: "",
      gstin: "",
    },
    shipTo: {
      name: "",
      address: "",
    },
    items: [
      {
        productName: "",
        hsnCode: "",
        quantity: 1,
        rate: 0,
        amount: 0,
      },
    ],
    subtotal: 0,
    cgstRate: 9,
    cgstAmount: 0,
    sgstRate: 9,
    sgstAmount: 0,
    ugstRate: 0,
    ugstAmount: 0,
    igstRate: 0,
    igstAmount: 0,
    totalTaxAmount: 0,
    totalAmount: 0,
    paymentTerms:
      "Net 30 Days from invoice date\nPayment via NEFT/RTGS/Cheque\nDelayed payments subject to 1.5% monthly interest",
    termsConditions:
      "Warranty provided as per contract\nGoods once sold will not be taken back\nAll disputes subject to Delhi jurisdiction",
    bankDetails: {
      bankName: "Yes Bank Limited",
      accountName: "SUSAKGJYO BUSINESS PVT. LTD",
      accountNumber: "038263400000072",
      ifscCode: "YESB0000382",
    },
  })

  // Fetch next invoice number (only for new creation)
  const fetchNextInvoiceNumber = async () => {
    try {
      const response = await axios.get("https://susainvoice.onrender.com/api/invoice/nextInvoiceNumber", {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (response.data && response.data.nextInvoiceNumber) {
        setInvoiceData((prev) => ({
          ...prev,
          invoiceNumber: response.data.nextInvoiceNumber.toString(),
        }))
      }
    } catch (error) {
      console.error("Error fetching invoice number", error)
    }
  }

  // Fetch company details by ID
  const fetchCompanyDetails = async (id: string) => {
    try {
      const response = await axios.get(`https://susainvoice.onrender.com/api/companies/getById/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (response.data) {
        const company = response.data
        setInvoiceData((prev) => ({
          ...prev,
          billTo: {
            name: company.name || "",
            address: company.address || "",
            gstin: company.gstNumber || "",
          },
        }))
      }
    } catch (error) {
      console.error("Error fetching company details", error)
    }
  }

  // Fetch invoice details for editing
  const fetchInvoiceForEdit = async (id: string) => {
    try {
      const response = await axios.get(`https://susainvoice.onrender.com/api/invoice/getbyId/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (response.data && response.data.success) {
        setInvoiceData(response.data.data)
      }
    } catch (error) {
      console.error("Error fetching invoice details for edit", error)
    }
  }

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true)
      if (isEdit && invoiceId) {
        await fetchInvoiceForEdit(invoiceId)
      } else {
        if (companyId) {
          await Promise.all([fetchNextInvoiceNumber(), fetchCompanyDetails(companyId)])
        }
      }
      setIsLoading(false)
    }
    initialize()
  }, [companyId, invoiceId, isEdit])

  const updateInvoiceField = (path: string, value: any) => {
    setInvoiceData(prev => {
      const keys = path.split('.')
      const newData = { ...prev }
      let current: any = newData

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {}
        }
        current = current[keys[i]]
      }
      current[keys[keys.length - 1]] = value
      return newData
    })
  }

  const calculateAmounts = () => {
    setInvoiceData(prev => {
      const subtotal = prev.items.reduce((sum, item) => {
        const qty = parseFloat(String(item.quantity)) || 0
        const rate = parseFloat(String(item.rate)) || 0
        return sum + (qty * rate)
      }, 0)

      const cgst = (subtotal * (prev.cgstRate || 0)) / 100
      const sgst = (subtotal * (prev.sgstRate || 0)) / 100
      const ugst = (subtotal * (prev.ugstRate || 0)) / 100
      const igst = (subtotal * (prev.igstRate || 0)) / 100
      const totalTax = cgst + sgst + ugst + igst
      const totalAmount = subtotal + totalTax

      return {
        ...prev,
        subtotal,
        cgstAmount: cgst,
        sgstAmount: sgst,
        ugstAmount: ugst,
        igstAmount: igst,
        totalTaxAmount: totalTax,
        totalAmount: totalAmount,
        // Make sure item amounts are also calculated individually
        items: prev.items.map(item => {
          const qty = parseFloat(String(item.quantity)) || 0
          const rate = parseFloat(String(item.rate)) || 0
          return {
            ...item,
            amount: qty * rate
          }
        })
      }
    })
  }

  // Recalculate when items or tax rates change
  useEffect(() => {
    calculateAmounts()
  }, [invoiceData.cgstRate, invoiceData.sgstRate, invoiceData.igstRate, invoiceData.ugstRate])

  const addItem = () => {
    const newItem: InvoiceItem = {
      productName: "",
      hsnCode: "",
      quantity: 1,
      rate: 0,
      amount: 0,
    }
    setInvoiceData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }))
  }

  const removeItem = (index: number) => {
    if (invoiceData.items.length <= 1) return
    setInvoiceData(prev => {
      const newItems = prev.items.filter((_, i) => i !== index)
      const subtotal = newItems.reduce((sum, item) => {
        const qty = parseFloat(String(item.quantity)) || 0
        const rate = parseFloat(String(item.rate)) || 0
        return sum + (qty * rate)
      }, 0)
      const cgst = (subtotal * (prev.cgstRate || 0)) / 100
      const sgst = (subtotal * (prev.sgstRate || 0)) / 100
      const ugst = (subtotal * (prev.ugstRate || 0)) / 100
      const igst = (subtotal * (prev.igstRate || 0)) / 100
      const totalTax = cgst + sgst + ugst + igst
      return {
        ...prev,
        items: newItems,
        subtotal,
        cgstAmount: cgst,
        sgstAmount: sgst,
        ugstAmount: ugst,
        igstAmount: igst,
        totalTaxAmount: totalTax,
        totalAmount: subtotal + totalTax
      }
    })
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    setInvoiceData(prev => {
      const newItems = [...prev.items]
      newItems[index] = {
        ...newItems[index],
        [field]: value
      }

      // Recalculate item amount
      if (field === 'quantity' || field === 'rate') {
        const qty = parseFloat(String(newItems[index].quantity)) || 0
        const rate = parseFloat(String(newItems[index].rate)) || 0
        newItems[index].amount = qty * rate
      }

      const subtotal = newItems.reduce((sum, item) => {
        const qty = parseFloat(String(item.quantity)) || 0
        const rate = parseFloat(String(item.rate)) || 0
        return sum + (qty * rate)
      }, 0)

      const cgst = (subtotal * (prev.cgstRate || 0)) / 100
      const sgst = (subtotal * (prev.sgstRate || 0)) / 100
      const ugst = (subtotal * (prev.ugstRate || 0)) / 100
      const igst = (subtotal * (prev.igstRate || 0)) / 100
      const totalTax = cgst + sgst + ugst + igst

      return {
        ...prev,
        items: newItems,
        subtotal,
        cgstAmount: cgst,
        sgstAmount: sgst,
        ugstAmount: ugst,
        igstAmount: igst,
        totalTaxAmount: totalTax,
        totalAmount: subtotal + totalTax
      }
    })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    // Validation
    if (!invoiceData.billTo.name || !invoiceData.billTo.address) {
      alert("Please fill in Client Name and Address")
      setIsSaving(false)
      return
    }

    if (invoiceData.items.some(item => !item.productName.trim())) {
      alert("Please enter a name for all items")
      setIsSaving(false)
      return
    }

    try {
      const token = localStorage.getItem('token')
      let response
      if (isEdit && invoiceId) {
        response = await axios.put(
          `https://susainvoice.onrender.com/api/invoice/updateById/${invoiceId}`,
          invoiceData,
          { headers: { Authorization: `Bearer ${token}` } }
        )
      } else {
        response = await axios.post(
          "https://susainvoice.onrender.com/api/invoice/add",
          invoiceData,
          { headers: { Authorization: `Bearer ${token}` } }
        )
      }

      if (response.data.success) {
        alert(isEdit ? "Invoice updated successfully!" : "Invoice created successfully!")
        navigate(`/admin/invoices/${invoiceData.companyId}`)
      } else {
        alert("Failed to save invoice")
      }
    } catch (error) {
      console.error("Error saving invoice", error)
      alert("Error saving invoice. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading form...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Back Link */}
        <button
          onClick={() => navigate(`/admin/invoices/${invoiceData.companyId}`)}
          className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 mb-6 font-semibold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Invoice List</span>
        </button>

        <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          {/* Form Header */}
          <div className="p-6 bg-slate-55 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {isEdit ? `Edit Invoice #${invoiceData.invoiceNumber}` : "Create New Invoice"}
                </h1>
                <p className="text-slate-500 text-xs mt-0.5">Fill in all invoice details below</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <label className="text-sm font-semibold text-slate-700">Invoice Type:</label>
              <select
                value={invoiceData.type}
                onChange={(e) => updateInvoiceField("type", e.target.value)}
                className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="Tax">Tax Invoice</option>
                <option value="Proforma">Proforma Invoice</option>
              </select>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Meta Details */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Invoice #</label>
                <input
                  type="text"
                  value={invoiceData.invoiceNumber}
                  onChange={(e) => updateInvoiceField("invoiceNumber", e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                  placeholder="e.g. 2521"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Date</label>
                <input
                  type="date"
                  value={invoiceData.Date}
                  onChange={(e) => updateInvoiceField("Date", e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Due Date</label>
                <input
                  type="date"
                  value={invoiceData.dueDate}
                  onChange={(e) => updateInvoiceField("dueDate", e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">PO Number</label>
                <input
                  type="text"
                  value={invoiceData.poNumber}
                  onChange={(e) => updateInvoiceField("poNumber", e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                  placeholder="PO number (optional)"
                />
              </div>
            </div>

            {/* Bill To & Ship To */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Bill To */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200/50">Bill To (Client)</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Client Name *</label>
                    <input
                      type="text"
                      value={invoiceData.billTo.name}
                      onChange={(e) => updateInvoiceField("billTo.name", e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:border-blue-500 outline-none"
                      placeholder="Client Name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Address *</label>
                    <textarea
                      value={invoiceData.billTo.address}
                      onChange={(e) => updateInvoiceField("billTo.address", e.target.value)}
                      rows={3}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:border-blue-500 outline-none resize-none"
                      placeholder="Address"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">GSTIN</label>
                    <input
                      type="text"
                      value={invoiceData.billTo.gstin}
                      onChange={(e) => updateInvoiceField("billTo.gstin", e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-slate-800 focus:border-blue-500 outline-none"
                      placeholder="GST Number (optional)"
                    />
                  </div>
                </div>
              </div>

              {/* Ship To */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200/50">Ship To</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Name</label>
                    <input
                      type="text"
                      value={invoiceData.shipTo.name}
                      onChange={(e) => updateInvoiceField("shipTo.name", e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:border-green-500 outline-none"
                      placeholder="Name (Leave blank to use Bill To)"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Address</label>
                    <textarea
                      value={invoiceData.shipTo.address}
                      onChange={(e) => updateInvoiceField("shipTo.address", e.target.value)}
                      rows={3}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:border-green-500 outline-none resize-none"
                      placeholder="Address (Leave blank to use Bill To)"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Items Grid */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-800">Items List</h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Row
                </button>
              </div>

              <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-12">#</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Description of Goods</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-32">HSN Code</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-24">Qty</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider w-36">Rate (₹)</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider w-36">Amount (₹)</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {invoiceData.items.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-50/20">
                        <td className="px-4 py-3 text-sm text-slate-500 font-semibold">{index + 1}</td>
                        <td className="px-4 py-3">
                          <textarea
                            value={item.productName}
                            onChange={(e) => updateItem(index, "productName", e.target.value)}
                            placeholder="Enter item description&#10;(Press Enter for secondary description)"
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 resize-y"
                            rows={2}
                            required
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={item.hsnCode || ""}
                            onChange={(e) => updateItem(index, "hsnCode", e.target.value)}
                            placeholder="HSN"
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm text-center outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={item.quantity}
                            min="1"
                            onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 0)}
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm text-center outline-none focus:border-blue-500"
                            required
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={item.rate}
                            min="0"
                            step="0.01"
                            onChange={(e) => updateItem(index, "rate", parseFloat(e.target.value) || 0)}
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm text-right outline-none focus:border-blue-500"
                            required
                          />
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-slate-800">
                          ₹{((parseFloat(String(item.quantity)) || 0) * (parseFloat(String(item.rate)) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            disabled={invoiceData.items.length <= 1}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Calculations & Taxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              {/* Left Side: Bank Details, Terms */}
              <div className="space-y-6">
                {/* Bank Details */}
                <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Bank Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={invoiceData.bankDetails.bankName}
                        onChange={(e) => updateInvoiceField("bankDetails.bankName", e.target.value)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Account Name</label>
                      <input
                        type="text"
                        value={invoiceData.bankDetails.accountName}
                        onChange={(e) => updateInvoiceField("bankDetails.accountName", e.target.value)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Account Number</label>
                      <input
                        type="text"
                        value={invoiceData.bankDetails.accountNumber}
                        onChange={(e) => updateInvoiceField("bankDetails.accountNumber", e.target.value)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">IFSC Code</label>
                      <input
                        type="text"
                        value={invoiceData.bankDetails.ifscCode}
                        onChange={(e) => updateInvoiceField("bankDetails.ifscCode", e.target.value)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Terms & Conditions</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Payment Terms</label>
                      <textarea
                        value={invoiceData.paymentTerms}
                        onChange={(e) => updateInvoiceField("paymentTerms", e.target.value)}
                        rows={2}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Warranty & Disclaimers</label>
                      <textarea
                        value={invoiceData.termsConditions}
                        onChange={(e) => updateInvoiceField("termsConditions", e.target.value)}
                        rows={2}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Totals & Tax Percentages */}
              <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Subtotal */}
                  <div className="flex justify-between items-center text-sm font-semibold text-slate-600">
                    <span>Subtotal:</span>
                    <span>₹{invoiceData.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>

                  <div className="border-t border-slate-200/50 my-2"></div>

                  {/* GST Configurations */}
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">GST Tax Config (%)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">CGST (%)</label>
                      <input
                        type="number"
                        value={invoiceData.cgstRate}
                        onChange={(e) => updateInvoiceField("cgstRate", parseFloat(e.target.value) || 0)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-center outline-none"
                      />
                      <div className="text-right text-[10px] text-slate-500 mt-0.5">
                        ₹{invoiceData.cgstAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">SGST (%)</label>
                      <input
                        type="number"
                        value={invoiceData.sgstRate}
                        onChange={(e) => updateInvoiceField("sgstRate", parseFloat(e.target.value) || 0)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-center outline-none"
                      />
                      <div className="text-right text-[10px] text-slate-500 mt-0.5">
                        ₹{invoiceData.sgstAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">IGST (%)</label>
                      <input
                        type="number"
                        value={invoiceData.igstRate}
                        onChange={(e) => updateInvoiceField("igstRate", parseFloat(e.target.value) || 0)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-center outline-none"
                      />
                      <div className="text-right text-[10px] text-slate-500 mt-0.5">
                        ₹{invoiceData.igstAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">UGST (%)</label>
                      <input
                        type="number"
                        value={invoiceData.ugstRate}
                        onChange={(e) => updateInvoiceField("ugstRate", parseFloat(e.target.value) || 0)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-center outline-none"
                      />
                      <div className="text-right text-[10px] text-slate-500 mt-0.5">
                        ₹{invoiceData.ugstAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200/50 my-2"></div>

                  {/* Total Tax Amount */}
                  <div className="flex justify-between items-center text-sm font-semibold text-slate-600">
                    <span>Total Tax:</span>
                    <span>₹{invoiceData.totalTaxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Final Total Amount */}
                <div className="bg-blue-600 text-white p-4 rounded-xl flex justify-between items-center mt-6">
                  <span className="font-bold text-sm">Grand Total:</span>
                  <span className="text-xl font-extrabold">₹{invoiceData.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(`/admin/invoices/${invoiceData.companyId}`)}
              className="px-5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-md disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
