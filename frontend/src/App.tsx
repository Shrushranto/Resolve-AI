import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { getStoredUser, isStaff } from '@/lib/auth'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'
import OrdersPage from '@/pages/OrdersPage'
import TicketsPage from '@/pages/TicketsPage'
import NewTicketPage from '@/pages/NewTicketPage'
import TicketDetailPage from '@/pages/TicketDetailPage'
import AdminDashboardPage from '@/pages/AdminDashboardPage'
import AdminTicketsPage from '@/pages/AdminTicketsPage'
import AdminTicketDetailPage from '@/pages/AdminTicketDetailPage'
import AdminEscalationsPage from '@/pages/AdminEscalationsPage'

function RootRedirect() {
  const user = getStoredUser()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={isStaff(user) ? '/admin/dashboard' : '/dashboard'} replace />
}

function ProtectedRoute({ children, staffOnly = false }: { children: React.ReactNode; staffOnly?: boolean }) {
  const user = getStoredUser()
  if (!user) return <Navigate to="/login" replace />
  if (staffOnly && !isStaff(user)) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        <Route path="/tickets" element={<ProtectedRoute><TicketsPage /></ProtectedRoute>} />
        <Route path="/tickets/new" element={<ProtectedRoute><NewTicketPage /></ProtectedRoute>} />
        <Route path="/tickets/:id" element={<ProtectedRoute><TicketDetailPage /></ProtectedRoute>} />

        <Route path="/admin/dashboard" element={<ProtectedRoute staffOnly><AdminDashboardPage /></ProtectedRoute>} />
        <Route path="/admin/tickets" element={<ProtectedRoute staffOnly><AdminTicketsPage /></ProtectedRoute>} />
        <Route path="/admin/tickets/:id" element={<ProtectedRoute staffOnly><AdminTicketDetailPage /></ProtectedRoute>} />
        <Route path="/admin/escalations" element={<ProtectedRoute staffOnly><AdminEscalationsPage /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
