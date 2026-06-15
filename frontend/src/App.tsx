import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Suspense, lazy } from "react"

// Lazy load components
const Login = lazy(() => import("./_admin/login"))
const AdminLayout = lazy(() => import("./_admin/AdminLayout"))
const Dashboard = lazy(() => import("./_admin/Dashboard"))
const Company = lazy(() => import("./_admin/Company"))

const Files = lazy(() => import("./_admin/Files"))
const ProtectedRoute = lazy(() => import("./_admin/ProtectedRoute"))

// Simplified Invoice System Components
const AllInvoices = lazy(() => import("./_admin/invoices/all-invoices"))
const InvoiceForm = lazy(() => import("./_admin/invoices/invoice-form"))
const InvoiceDetails = lazy(() => import("./_admin/invoices/invoice-details"))

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="text-center p-4">Loading...</div>}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="company" element={<Company />} />
            <Route path="files" element={<Files />} />
            
            {/* Simplified Invoice Routes */}
            <Route path="invoices/:companyId" element={<AllInvoices />} />
            <Route path="invoices/create/:companyId" element={<InvoiceForm isEdit={false} />} />
            <Route path="invoices/edit/:invoiceId" element={<InvoiceForm isEdit={true} />} />
            <Route path="invoices/details/:invoiceId" element={<InvoiceDetails />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
