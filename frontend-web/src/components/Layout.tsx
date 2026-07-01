import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore, ROLE_LABELS, UserRole } from '../store/auth.store'
import { api } from '../services/api'
import toast from 'react-hot-toast'

interface NavItem { to: string; label: string; icon: string; exact?: boolean; roles: UserRole[] }

const navItems: NavItem[] = [
  { to: '/',           label: 'Dashboard',  icon: '▣', exact: true, roles: ['admin', 'ejecutivo', 'vendedor'] },
  { to: '/products',   label: 'Productos',  icon: '◫',              roles: ['admin', 'ejecutivo', 'vendedor'] },
  { to: '/sales',      label: 'Ventas',     icon: '◆',              roles: ['admin', 'ejecutivo', 'vendedor'] },
  { to: '/customers',  label: 'Clientes',   icon: '◎',              roles: ['admin', 'ejecutivo'] },
  { to: '/categories', label: 'Categorías', icon: '◇',              roles: ['admin', 'ejecutivo'] },
  { to: '/users',         label: 'Usuarios',      icon: '◉',              roles: ['admin'] },
  { to: '/design-system', label: 'Design System', icon: '◈',              roles: ['admin'] },
]

const ROLE_BADGE: Record<UserRole, string> = {
  admin:     'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40',
  ejecutivo: 'bg-blue-900/40 text-blue-300 border border-blue-800/40',
  vendedor:  'bg-green-900/40 text-green-300 border border-green-800/40',
}

const EyeIcon = ({ open }: { open: boolean }) => open ? (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

const EMPTY_PW = { current: '', next: '', confirm: '' }

export function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const role = (user?.role ?? 'vendedor') as UserRole
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pwModal, setPwModal] = useState(false)
  const [pwForm, setPwForm] = useState(EMPTY_PW)
  const [pwLoading, setPwLoading] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }
  const closeMobile = () => setMobileOpen(false)

  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pwForm.next !== pwForm.confirm) {
      toast.error('Las contraseñas nuevas no coinciden')
      return
    }
    if (pwForm.next.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }
    setPwLoading(true)
    try {
      await api.put('/users/me/password', {
        current_password: pwForm.current,
        new_password: pwForm.next,
      })
      toast.success('Contraseña actualizada correctamente')
      setPwModal(false)
      setPwForm(EMPTY_PW)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error al cambiar contraseña')
    } finally {
      setPwLoading(false)
    }
  }

  const SidebarContent = () => (
    <>
      {/* Logo + Brands */}
      <div className="px-5 pt-6 pb-5 border-b border-[#2A2A2A]">
        <div className="flex items-center gap-3 mb-4">
          <img src="/logo.png" alt="El Patrón"
            className="w-11 h-11 rounded-full object-cover ring-2 ring-[#D4AF37]/60 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-[#D4AF37] tracking-[0.2em] leading-tight">EL PATRÓN SHOP</p>
            <p className="text-[10px] text-[#B8860B] leading-tight mt-0.5">Tienda y Licorería</p>
          </div>
          <button onClick={closeMobile}
            className="lg:hidden ml-auto text-[#555] hover:text-white text-xl leading-none p-1">
            ✕
          </button>
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
            onClick={closeMobile}
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
        <button onClick={() => { setPwModal(true); setPwForm(EMPTY_PW); closeMobile() }}
          className="w-full text-left text-xs text-[#555] hover:text-[#D4AF37] transition-colors mb-1.5">
          → Cambiar contraseña
        </button>
        <button onClick={handleLogout}
          className="w-full text-left text-xs text-[#444] hover:text-[#D4AF37] transition-colors">
          → Cerrar sesión
        </button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen bg-[#1E3557] overflow-hidden">

      {/* ── Mobile top bar ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#0F0F0F] z-30 flex items-center gap-3 px-4 border-b border-[#2A2A2A] shadow-lg">
        <button onClick={() => setMobileOpen(true)}
          className="text-[#D4AF37] text-xl w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#1A1A1A] transition-colors">
          ☰
        </button>
        <img src="/logo.png" alt="Logo" className="w-7 h-7 rounded-full object-cover ring-1 ring-[#D4AF37]/50" />
        <span className="text-[#D4AF37] text-sm font-bold tracking-widest">EL PATRÓN SHOP</span>
      </div>

      {/* ── Mobile backdrop ── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
          onClick={closeMobile}
        />
      )}

      {/* ── Sidebar desktop (always visible) + mobile (drawer) ── */}
      <aside className={`
        fixed lg:relative
        top-0 left-0 h-full
        w-72 lg:w-64
        bg-[#0F0F0F] text-white
        flex flex-col flex-shrink-0
        shadow-xl z-50 lg:z-auto
        transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <SidebarContent />
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-auto pt-14 lg:pt-0 min-w-0">
        <Outlet />
      </main>

      {/* ── Modal cambiar contraseña ── */}
      {pwModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] px-4">
          <div className="bg-[#243D66] rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-semibold text-gray-100">Cambiar contraseña</h3>
                <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
              </div>
              <button onClick={() => setPwModal(false)} className="text-gray-400 hover:text-gray-200 text-xl leading-none">&times;</button>
            </div>

            <form onSubmit={handleChangePw} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">Contraseña actual</label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={pwForm.current}
                    onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
                    required autoFocus
                    className="w-full border border-white/20 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                    placeholder="Tu contraseña actual"
                  />
                  <button type="button" onClick={() => setShowCurrent(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#D4AF37] transition-colors" tabIndex={-1}>
                    <EyeIcon open={showCurrent} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">Nueva contraseña</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={pwForm.next}
                    onChange={e => setPwForm(p => ({ ...p, next: e.target.value }))}
                    required
                    className="w-full border border-white/20 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button type="button" onClick={() => setShowNew(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#D4AF37] transition-colors" tabIndex={-1}>
                    <EyeIcon open={showNew} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">Confirmar nueva contraseña</label>
                <input
                  type="password"
                  value={pwForm.confirm}
                  onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                  required
                  className="w-full border border-white/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                  placeholder="Repetí la nueva contraseña"
                />
                {pwForm.confirm && pwForm.next !== pwForm.confirm && (
                  <p className="text-xs text-red-400 mt-1">Las contraseñas no coinciden</p>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setPwModal(false)}
                  className="flex-1 border border-white/20 text-gray-300 text-sm font-medium py-2.5 rounded-lg hover:bg-[#1E3557] transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={pwLoading}
                  className="flex-1 bg-[#D4AF37] hover:bg-[#B8860B] text-[#0F0F0F] text-sm font-semibold py-2.5 rounded-lg disabled:opacity-50 transition-colors">
                  {pwLoading ? 'Guardando...' : 'Actualizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
