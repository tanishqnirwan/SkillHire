import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface AuthRouteProps {
  allowedRoles?: Array<'freelancer' | 'client'>;
}

const AuthRoute = ({ allowedRoles }: AuthRouteProps) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check role if allowedRoles is specified
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to the appropriate dashboard based on user role
    if (user.role === 'freelancer') {
      return <Navigate to="/freelancer/dashboard" replace />
    } else if (user.role === 'client') {
      return <Navigate to="/client/dashboard" replace />
    }
  }

  return <Outlet />
}

export default AuthRoute 