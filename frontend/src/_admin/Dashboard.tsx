import { useState, useEffect } from 'react';
import { FaFileInvoice, FaReceipt, FaChartLine, FaDownload } from 'react-icons/fa';
import { FiTrendingUp } from 'react-icons/fi';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { CURRENCY_SYMBOLS } from '../utils/currencies';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  type: 'Tax' | 'Proforma';
  currency?: string;
  totalAmount: number;
  Date: string;
  billTo: {
    name: string;
  };
}

interface CurrencyStat {
  currency: string;
  totalInvoices: number;
  totalAmount: number;
  taxCount: number;
  taxAmount: number;
  proformaCount: number;
  proformaAmount: number;
}

interface DashboardStats {
  totalInvoices: number;
  taxInvoices: number;
  proformaInvoices: number;
  totalRevenue: number;
  totalCompanies: number;
  currencyBreakdown: CurrencyStat[];
  recentInvoices: Invoice[];
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('INR');
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    taxInvoices: 0,
    proformaInvoices: 0,
    totalRevenue: 0,
    totalCompanies: 0,
    currencyBreakdown: [],
    recentInvoices: [],
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const companyId = localStorage.getItem('companyId');

      const url = companyId
        ? `/api/dashboard/summary?companyId=${companyId}`
        : `/api/dashboard/summary`;

      const response = await api.get(url);

