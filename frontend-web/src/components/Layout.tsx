import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore, ROLE_LABELS, UserRole } from '../store/auth.store'

interface NavItem { to: string; label: string; exact?: boolean; roles: UserRole[] }

const navItems: NavItem[] = [
  { to: '/',           label: 'Dashboard',  exact: true, roles: ['admin', 'ejecutivo', 'vendedor'] },
  { to: '/users',      label: 'Usuarios',               roles: ['admin'] },
  { to: '/categories', label: 'Categorías',              roles: ['admin', 'ejecutivo'] },
  { to: '/products',   label: 'Productos',               roles: ['admin', 'ejecutivo', 'vendedor'] },
  { to: '/customers',  label: 'Clientes',                roles: ['admin', 'ejecutivo'] },
  { to: '/sales',      label: 'Ventas',                  roles: ['admin', 'ejecutivo', 'vendedor'] },
]

const ROLE_BADGE: Record<UserRole, string> = {
  admin:    'bg-purple-700 text-purple-100',
  ejecutivo:'bg-blue-700 text-blue-100',
  vendedor: 'bg-green-700 text-green-100',
}

export function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const role = (user?.role ?? 'vendedor') as UserRole

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-2xl font-bold text-blue-400">Nexora</h1>
          <p className="text-xs text-gray-400 mt-1">Sistema de Ventas</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.filter(item => item.roles.includes(role)).map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700 space-y-2">
          <p className="text-sm text-gray-200 font-medium truncate">{user?.full_name || user?.email}</p>
          <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE[role]}`}>
            {ROLE_LABELS[role]}
          </span>
          <button
            onClick={handleLogout}
            className="block w-full text-left text-xs text-gray-400 hover:text-white transition-colors mt-1">
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
