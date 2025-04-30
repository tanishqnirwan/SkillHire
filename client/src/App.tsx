import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/contexts/AuthContext'
import AuthRoute from '@/components/AuthRoute'
import Layout from '@/components/Layout'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import FreelancerDashboard from '@/pages/freelancer/Dashboard'
import CreateService from '@/pages/freelancer/CreateService'
import EditService from '@/pages/freelancer/EditService'
import ClientDashboard from '@/pages/client/Dashboard'
import ServiceDetail from '@/pages/client/ServiceDetail'
import { useAuth } from '@/contexts/AuthContext'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Authenticated routes */}
          <Route element={<AuthRoute />}>
            {/* Default route - will redirect based on role */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardRedirect />} />
            
            {/* Freelancer routes */}
            <Route element={<AuthRoute allowedRoles={['freelancer']} />}>
              <Route element={<Layout />}>
                <Route path="/freelancer/dashboard" element={<FreelancerDashboard />} />
                <Route path="/freelancer/services/create" element={<CreateService />} />
                <Route path="/freelancer/services/:id/edit" element={<EditService />} />
              </Route>
            </Route>

            {/* Client routes */}
            <Route element={<AuthRoute allowedRoles={['client']} />}>
              <Route element={<Layout />}>
                <Route path="/client/dashboard" element={<ClientDashboard />} />
                <Route path="/services/:id" element={<ServiceDetail />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </Router>
      <Toaster />
    </AuthProvider>
  )
}

// DashboardRedirect component
const DashboardRedirect = () => {
  const { user } = useAuth();
  
  if (user?.role === 'freelancer') {
    return <Navigate to="/freelancer/dashboard" replace />;
  } else if (user?.role === 'client') {
    return <Navigate to="/client/dashboard" replace />;
  }
  
  // Fallback in case something went wrong
  return <Navigate to="/login" replace />;
}

export default App
