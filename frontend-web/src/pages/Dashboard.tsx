import { useEffect, useState } from 'react'
import { api } from '../services/api'

interface Stats {
  products: number
  customers: number
  sales: number
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats>({ products: 0, customers: 0, sales: 0 })

  useEffect(() => {
    Promise.all([
      api.get('/products').then((r) => r.data.length),
      api.get('/customers').then((r) => r.data.length),
      api.get('/sales').then((r) => r.data.length),
    ]).then(([products, customers, sales]) => setStats({ products, customers, sales }))
  }, [])

  const cards = [
    { label: 'Productos', value: stats.products, color: 'bg-blue-500' },
    { label: 'Clientes', value: stats.customers, color: 'bg-green-500' },
    { label: 'Ventas', value: stats.sales, color: 'bg-purple-500' },
  ]

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4">
            <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl font-bold`}>
              {card.value}
            </div>
            <div>
              <p className="text-gray-500 text-sm">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
