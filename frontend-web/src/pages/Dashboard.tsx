import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useAuthStore } from '../store/auth.store'
import { usePermissionsStore } from '../store/permissions.store'
import { KpiCard, PageHeader, IcoBox, IcoCart, IcoDollar, IcoUsers } from '../components/ui'

interface Stats { products: number; customers: number; sales: number; revenue: number }

export function Dashboard() {
  const [stats, setStats] = useState<Stats>({ products: 0, customers: 0, sales: 0, revenue: 0 })
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const { has } = usePermissionsStore()
  const firstName = user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuario'

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

  return (
    <div className="p-4 md:p-8">

      <PageHeader
        title={`Bienvenido, ${firstName}`}
        subtitle="Resumen general de El Patrón Shop"
        actions={[
          {
            label: '+ Nueva venta',
            onClick: () => navigate('/sales'),
          },
          {
            label: 'Gestionar usuarios',
            onClick: () => navigate('/users'),
            variant: 'secondary',
            roles: ['admin'],
          },
        ]}
      />

      {loading ? (
        <div className="text-sm text-gray-500">Cargando estadísticas...</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">

          {/* Todos los roles */}
          <KpiCard
            label="Productos"
            value={stats.products}
            icon={<IcoBox />}
            iconBg="bg-[#D4AF37]/15"
            iconColor="text-[#D4AF37]"
            desc="Total en catálogo"
            onClick={() => navigate('/products')}
          />

          {/* Todos los roles */}
          <KpiCard
            label="Ventas"
            value={stats.sales}
            icon={<IcoCart />}
            iconBg="bg-green-900/30"
            iconColor="text-green-400"
            desc="Total registradas"
            onClick={() => navigate('/sales')}
          />

          <KpiCard
            label="Recaudado"
            value={`$${stats.revenue.toFixed(2)}`}
            icon={<IcoDollar />}
            iconBg="bg-blue-900/30"
            iconColor="text-blue-400"
            desc="Ventas completadas"
            perm="view_revenue"
          />

          <KpiCard
            label="Clientes"
            value={stats.customers}
            icon={<IcoUsers />}
            iconBg="bg-violet-900/30"
            iconColor="text-violet-400"
            desc="Total registrados"
            onClick={() => navigate('/customers')}
            perm="view_customers"
          />

        </div>
      )}

      {/* Acciones rápidas */}
      <div className="bg-[#243D66] rounded-xl border border-white/5 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-[#D4AF37] rounded-full" />
          <h3 className="font-semibold text-gray-100 text-sm">Acciones rápidas</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => navigate('/sales')}
            className="bg-[#D4AF37] hover:bg-[#B8860B] text-[#0F0F0F] px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
            + Nueva venta
          </button>
          <button onClick={() => navigate('/products')}
            className="bg-[#172A46] hover:bg-[#1E3557] text-gray-300 border border-white/10 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Ver productos
          </button>
          {has('view_customers') && (
            <button onClick={() => navigate('/customers')}
              className="bg-[#172A46] hover:bg-[#1E3557] text-gray-300 border border-white/10 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Ver clientes
            </button>
          )}
          {has('manage_categories') && (
            <button onClick={() => navigate('/categories')}
              className="bg-[#172A46] hover:bg-[#1E3557] text-gray-300 border border-white/10 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Ver categorías
            </button>
          )}
          {has('manage_users') && (
            <button onClick={() => navigate('/users')}
              className="bg-[#172A46] hover:bg-[#1E3557] text-gray-300 border border-white/10 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Gestionar usuarios
            </button>
          )}
        </div>
      </div>

    </div>
  )
}
