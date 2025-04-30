import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/contexts/AuthContext'
import PrivateRoute from '@/components/PrivateRoute'
import Layout from '@/components/Layout'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import FreelancerDashboard from '@/pages/freelancer/Dashboard'
import CreateService from '@/pages/freelancer/CreateService'
import EditService from '@/pages/freelancer/EditService'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
         
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/freelancer/dashboard" replace />} />
              <Route path="/freelancer/dashboard" element={<FreelancerDashboard />} />
              <Route path="/freelancer/services/create" element={<CreateService />} />
              <Route path="/freelancer/services/:id/edit" element={<EditService />} />
              
            </Route>
          </Route>
        </Routes>
      </Router>
      <Toaster />
    </AuthProvider>
  )
}

export default App