      if (response.data?.success) {
        const data = response.data.data;
        const breakdown = data.currencyBreakdown || [];

        setStats({
          totalInvoices: data.totalInvoices || 0,
          taxInvoices: data.taxInvoices || 0,
          proformaInvoices: data.proformaInvoices || 0,
          totalRevenue: data.totalRevenue || 0,
          totalCompanies: data.totalCompanies || 0,
          currencyBreakdown: breakdown,
          recentInvoices: data.recentInvoices || [],
        });

        if (breakdown.length > 0) {
          const hasINR = breakdown.some((b: any) => b.currency === 'INR');
          if (hasINR) {
            setSelectedCurrency('INR');
          } else {
            setSelectedCurrency(breakdown[0].currency);
          }
        }
        setError(null);
      } else {
        setError('Failed to fetch dashboard data');
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatMoney = (amount: number, currencyCode: string = 'INR', decimals: number = 2) => {
    try {
      return new Intl.NumberFormat(currencyCode === 'INR' ? 'en-IN' : 'en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(amount);
    } catch (e) {
      const symbol = CURRENCY_SYMBOLS[currencyCode] || '₹';
      return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
    }
  };

  const formatInvoiceCurrency = (amount: number, currencyCode: string = 'INR') => {
    return formatMoney(amount, currencyCode, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-slate-600 font-medium">Loading dashboard data...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-red-600 font-semibold">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  const activeCurrencyStat = stats.currencyBreakdown.find(
    (b) => b.currency === selectedCurrency
  ) || {
    currency: selectedCurrency,
    totalInvoices: 0,
    totalAmount: 0,
    taxCount: 0,
    taxAmount: 0,
    proformaCount: 0,
    proformaAmount: 0,
  };

  const cardData = [
    {
      title: 'Total Invoices',
      count: activeCurrencyStat.totalInvoices,
      subtitle: 'Tax & Proforma invoices',
      revenue: activeCurrencyStat.totalAmount,
      icon: <FaFileInvoice className="text-blue-500 text-xl" />,
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Tax Invoices',
      count: activeCurrencyStat.taxCount,
      subtitle: 'Official tax bills',
      revenue: activeCurrencyStat.taxAmount,
      icon: <FaReceipt className="text-emerald-500 text-xl" />,
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Proforma Invoices',
      count: activeCurrencyStat.proformaCount,
      subtitle: 'Estimates / Proformas',
      revenue: activeCurrencyStat.proformaAmount,
      icon: <FaReceipt className="text-purple-500 text-xl" />,
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800">Dashboard Overview</h1>
            <p className="text-slate-500 text-sm mt-1">Quick metrics on your companies and invoicing</p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl shadow-md transition-colors duration-200 font-semibold text-sm">
              <FaDownload size={14} />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* Currency Switcher Tabs */}
        {stats.currencyBreakdown.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-6 bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200/50">
            {stats.currencyBreakdown.map((item) => {
              const isActive = selectedCurrency === item.currency;
              return (
                <button
                  key={item.currency}
                  onClick={() => setSelectedCurrency(item.currency)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
                    isActive
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <span className="font-mono bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-xs">
                    {CURRENCY_SYMBOLS[item.currency] || item.currency}
                  </span>
                  <span>{item.currency} Overview</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {cardData.map((item, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{item.title}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{item.subtitle}</p>
                </div>
                <div className={`p-3 rounded-xl ${item.bgColor}`}>
                  {item.icon}
                </div>
              </div>

              <div className="flex items-end justify-between mt-4">
                <div>
                  <p className="text-3xl font-black text-slate-900">{item.count}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Revenue Contribution</p>
                  <p className="font-extrabold text-slate-800 text-lg">{formatMoney(item.revenue, selectedCurrency, 2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Currency Wise Breakdown Section */}
        {stats.currencyBreakdown.length > 0 && (
          <div className="mb-10 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-800">Currency Wise Breakdown</h2>
              <p className="text-slate-500 text-xs mt-0.5">Summary breakdown for each active currency</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stats.currencyBreakdown.map((item) => (
                <div
                  key={item.currency}
                  className={`p-5 rounded-2xl border transition-all duration-300 hover:shadow-sm ${
                    selectedCurrency === item.currency 
                      ? 'border-indigo-500 bg-indigo-50/20' 
                      : 'border-slate-100 bg-slate-50/30'
                  }`}
                >
                  <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono bg-white text-slate-700 w-9 h-9 rounded-xl flex items-center justify-center font-bold border border-slate-100 shadow-sm">
                        {CURRENCY_SYMBOLS[item.currency] || item.currency}
                      </span>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">{item.currency}</h3>
                        <p className="text-[10px] text-slate-400 font-semibold">Active Currency</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedCurrency(item.currency)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${
                        selectedCurrency === item.currency
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {selectedCurrency === item.currency ? 'Viewing' : 'View Stats'}
                    </button>
                  </div>
                  
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Total Invoices</span>
                      <span className="font-bold text-slate-800">{item.totalInvoices}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Total Revenue</span>
                      <span className="font-black text-indigo-600">{formatMoney(item.totalAmount, item.currency, 2)}</span>
                    </div>
                    <div className="border-t border-slate-100/70 my-2 pt-2"></div>
                    <div className="flex justify-between items-center text-[11px] text-slate-600">
                      <span>📄 Tax Invoices</span>
                      <span className="font-semibold text-slate-800">{item.taxCount} ({formatMoney(item.taxAmount, item.currency, 0)})</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-600">
                      <span>📝 Proforma Invoices</span>
                      <span className="font-semibold text-slate-800">{item.proformaCount} ({formatMoney(item.proformaAmount, item.currency, 0)})</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Insights Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Recent Invoices Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-3">Recent Invoices</h2>
            {stats.recentInvoices.length > 0 ? (
              <div className="space-y-4">
                {stats.recentInvoices.map((invoice) => (
                  <div
                    key={invoice._id}
                    className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/admin/invoices/details/${invoice._id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl ${invoice.type === 'Tax' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                        }`}>
                        <FaFileInvoice className="text-lg" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">#{invoice.invoiceNumber}</p>
                        <p className="text-xs text-slate-500 font-medium">{invoice.billTo?.name || "No Client"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-800">{formatInvoiceCurrency(invoice.totalAmount, invoice.currency)}</p>
                      <p className="text-xs text-slate-400 font-medium">{formatDate(invoice.Date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm font-medium">
                No recent invoices found
              </div>
            )}
          </div>

          {/* Quick Stats Insights */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-3">Quick Insights</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border border-slate-100 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-500">
                      <FaChartLine />
                    </div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Companies</span>
                  </div>
                  <p className="text-2xl font-black text-slate-900">{stats.totalCompanies}</p>
                </div>
                <div className="p-4 border border-slate-100 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-500">
                      <FiTrendingUp />
                    </div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Revenue ({selectedCurrency})</span>
                  </div>
                  <p className="text-2xl font-black text-slate-900">{formatMoney(activeCurrencyStat.totalAmount, selectedCurrency)}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500 leading-relaxed font-medium">
              💡 <strong>Pro-Tip:</strong> Review your Proforma Invoices and convert them to Tax Invoices easily when sales are finalized. Use the "Export Report" to download a clean breakdown of all invoices.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;