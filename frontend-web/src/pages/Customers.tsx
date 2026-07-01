import { useEffect, useState } from 'react'
import { api } from '../services/api'

interface Customer {
  id: number
  name: string
  email: string | null
  phone: string | null
  document_type: string | null
  document_number: string | null
  is_active: boolean
}

export function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = (q?: string) => {
    setLoading(true)
    const params = q ? `?search=${encodeURIComponent(q)}` : ''
    api.get(`/customers${params}`).then((r) => { setCustomers(r.data); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    load(search)
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-100">Clientes</h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="border border-white/20 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          />
          <button type="submit" className="bg-[#D4AF37] hover:bg-[#B8860B] text-[#0F0F0F] px-3 py-1.5 rounded-lg text-sm font-semibold">Buscar</button>
        </form>
      </div>

      <div className="bg-[#243D66] rounded-xl shadow-sm overflow-x-auto -mx-4 md:mx-0 rounded-none md:rounded-xl">
        <table className="w-full text-sm min-w-[500px]">
          <thead className="bg-[#172A46] border-b border-[#1E3557] [&_th]:text-white">
            <tr>
              {['Nombre', 'Email', 'Teléfono', 'Documento', 'Estado'].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium text-white">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Cargando...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Sin clientes</td></tr>
            ) : customers.map((c) => (
              <tr key={c.id} className="hover:bg-[#1E3557]">
                <td className="px-4 py-3 font-medium text-gray-100">{c.name}</td>
                <td className="px-4 py-3 text-gray-400">{c.email || '—'}</td>
                <td className="px-4 py-3 text-gray-400">{c.phone || '—'}</td>
                <td className="px-4 py-3 text-gray-400">{c.document_number ? `${c.document_type} ${c.document_number}` : '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                    {c.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
