import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore, UserRole } from './store/auth.store'
import { useEffect, useState } from 'react'
import { authApi } from './services/auth.api'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { Products } from './pages/Products'
import { Categories } from './pages/Categories'
import { Customers } from './pages/Customers'
import { Sales } from './pages/Sales'
import { Users } from './pages/Users'
import { Layout } from './components/Layout'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function RoleRoute({ children, roles }: { children: React.ReactNode; roles: UserRole[] }) {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role as UserRole)) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  const { initialize, setUser } = useAuthStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    initialize()
    const token = localStorage.getItem('access_token')
    if (token) {
      authApi.getCurrentUser()
        .then(setUser)
        .catch(() => {})
        .finally(() => setReady(true))
    } else {
      setReady(true)
    }
  }, [])

  if (!ready) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-gray-400 text-sm">Cargando...</div>
    </div>
  )

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="users" element={<RoleRoute roles={['admin']}><Users /></RoleRoute>} />
          <Route path="categories" element={<RoleRoute roles={['admin','ejecutivo']}><Categories /></RoleRoute>} />
          <Route path="products" element={<Products />} />
          <Route path="customers" element={<RoleRoute roles={['admin','ejecutivo']}><Customers /></RoleRoute>} />
          <Route path="sales" element={<Sales />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
