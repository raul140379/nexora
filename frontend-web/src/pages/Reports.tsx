import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { usePermissionsStore } from '../store/permissions.store'

interface SaleItem { product_id: number; quantity: number; subtotal: number }
interface Sale {
  id: number; total: number; discount_pct: number
  status: 'pending' | 'completed' | 'cancelled'
  items: SaleItem[]; created_at: string
}
interface Product { id: number; name: string }

const PERIODS = [
  { key: 'today', label: 'Hoy' },
  { key: 'week',  label: 'Esta semana' },
  { key: 'month', label: 'Este mes' },
  { key: 'all',   label: 'Total' },
]

function inPeriod(dateStr: string, period: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  if (period === 'today') return d.toDateString() === now.toDateString()
  if (period === 'week') {
    const start = new Date(now)
    start.setDate(now.getDate() - now.getDay())
    start.setHours(0, 0, 0, 0)
    return d >= start
  }
  if (period === 'month') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  return true
}

const fmt = (v: number) => `$${Number(v).toFixed(2)}`

export function Reports() {
  const { has } = usePermissionsStore()
  const canViewRevenue = has('view_revenue')

  const [sales, setSales]       = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [period, setPeriod]     = useState('month')

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true)
    try {
      const [sr, pr] = await Promise.all([api.get('/sales'), api.get('/products')])
      setSales(sr.data); setProducts(pr.data)
    } catch {}
    setLoading(false); setRefreshing(false)
  }

  useEffect(() => { load() }, [])

  // ── Cálculos ────────────────────────────────────────────────────────────────
  const periodSales = sales.filter(s => inPeriod(s.created_at, period))
  const completed   = periodSales.filter(s => s.status === 'completed')
  const pending     = periodSales.filter(s => s.status === 'pending')
  const cancelled   = periodSales.filter(s => s.status === 'cancelled')

  const totalRevenue = completed.reduce((acc, s) => acc + Number(s.total), 0)
  const avgTicket    = completed.length > 0 ? totalRevenue / completed.length : 0
  const maxTicket    = completed.length > 0 ? Math.max(...completed.map(s => Number(s.total))) : 0

  const total = periodSales.length || 1
  const pctCompleted = Math.round((completed.length / total) * 100)
  const pctPending   = Math.round((pending.length   / total) * 100)
  const pctCancelled = Math.round((cancelled.length / total) * 100)

  // Top productos por cantidad
  const productQty: Record<number, number> = {}
  periodSales.forEach(s => s.items.forEach(it => {
    productQty[it.product_id] = (productQty[it.product_id] ?? 0) + it.quantity
  }))
  const topProducts = Object.entries(productQty)
    .map(([id, qty]) => ({ id: Number(id), qty, name: products.find(p => p.id === Number(id))?.name ?? `#${id}` }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5)
  const maxQty = topProducts[0]?.qty ?? 1

  // Últimos 7 días
  const days: string[] = []
  const dailyMap: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0)
    const key = d.toDateString()
    days.push(key); dailyMap[key] = 0
  }
  sales.filter(s => s.status === 'completed').forEach(s => {
    const key = new Date(s.created_at).toDateString()
    if (key in dailyMap) dailyMap[key] += Number(s.total)
  })
  const dailyValues = days.map(d => ({
    label: new Date(d).toLocaleDateString('es', { weekday: 'short' }),
    value: dailyMap[d],
  }))
  const maxDaily = Math.max(...dailyValues.map(d => d.value), 1)

  // KPIs a mostrar
  const kpis = [
    ...(canViewRevenue ? [
      { label: 'Ingresos',      value: fmt(totalRevenue), color: 'text-[#D4AF37]',  border: 'border-[#D4AF37]/30',  bg: 'bg-[#D4AF37]/10'   },
      { label: 'Ticket prom.',  value: fmt(avgTicket),    color: 'text-blue-400',    border: 'border-blue-500/30',   bg: 'bg-blue-900/20'    },
      { label: 'Ticket máx.',   value: fmt(maxTicket),    color: 'text-violet-400',  border: 'border-violet-500/30', bg: 'bg-violet-900/20'  },
    ] : []),
    { label: 'Completadas', value: String(completed.length), color: 'text-green-400',  border: 'border-green-500/30',  bg: 'bg-green-900/20'  },
    { label: 'Pendientes',  value: String(pending.length),   color: 'text-yellow-400', border: 'border-yellow-500/30', bg: 'bg-yellow-900/20' },
    { label: 'Canceladas',  value: String(cancelled.length), color: 'text-red-400',    border: 'border-red-500/30',    bg: 'bg-red-900/20'    },
  ]

  const distRows = [
    { label: 'Completadas', count: completed.length, pct: pctCompleted, color: '#4ade80' },
    { label: 'Pendientes',  count: pending.length,   pct: pctPending,   color: '#fbbf24' },
    { label: 'Canceladas',  count: cancelled.length, pct: pctCancelled, color: '#f87171' },
  ]

  return (
    <div className="p-5 md:p-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-100 tracking-tight">Reportes</h2>
          <p className="text-sm text-gray-400 mt-1">Análisis de ventas y métricas del negocio</p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-100 bg-[#172A46] hover:bg-[#1E3557] border border-white/10 px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 self-start sm:self-auto"
        >
          <span className={refreshing ? 'animate-spin inline-block' : ''}>↻</span>
          Actualizar
        </button>
      </div>

      {/* Selector de período */}
      <div className="inline-flex bg-[#172A46] rounded-xl p-1 gap-1">
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              period === p.key
                ? 'bg-[#D4AF37] text-[#0F0F0F] shadow-sm font-semibold'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-400 text-sm">Cargando reportes...</span>
          </div>
        </div>
      ) : (
        <>
          {/* KPI grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {kpis.map(k => (
              <div key={k.label} className={`${k.bg} border ${k.border} rounded-xl p-4 hover:scale-[1.02] transition-transform duration-200`}>
                <div className={`text-2xl font-bold tabular-nums ${k.color}`}>{k.value}</div>
                <div className="text-xs text-gray-400 mt-1.5 font-medium">{k.label}</div>
              </div>
            ))}
          </div>

          {/* Distribución + Top productos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Distribución */}
            <div className="bg-[#243D66] rounded-xl border border-white/5 p-6">
              <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-5">Distribución de ventas</h3>
              {periodSales.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Sin ventas en este período</p>
              ) : (
                <div className="space-y-5">
                  {distRows.map(row => (
                    <div key={row.label}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold" style={{ color: row.color }}>{row.label}</span>
                        <span className="text-xs text-gray-400 tabular-nums">{row.count} <span className="text-gray-600">({row.pct}%)</span></span>
                      </div>
                      <div className="h-2 bg-[#172A46] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(row.pct, row.count > 0 ? 2 : 0)}%`,
                            backgroundColor: row.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-gray-500 pt-1">{periodSales.length} venta{periodSales.length !== 1 ? 's' : ''} en total</p>
                </div>
              )}
            </div>

            {/* Top productos */}
            <div className="bg-[#243D66] rounded-xl border border-white/5 p-6">
              <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-5">Top 5 productos por unidades</h3>
              {topProducts.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Sin datos en este período</p>
              ) : (
                <div className="space-y-4">
                  {topProducts.map((p, i) => (
                    <div key={p.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xs font-bold text-gray-600 w-5 flex-shrink-0">#{i + 1}</span>
                          <span className="text-sm text-gray-200 truncate">{p.name}</span>
                        </div>
                        <span className="text-xs text-gray-400 ml-2 flex-shrink-0 tabular-nums">{p.qty} uds</span>
                      </div>
                      <div className="h-2 bg-[#172A46] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#D4AF37] rounded-full transition-all duration-500"
                          style={{ width: `${Math.max((p.qty / maxQty) * 100, 4)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Ingresos últimos 7 días */}
          {canViewRevenue && (
            <div className="bg-[#243D66] rounded-xl border border-white/5 p-6">
              <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-6">Ingresos últimos 7 días</h3>
              <div className="flex items-end gap-3 h-44">
                {dailyValues.map((d, i) => {
                  const pct = maxDaily > 0 ? Math.max((d.value / maxDaily) * 100, d.value > 0 ? 3 : 0) : 0
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full">
                      {/* Valor encima de la barra */}
                      <div className="flex-1 flex flex-col items-center justify-end">
                        {d.value > 0 && (
                          <span className="text-[10px] text-[#D4AF37] font-semibold mb-1 whitespace-nowrap">
                            ${Math.round(d.value)}
                          </span>
                        )}
                        <div
                          className="w-full rounded-t-md transition-all duration-500"
                          style={{
                            height: `${pct}%`,
                            minHeight: d.value > 0 ? '4px' : '0',
                            backgroundColor: d.value > 0 ? '#D4AF37' : '#172A46',
                          }}
                        />
                      </div>
                      <span className="text-[11px] text-gray-500 capitalize">{d.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
