"use client"
import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../../utils/api"
import { ArrowLeft, Printer, MapPin, Phone, Mail, Download } from "lucide-react"
// @ts-ignore
import html2pdf from "html2pdf.js"
import type { InvoiceData } from "./invoice-types"
import logo from "../../assets/logo1.jpeg"
import stamp from "../../assets/stamp.png"
import { CURRENCIES } from "../../utils/currencies"

export default function InvoiceDetails() {
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const navigate = useNavigate()
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showStamp, setShowStamp] = useState(true)

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      if (!invoiceId) {
        setError("No invoice ID provided")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await api.get(`/api/invoice/getbyId/${invoiceId}`)

        if (response.data.success) {
          setInvoiceData(response.data.data)
        } else {
          setError("Failed to fetch invoice details")
        }
      } catch (err) {
        setError("Error loading invoice details")
      } finally {
        setLoading(false)
      }
    }

    fetchInvoiceDetails()
  }, [invoiceId])

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = (copyType: 'ORIGINAL' | 'DUPLICATE') => {
    const targetId = copyType === 'ORIGINAL' ? "invoice-original-area" : "invoice-duplicate-area"
    const element = document.getElementById(targetId)
    if (!element) return

    const opt = {
      margin: 0,
      filename: `${invoiceData?.type === "Proforma" ? "Proforma" : "Tax"}_Invoice_${invoiceData?.invoiceNumber || "Invoice"}_${copyType}.pdf`,
      image: { type: "jpeg", quality: 1.0 },
      html2canvas: {
        scale: 4,
        useCORS: true,
        logging: false,
        letterRendering: true
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait", compress: true }
    }

    // @ts-ignore
    html2pdf().set(opt).from(element).save()
  }

  // Convert numbers to words with multi-currency support
  const numberToWords = (num: number, currencyCode: string = 'INR'): string => {
    const activeCurrency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0]

    const a = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
    ]
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

    const formatTens = (n: number) => {
      if (n < 20) return a[n]
      const digit = n % 10
      return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : '')
    }

    const formatHundreds = (n: number) => {
      if (n > 99) {
        return a[Math.floor(n / 100)] + ' Hundred ' + (n % 100 ? 'and ' + formatTens(n % 100) : '')
      }
      return formatTens(n)
    }

    const convertIndian = (n: number): string => {
      if (n === 0) return 'Zero'

      const crores = Math.floor(n / 10000000)
      n %= 10000000

      const lakhs = Math.floor(n / 100000)
      n %= 100000

      const thousands = Math.floor(n / 1000)
      n %= 1000

      let str = ''
      if (crores) str += formatHundreds(crores) + ' Crore '
      if (lakhs) str += formatHundreds(lakhs) + ' Lakh '
      if (thousands) str += formatHundreds(thousands) + ' Thousand '
      if (n) str += formatHundreds(n)

      return str.trim()
    }

    const convertInternational = (n: number): string => {
      if (n === 0) return 'Zero'

      let parts = []

      const billions = Math.floor(n / 1000000000)
      if (billions) {
        parts.push(formatHundreds(billions) + ' Billion')
        n %= 1000000000
      }

      const millions = Math.floor(n / 1000000)
      if (millions) {
        parts.push(formatHundreds(millions) + ' Million')
        n %= 1000000
      }

      const thousands = Math.floor(n / 1000)
      if (thousands) {
        parts.push(formatHundreds(thousands) + ' Thousand')
        n %= 1000
      }

      if (n) {
        parts.push(formatHundreds(n))
      }

      return parts.join(' ').trim()
    }

    const integerPart = Math.floor(num)
    const decimalPart = Math.round((num - integerPart) * 100)

    let integerWords = activeCurrency.useIndianFormat ? convertIndian(integerPart) : convertInternational(integerPart)
    let result = integerWords + ' ' + activeCurrency.name

    if (decimalPart > 0) {
      let decimalWords = activeCurrency.useIndianFormat ? convertIndian(decimalPart) : convertInternational(decimalPart)
      result += ' and ' + decimalWords + ' ' + activeCurrency.subUnit
    }

    result += ' Only'
    return result
  }

  const renderInvoiceSheet = (copyType: 'ORIGINAL' | 'DUPLICATE') => {
    if (!invoiceData) return null
    const activeCurrency = CURRENCIES.find(c => c.code === (invoiceData.currency || 'INR')) || CURRENCIES[0]

    return (
      <>
        {/* Original/Duplicate Box and centered Tax/Proforma Invoice header */}
        <div className="relative w-full flex justify-center items-center mb-6">
          <h1 className="text-blue-600 font-bold text-base md:text-lg tracking-wide">
            {invoiceData.type === 'Proforma' ? 'Proforma Invoice' : 'Tax Invoice'}
          </h1>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 border-2 border-slate-950 px-3 py-1 text-[11px] font-extrabold text-black uppercase tracking-wider">
            {copyType}
          </div>
        </div>

        {/* Header Section */}
        <div className="flex justify-between items-start border-b border-slate-200 pb-4 mb-6">
          <div className="flex items-start space-x-4">
            <img src={logo} alt="Susalabs Logo" className="h-12 w-auto object-contain mt-1" />
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">SUSAKGJYO BUSINESS PVT. LTD</h2>
              <div className="flex items-start text-[10.5px] text-slate-800 mt-1 leading-normal max-w-sm">
                <MapPin className="w-3.5 h-3.5 text-blue-600 mr-1.5 mt-0.5 flex-shrink-0" />
                <span>1404, DLF CORPORATE GREEN, SECTOR 74-A, GURGAON, HARYANA -122004 (INDIA)</span>
              </div>
              <p className="text-[10.5px] text-slate-800 font-bold mt-1 pl-5">
                GSTIN: 06AAYCS5019E1Z3 &nbsp;&nbsp;&nbsp;&nbsp; PAN: AAYCS5019E
              </p>
              <div className="flex items-center text-[10.5px] text-slate-800 mt-1 space-x-4">
                <div className="flex items-center">
                  <Phone className="w-3.5 h-3.5 text-blue-600 mr-1.5 flex-shrink-0" />
                  <span>+91-8595591496, 0124-4147286</span>
                </div>
                <div className="flex items-center">
                  <Mail className="w-3.5 h-3.5 text-blue-600 mr-1.5 flex-shrink-0" />
                  <span>Contact@susalabs.com</span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-right text-xs min-w-[200px]">
            <table className="w-full text-[12px]">
              <tbody>
                <tr>
                  <td className="text-slate-800 py-1 text-left font-medium">Invoice #:</td>
                  <td className="text-slate-900 py-1 text-right font-medium">{invoiceData.invoiceNumber}</td>
                </tr>
                <tr>
                  <td className="text-slate-800 py-1 text-left font-medium">Date:</td>
                  <td className="text-slate-900 py-1 text-right font-medium">
                    {invoiceData.Date ? new Date(invoiceData.Date).toISOString().split('T')[0] : ''}
                  </td>
                </tr>
                {invoiceData.dueDate && (
                  <tr>
                    <td className="text-slate-800 py-1 text-left font-medium">Due Date:</td>
                    <td className="text-slate-900 py-1 text-right font-medium">
                      {new Date(invoiceData.dueDate).toISOString().split('T')[0]}
                    </td>
                  </tr>
                )}
                <tr>
                  <td className="text-slate-800 py-1 text-left font-medium">P.O. #:</td>
                  <td className="text-slate-900 py-1 text-right font-medium">{invoiceData.poNumber || ""}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Bill To & Ship To Grid */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Bill To */}
          <div className="border-l-4 border-blue-600 bg-slate-50/70 p-5 flex flex-col justify-between">
            <div className="text-[12px] font-extrabold text-blue-600 uppercase tracking-wider mb-2">
              BILL TO
            </div>
            <div className="text-[12px] leading-relaxed flex-1">
              <div className="font-bold text-slate-900 text-xs uppercase">{invoiceData.billTo.name}</div>
              <div className="text-slate-800 mt-2 whitespace-pre-line leading-relaxed font-medium">
                {invoiceData.billTo.address}
              </div>
              {invoiceData.billTo.gstin && (
                <div className="text-slate-900 font-bold mt-2">
                  GSTIN: {invoiceData.billTo.gstin.toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Ship To */}
          <div className="border-l-4 border-blue-600 bg-slate-50/70 p-5 flex flex-col justify-between">
            <div className="text-[12px] font-extrabold text-blue-600 uppercase tracking-wider mb-2">
              SHIP TO
            </div>
            <div className="text-[12px] leading-relaxed flex-1">
              <div className="font-bold text-slate-900 text-xs uppercase">
                {invoiceData.shipTo?.name || invoiceData.billTo.name}
              </div>
              <div className="text-slate-800 mt-2 whitespace-pre-line leading-relaxed font-medium">
                {invoiceData.shipTo?.address || invoiceData.billTo.address}
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-6 overflow-hidden rounded-lg border border-slate-200 shadow-sm print:shadow-none">
          <table className="w-full text-left border-collapse text-[11px] border-hidden">
            <thead>
              <tr className="bg-blue-600 text-white font-bold border-b border-blue-600">
                <th className="px-3 py-2.5 w-10 text-center border border-white/20">#</th>
                <th className="px-3 py-2.5 border border-white/20">Description</th>
                <th className="px-3 py-2.5 w-24 text-center border border-white/20">HSN/SAC</th>
                <th className="px-3 py-2.5 w-16 text-center border border-white/20">Qty</th>
                <th className="px-3 py-2.5 w-24 text-right border border-white/20">Rate ({activeCurrency.symbol})</th>
                <th className="px-3 py-2.5 w-28 text-right border border-white/20">Amount ({activeCurrency.symbol})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700 bg-white">
              {invoiceData.items.map((item, index) => {
                const qty = parseFloat(String(item.quantity)) || 0
                const rate = parseFloat(String(item.rate)) || 0
                const amt = qty * rate

                return (
                  <tr key={index} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2.5 text-center text-slate-400 font-semibold border border-slate-200">{index + 1}</td>
                    <td className="px-3 py-2.5 border border-slate-200">
                      {(() => {
                        const lines = (item.productName || '').split('\n')
                        return (
                          <div>
                            <div className="font-bold text-slate-800">{lines[0]}</div>
                            {lines.slice(1).map((line, idx) => (
                              <div key={idx} className="text-slate-500 font-medium mt-0.5">{line}</div>
                            ))}
                          </div>
                        )
                      })()}
                    </td>
                    <td className="px-3 py-2.5 text-center font-medium text-slate-500 border border-slate-200">{item.hsnCode || "-"}</td>
                    <td className="px-3 py-2.5 text-center font-semibold text-slate-800 border border-slate-200">{qty}</td>
                    <td className="px-3 py-2.5 text-right border border-slate-200">
                      {activeCurrency.symbol}{rate.toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-slate-900 border border-slate-200">
                      {activeCurrency.symbol}{amt.toFixed(2)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {/* Table Summary Footer */}
            <tfoot>
              <tr className="bg-slate-50">
                <td colSpan={4} className="bg-white border-t border-slate-200"></td>
                <td className="px-3 py-2 text-right font-bold text-slate-700 border border-slate-200">Subtotal</td>
                <td className="px-3 py-2 text-right font-bold text-slate-800 border border-slate-200">
                  {activeCurrency.symbol}{invoiceData.subtotal.toFixed(2)}
                </td>
              </tr>
              <tr className="bg-slate-50">
                <td colSpan={5} className="px-3 py-2 text-right font-bold text-slate-750 border border-slate-200">
                  Taxes: {invoiceData.cgstRate || 0}% CGST + {invoiceData.sgstRate || 0}% SGST + {invoiceData.ugstRate || 0}% UGST + {invoiceData.igstRate || 0}% IGST
                </td>
                <td className="px-3 py-2 text-right font-bold text-slate-800 border border-slate-200">
                  {activeCurrency.symbol}{invoiceData.totalTaxAmount.toFixed(2)}
                </td>
              </tr>
              <tr className="bg-[#e6f0fa] font-extrabold text-xs">
                <td colSpan={5} className="px-3 py-2.5 text-right text-slate-900 border border-slate-200 font-extrabold uppercase">
                  Total Amount
                </td>
                <td className="px-3 py-2.5 text-right text-blue-900 border border-slate-200 font-extrabold text-sm">
                  {activeCurrency.symbol}{invoiceData.totalAmount.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Amount in words block */}
        <div className="mb-6 p-3 bg-slate-50 border border-slate-100 rounded-md text-[11px]">
          <span className="font-bold text-slate-800">Amount in Words: </span>
          <span className="text-slate-800 font-medium">{numberToWords(invoiceData.totalAmount, invoiceData.currency)}</span>
        </div>

        {/* Terms and Bank details block in two columns */}
        <div className="grid grid-cols-2 gap-8 items-start mb-6">
          {/* Left Column: Terms */}
          <div className="space-y-4 text-[10.5px] leading-relaxed">
            {invoiceData.paymentTerms && (
              <div>
                <h4 className="font-bold text-blue-600 mb-1">Payment Terms</h4>
                <div className="whitespace-pre-line text-slate-800 font-medium">{invoiceData.paymentTerms}</div>
              </div>
            )}
            {invoiceData.termsConditions && (
              <div>
                <h4 className="font-bold text-blue-600 mb-1">Terms & Conditions</h4>
                <div className="whitespace-pre-line text-slate-800 font-medium">
                  {invoiceData.termsConditions.replace("Delhi jurisdiction", "Gurgaon jurisdiction")}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Bank Details */}
          {invoiceData.bankDetails && (
            <div className="text-[10.5px] leading-relaxed">
              <h4 className="font-bold text-blue-600 mb-2">Bank Details</h4>
              <table className="w-full text-left font-medium text-slate-800">
                <tbody>
                  <tr>
                    <td className="py-0.5 font-bold text-slate-800 w-24">Bank Name:</td>
                    <td className="py-0.5 text-slate-900">{invoiceData.bankDetails.bankName || "-"}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 font-bold text-slate-800">Account Name:</td>
                    <td className="py-0.5 text-slate-900">{invoiceData.bankDetails.accountName || "-"}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 font-bold text-slate-800">Account No.:</td>
                    <td className="py-0.5 text-slate-950 font-bold font-mono">{invoiceData.bankDetails.accountNumber || "-"}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 font-bold text-slate-800">IFSC Code:</td>
                    <td className="py-0.5 text-slate-955 font-bold font-mono">{invoiceData.bankDetails.ifscCode || "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Declaration & Signatures */}
        <div className="border-t border-slate-300 pt-6 mt-8 flex justify-between items-end min-h-24 relative">
          {/* Stamp placed neatly on the left */}
          <div className="flex flex-col items-start relative min-h-[80px]">
            <div className="relative w-40 flex flex-col items-center">
              {/* Authorized stamp overlaying slightly */}
              {showStamp && (
                <img src={stamp} alt="Authorized Stamp" className="absolute -top-4 h-16 w-auto object-contain opacity-90" />
              )}
              <div className="text-[11px] font-bold text-slate-800 mt-6 text-center">Authorised Signatory</div>
            </div>
            <div className="text-[10px] text-slate-900 font-bold mt-2">
              For SUSAKGJYO BUSINESS PVT. LTD
            </div>
          </div>

          {/* Customer Signature on the right */}
          <div className="flex flex-col items-center min-h-[80px] justify-end">
            <div className="border-b border-slate-400 w-44 mb-1.5"></div>
            <div className="text-[11px] font-bold text-slate-800 text-center">Customer Signature</div>
          </div>
        </div>
      </>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center print:hidden">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading invoice details...</p>
        </div>
      </div>
    )
  }

  if (error || !invoiceData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 print:hidden">
        <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-md">
          <div className="text-red-500 font-bold text-lg mb-2">Error</div>
          <p className="text-slate-600 mb-6">{error || "Invoice details not found."}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6 print:bg-white print:p-0">
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide admin layout elements: header, sidebar, action buttons */
          header, aside, .print-hidden, button {
            display: none !important;
          }
          /* Reset parent layout heights and backgrounds */
          body, html, #root, main, .flex-1, .h-screen, .min-h-screen {
            height: auto !important;
            min-height: auto !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }
          /* Ensure invoice content stretches fully with no screen-specific borders or shadows */
          #invoice-print-area {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
          }
          /* Suppress browser default header (page title/date) and footer (URL/page numbers) */
          @page {
            size: auto;
            margin: 10mm 12mm 10mm 12mm;
          }
        }
      `}} />

      {/* Top action bar - Hidden when printing */}
      <div className="max-w-4xl mx-auto flex justify-between items-center mb-6 print-hidden print:hidden">
        <button
          onClick={() => navigate(`/admin/invoices/${invoiceData.companyId}`)}
          className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 font-semibold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Invoices</span>
        </button>
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer bg-white px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              checked={showStamp}
              onChange={(e) => setShowStamp(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
            />
            <span>Show Stamp</span>
          </label>
          <button
            onClick={() => handleDownloadPDF('ORIGINAL')}
            className="inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Download Original
          </button>
          <button
            onClick={() => handleDownloadPDF('DUPLICATE')}
            className="inline-flex items-center px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Download Duplicate
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Print Invoice
          </button>
        </div>
      </div>

      {/* Invoice Sheet container */}
      <div
        id="invoice-print-area"
        className="max-w-4xl mx-auto space-y-8 print:space-y-0"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* Original Copy Sheet */}
        <div
          id="invoice-original-area"
          className="bg-white p-8 border border-slate-200 shadow-xl rounded-none print:border-none print:shadow-none print:p-0 print:rounded-none"
        >
          {renderInvoiceSheet('ORIGINAL')}
        </div>

        {/* Page Break for Print/PDF */}
        <div className="page-break" style={{ pageBreakBefore: 'always', height: 0, overflow: 'hidden' }}></div>

        {/* Duplicate Copy Sheet */}
        <div
          id="invoice-duplicate-area"
          className="bg-white p-8 border border-slate-200 shadow-xl rounded-none print:border-none print:shadow-none print:p-0 print:rounded-none print:mt-0"
        >
          {renderInvoiceSheet('DUPLICATE')}
        </div>
      </div>
    </div>
  )
}
