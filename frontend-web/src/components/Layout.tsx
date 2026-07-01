import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore, ROLE_LABELS, UserRole } from '../store/auth.store'

interface NavItem { to: string; label: string; icon: string; exact?: boolean; roles: UserRole[] }

const navItems: NavItem[] = [
  { to: '/',           label: 'Dashboard',  icon: '▣', exact: true, roles: ['admin', 'ejecutivo', 'vendedor'] },
  { to: '/products',   label: 'Productos',  icon: '◫',              roles: ['admin', 'ejecutivo', 'vendedor'] },
  { to: '/sales',      label: 'Ventas',     icon: '◆',              roles: ['admin', 'ejecutivo', 'vendedor'] },
  { to: '/customers',  label: 'Clientes',   icon: '◎',              roles: ['admin', 'ejecutivo'] },
  { to: '/categories', label: 'Categorías', icon: '◇',              roles: ['admin', 'ejecutivo'] },
  { to: '/users',      label: 'Usuarios',   icon: '◉',              roles: ['admin'] },
]

const ROLE_BADGE: Record<UserRole, string> = {
  admin:     'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40',
  ejecutivo: 'bg-blue-900/40 text-blue-300 border border-blue-800/40',
  vendedor:  'bg-green-900/40 text-green-300 border border-green-800/40',
}

export function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const role = (user?.role ?? 'vendedor') as UserRole

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex h-screen bg-gray-50">

      {/* ── Sidebar ── */}
      <aside className="w-64 bg-[#0F0F0F] text-white flex flex-col flex-shrink-0 shadow-xl">

        {/* Logo + Brands */}
        <div className="px-5 pt-6 pb-5 border-b border-[#2A2A2A]">
          <div className="flex items-center gap-3 mb-4">
            <img src="/logo.png" alt="El Patrón"
              className="w-11 h-11 rounded-full object-cover ring-2 ring-[#D4AF37]/60" />
            <div>
              <p className="text-xs font-bold text-[#D4AF37] tracking-[0.2em] leading-tight">EL PATRÓN SHOP</p>
              <p className="text-[10px] text-[#B8860B] leading-tight mt-0.5">Tienda y Licorería</p>
            </div>
          </div>
          <div className="border-t border-[#2A2A2A] pt-3">
            <p className="text-[11px] font-bold text-white tracking-[0.15em]">NEXORA</p>
            <p className="text-[10px] text-[#444] italic mt-0.5">el impulso hacia el futuro</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.filter(i => i.roles.includes(role)).map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-[#D4AF37] text-[#0F0F0F] font-semibold shadow-sm'
                    : 'text-[#777] hover:text-[#D4AF37] hover:bg-[#1A1A1A]'
                }`
              }
            >
              <span className="text-[15px] leading-none opacity-80">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-[#2A2A2A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] font-bold text-sm flex-shrink-0">
              {(user?.full_name || user?.email || '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.full_name || user?.email}</p>
              <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium mt-0.5 ${ROLE_BADGE[role]}`}>
                {ROLE_LABELS[role]}
              </span>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full text-left text-xs text-[#444] hover:text-[#D4AF37] transition-colors">
            → Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
