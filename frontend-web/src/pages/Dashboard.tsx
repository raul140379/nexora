import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useAuthStore } from '../store/auth.store'

interface Stats { products: number; customers: number; sales: number; revenue: number }

const cards = [
  { key: 'products',  label: 'Productos',  icon: '◫', color: '#D4AF37', to: '/products' },
  { key: 'customers', label: 'Clientes',   icon: '◎', color: '#60a5fa', to: '/customers' },
  { key: 'sales',     label: 'Ventas',     icon: '◆', color: '#34d399', to: '/sales' },
  { key: 'revenue',   label: 'Recaudado',  icon: '$', color: '#D4AF37', to: '/sales', prefix: '$' },
]

export function Dashboard() {
  const [stats, setStats] = useState<Stats>({ products: 0, customers: 0, sales: 0, revenue: 0 })
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      api.get('/products').then(r => r.data.length),
      api.get('/customers').then(r => r.data.length),
      api.get('/sales').then(r => {
        const sales = r.data as { total: number; status: string }[]
        const revenue = sales.filter(s => s.status === 'completed').reduce((acc, s) => acc + Number(s.total), 0)
        return { count: sales.length, revenue }
      }),
    ]).then(([products, customers, { count, revenue }]) => {
      setStats({ products, customers, sales: count, revenue })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const firstName = user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuario'

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-1 h-7 bg-[#D4AF37] rounded-full" />
          <h2 className="text-2xl font-bold text-gray-100">
            Bienvenido, {firstName}
          </h2>
        </div>
        <p className="text-sm text-[#6B7280] ml-4">Resumen general de El Patrón Shop</p>
      </div>

      {/* Stats grid */}
      {loading ? (
        <div className="text-sm text-[#6B7280]">Cargando estadísticas...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {cards.map(c => {
            const val = stats[c.key as keyof Stats]
            const display = c.prefix ? `${c.prefix}${Number(val).toFixed(2)}` : String(val)
            return (
              <button key={c.key} onClick={() => navigate(c.to)}
                className="bg-[#243D66] rounded-xl shadow-sm border border-white/10 p-5 text-left hover:shadow-md hover:border-[#D4AF37]/40 transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold"
                    style={{ backgroundColor: `${c.color}15`, color: c.color }}>
                    {c.icon}
                  </div>
                  <span className="text-xs text-[#6B7280] group-hover:text-[#D4AF37] transition-colors">Ver →</span>
                </div>
                <p className="text-2xl font-bold text-gray-100">{display}</p>
                <p className="text-xs text-[#6B7280] mt-1">{c.label}</p>
                <div className="h-0.5 w-0 group-hover:w-full bg-[#D4AF37] transition-all duration-300 mt-3 rounded-full" />
              </button>
            )
          })}
        </div>
      )}

      {/* Quick actions */}
      <div className="bg-[#243D66] rounded-xl shadow-sm border border-white/10 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-[#D4AF37] rounded-full" />
          <h3 className="font-semibold text-gray-100 text-sm">Acciones rápidas</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          {[
            { label: '+ Nueva venta',     to: '/sales',     primary: true },
            { label: 'Ver productos',     to: '/products',  primary: false },
            { label: 'Ver clientes',      to: '/customers', primary: false },
            { label: 'Ver categorías',    to: '/categories',primary: false },
          ].map(a => (
            <button key={a.label} onClick={() => navigate(a.to)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                a.primary
                  ? 'bg-[#D4AF37] hover:bg-[#B8860B] text-[#0F0F0F] font-semibold'
                  : 'bg-[#172A46] hover:bg-[#1E3557] text-gray-300 border border-white/10'
              }`}>
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
