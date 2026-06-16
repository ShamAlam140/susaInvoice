"use client"
import { useState, useEffect } from "react"
import axios from "axios"
import api from "../../utils/api"
import { useParams, useNavigate } from "react-router-dom"
import { Search, Plus, Eye, ChevronLeft, ChevronRight, Edit3, Trash2 } from "lucide-react"
import { CURRENCY_SYMBOLS } from "../../utils/currencies"

interface Invoice {
  _id: string
  invoiceNumber: string
  type: 'Tax' | 'Proforma'
  currency?: string
  totalAmount: number
  subtotal: number
  totalTaxAmount: number
  Date?: string
  dueDate?: string
  companyId: string
  billTo?: {
    name: string
    address: string
    gstin: string
  }
}

interface ApiResponse {
  success: boolean
  data: Invoice[]
  summary?: {
    totalInvoices: number
    totalAmount: number
    taxInvoices: number
    proformaInvoices: number
  }
  message?: string
}

export default function AllInvoices() {
  const { companyId } = useParams<{ companyId: string }>()
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState<Invoice[]>([])

  const formatInvoiceMoney = (amount: number, currencyCode: string = 'INR') => {
    const symbol = CURRENCY_SYMBOLS[currencyCode] || '₹'
    return `${symbol}${(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const getCompanyCurrency = () => {
    if (invoices.length > 0) {
      const firstCurrency = invoices[0].currency || 'INR'
      const allSame = invoices.every(inv => (inv.currency || 'INR') === firstCurrency)
      if (allSame) return firstCurrency
    }
    return 'INR'
  }
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [summary, setSummary] = useState<any>(null)

  const fetchInvoices = async () => {
    if (!companyId) {
      setError("No company ID provided")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await api.get<ApiResponse>(`/api/invoice/summary/${companyId}`)

      if (response.data.success) {
        const invoiceData = response.data.data || []
        setInvoices(invoiceData)
        setFilteredInvoices(invoiceData)
        setSummary(response.data.summary || null)
        setError(null)
      } else {
        setError("Failed to fetch invoices")
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404 || err.response?.data?.message?.includes("No invoices found")) {
          setInvoices([])
          setFilteredInvoices([])
          setError(null)
        } else {
          setError(`Error: ${err.response?.data?.message || err.response?.statusText}`)
        }
      } else {
        setError("An unexpected error occurred")
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [companyId])

  // Search functionality
  useEffect(() => {
    const filtered = invoices.filter(
      (invoice) =>
        invoice.invoiceNumber.toString().includes(searchTerm.toLowerCase()) ||
        (invoice.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.billTo?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.Date && invoice.Date.toLowerCase().includes(searchTerm.toLowerCase())),
    )
    setFilteredInvoices(filtered)
    setCurrentPage(1)
  }, [searchTerm, invoices])

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredInvoices.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage)

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  const handleNewInvoice = () => {
    navigate(`/admin/invoices/create/${companyId}`)
  }

  const handleViewInvoice = (invoiceId: string) => {
    navigate(`/admin/invoices/details/${invoiceId}`)
  }

  const handleEditInvoice = (invoiceId: string) => {
    navigate(`/admin/invoices/edit/${invoiceId}`)
  }

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!window.confirm("Are you sure you want to delete this invoice?")) return

    try {
      await api.delete(`/api/invoice/delete/${invoiceId}`)
      alert("Invoice deleted successfully")
      fetchInvoices()
    } catch (err) {
      alert("Failed to delete invoice")
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'Tax':
        return 'bg-blue-100 text-blue-800'
      case 'Proforma':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading invoices...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
              <p className="text-slate-500 mt-1">Manage and create Tax & Proforma invoices</p>
            </div>
            <button
              onClick={handleNewInvoice}
              className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-sm"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Invoice
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-800 p-4 rounded-xl border border-red-200 mb-6 text-sm font-semibold">
            {error}
          </div>
        )}

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <p className="text-slate-500 text-sm font-semibold">Total Invoices</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{summary.totalInvoices}</h3>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <p className="text-slate-500 text-sm font-semibold">Total Amount</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{CURRENCY_SYMBOLS[getCompanyCurrency()]}{(summary.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <p className="text-slate-500 text-sm font-semibold">Tax Invoices</p>
              <h3 className="text-2xl font-bold text-blue-600 mt-1">{summary.taxInvoices}</h3>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <p className="text-slate-500 text-sm font-semibold">Proforma Invoices</p>
              <h3 className="text-2xl font-bold text-purple-600 mt-1">{summary.proformaInvoices}</h3>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by invoice #, type, date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div className="text-sm text-slate-500 font-medium">
              Showing {currentItems.length} of {filteredInvoices.length} invoices
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Subtotal
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Tax Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {currentItems.length > 0 ? (
                  currentItems.map((invoice) => (
                    <tr key={invoice._id} className="hover:bg-slate-50/50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-slate-900">#{invoice.invoiceNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getTypeBadge(invoice.type)}`}>
                          {invoice.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {formatInvoiceMoney(invoice.subtotal || 0, invoice.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {formatInvoiceMoney(invoice.totalTaxAmount || 0, invoice.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                        {formatInvoiceMoney(invoice.totalAmount || 0, invoice.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {invoice.Date ? new Date(invoice.Date).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleViewInvoice(invoice._id)}
                            className="inline-flex items-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors duration-150"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            View
                          </button>
                          <button
                            onClick={() => handleEditInvoice(invoice._id)}
                            className="inline-flex items-center px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition-colors duration-150"
                          >
                            <Edit3 className="w-3.5 h-3.5 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteInvoice(invoice._id)}
                            className="inline-flex items-center px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-lg transition-colors duration-150"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="text-slate-400">
                        <svg
                          className="mx-auto h-12 w-12 text-slate-300 mb-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <p className="text-base font-semibold text-slate-800">No invoices found</p>
                        <p className="text-sm mt-1 text-slate-500">
                          {searchTerm
                            ? "Try adjusting your search terms"
                            : "Get started by creating your first Tax or Proforma invoice"}
                        </p>
                        <div className="mt-6">
                          <button
                            onClick={handleNewInvoice}
                            className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200"
                          >
                            <Plus className="w-5 h-5 mr-2" />
                            Create Invoice
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600 font-semibold">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredInvoices.length)} of {filteredInvoices.length} entries
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1.5 text-sm font-semibold rounded-lg border ${page === currentPage
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
