import { useState, useEffect } from 'react';
import { FaFileInvoice, FaReceipt, FaChartLine, FaDownload } from 'react-icons/fa';
import { FiTrendingUp } from 'react-icons/fi';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  type: 'Tax' | 'Proforma';
  totalAmount: number;
  Date: string;
  billTo: {
    name: string;
  };
}

interface DashboardStats {
  totalInvoices: number;
  taxInvoices: number;
  proformaInvoices: number;
  totalRevenue: number;
  totalCompanies: number;
  recentInvoices: Invoice[];
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    taxInvoices: 0,
    proformaInvoices: 0,
    totalRevenue: 0,
    totalCompanies: 0,
    recentInvoices: [],
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const companyId = localStorage.getItem('companyId');
      const baseUrl = 'http://localhost:5000';

      const url = companyId
        ? `${baseUrl}/api/dashboard/summary?companyId=${companyId}`
        : `${baseUrl}/api/dashboard/summary`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        const data = response.data.data;
        setStats({
          totalInvoices: data.totalInvoices || 0,
          taxInvoices: data.taxInvoices || 0,
          proformaInvoices: data.proformaInvoices || 0,
          totalRevenue: data.totalRevenue || 0,
          totalCompanies: data.totalCompanies || 0,
          recentInvoices: data.recentInvoices || [],
        });
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
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

  const cardData = [
    {
      title: 'Total Invoices',
      count: stats.totalInvoices,
      subtitle: 'Tax & Proforma invoices',
      icon: <FaFileInvoice className="text-blue-500 text-xl" />,
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Tax Invoices',
      count: stats.taxInvoices,
      subtitle: 'Official tax bills',
      icon: <FaReceipt className="text-emerald-500 text-xl" />,
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Proforma Invoices',
      count: stats.proformaInvoices,
      subtitle: 'Estimates / Proformas',
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
                  <p className="font-extrabold text-slate-800 text-lg">{formatCurrency(stats.totalRevenue)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

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
                      <p className="font-bold text-slate-800">{formatCurrency(invoice.totalAmount)}</p>
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
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Revenue</span>
                  </div>
                  <p className="text-2xl font-black text-slate-900">{formatCurrency(stats.totalRevenue)}</p>
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