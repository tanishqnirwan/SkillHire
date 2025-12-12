import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { toast } from 'sonner'
import axios from '@/lib/axios'

interface User {
  id: string
  email: string
  role: 'freelancer' | 'client'
  name: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, role: 'freelancer' | 'client') => Promise<void>
  createDemoAccount: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  
  const updateAxiosHeaders = (token: string | null) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      updateAxiosHeaders(token)
      
      axios.get('/auth/verify')
        .then(response => {
          setUser(response.data.user)
        })
        .catch(() => {
          localStorage.removeItem('token')
          updateAxiosHeaders(null)
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/auth/login', { email, password })
      const { token, user } = response.data
      localStorage.setItem('token', token)
      updateAxiosHeaders(token)
      setUser(user)
      toast.success('Logged in successfully')
    } catch (error) {
      toast.error('Invalid credentials')
      throw error
    }
  }

  const register = async (name: string, email: string, password: string, role: 'freelancer' | 'client') => {
    try {
      const response = await axios.post('/auth/register', { name, email, password, role })
      const { token, user } = response.data
      localStorage.setItem('token', token)
      updateAxiosHeaders(token)
      setUser(user)
      toast.success('Account created successfully')
    } catch (error) {
      toast.error('Registration failed')
      throw error
    }
  }

  const createDemoAccount = async () => {
    try {
      const response = await axios.post('/auth/demo')
      const { token, user } = response.data
      localStorage.setItem('token', token)
      updateAxiosHeaders(token)
      setUser(user)
      toast.success('Demo account created successfully')
    } catch (error) {
      toast.error('Failed to create demo account')
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    updateAxiosHeaders(null)
    setUser(null)
    toast.success('Logged out successfully')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, createDemoAccount, logout }}>
      {children}
    </AuthContext.Provider>
  )
} 