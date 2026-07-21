import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore, UserRole } from './store/auth.store'
import { usePermissionsStore } from './store/permissions.store'
import { useEffect, useState } from 'react'
import { authApi } from './services/auth.api'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Products } from './pages/Products'
import { Categories } from './pages/Categories'
import { Customers } from './pages/Customers'
import { Sales } from './pages/Sales'
import { Users } from './pages/Users'
import { Permissions } from './pages/Permissions'
import { Reports } from './pages/Reports'
import { DesignSystem } from './pages/DesignSystem'
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

function PermRoute({ children, perm }: { children: React.ReactNode; perm: string }) {
  const user = useAuthStore((s) => s.user)
  const { has } = usePermissionsStore()
  if (!user) return <Navigate to="/login" replace />
  if (!has(perm)) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  const { initialize, setUser } = useAuthStore()
  const loadPermissions = usePermissionsStore(s => s.load)
  const clearPermissions = usePermissionsStore(s => s.clear)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    initialize()
    const token = localStorage.getItem('access_token')
    if (token) {
      authApi.getCurrentUser()
        .then(async (user) => {
          setUser(user)
          await loadPermissions()
        })
        .catch(() => clearPermissions())
        .finally(() => setReady(true))
    } else {
      setReady(true)
    }
  }, [])

  if (!ready) return (
    <div className="min-h-screen bg-[#1E3557] flex items-center justify-center">
      <div className="text-gray-400 text-sm">Cargando...</div>
    </div>
  )

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Navigate to="/login" replace />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="users"         element={<RoleRoute roles={['admin']}><Users /></RoleRoute>} />
          <Route path="permissions"   element={<RoleRoute roles={['admin']}><Permissions /></RoleRoute>} />
          <Route path="categories"    element={<PermRoute perm="manage_categories"><Categories /></PermRoute>} />
          <Route path="products"      element={<Products />} />
          <Route path="customers"     element={<PermRoute perm="view_customers"><Customers /></PermRoute>} />
          <Route path="sales"         element={<Sales />} />
          <Route path="reports"       element={<Reports />} />
          <Route path="design-system" element={<RoleRoute roles={['admin']}><DesignSystem /></RoleRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
