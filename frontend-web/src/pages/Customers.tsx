import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { Pagination } from '../components/ui'
import toast from 'react-hot-toast'

interface Customer {
  id: number
  name: string
  email: string | null
  phone: string | null
  address: string | null
  document_type: string | null
  document_number: string | null
  is_active: boolean
}

const DOC_TYPES = ['CI', 'DNI', 'RUT', 'Pasaporte', 'Otro']

const EMPTY_FORM = { name: '', email: '', phone: '', address: '', document_type: '', document_number: '' }

export function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [togglingId, setTogglingId] = useState<number | null>(null)

  const load = (q?: string) => {
    setLoading(true)
    const params = q ? `?search=${encodeURIComponent(q)}` : ''
    api.get(`/customers${params}`).then(r => { setCustomers(r.data); setPage(1); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    load(search)
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  const openEdit = (c: Customer) => {
    setEditingId(c.id)
    setForm({
      name: c.name,
      email: c.email || '',
      phone: c.phone || '',
      address: c.address || '',
      document_type: c.document_type || '',
      document_number: c.document_number || '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      name: form.name,
      email: form.email || null,
      phone: form.phone || null,
      address: form.address || null,
      document_type: form.document_type || null,
      document_number: form.document_number || null,
    }
    try {
      if (editingId) {
        await api.put(`/customers/${editingId}`, payload)
        toast.success('Cliente actualizado')
      } else {
        await api.post('/customers', payload)
        toast.success('Cliente creado')
      }
      setShowModal(false)
      load(search || undefined)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error al guardar')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await api.delete(`/customers/${deleteId}`)
      toast.success('Cliente eliminado')
      setDeleteId(null)
      load(search || undefined)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error al eliminar')
    } finally { setDeleting(false) }
  }

  const toggleActive = async (c: Customer) => {
    setTogglingId(c.id)
    try {
      await api.put(`/customers/${c.id}`, { is_active: !c.is_active })
      setCustomers(prev => prev.map(x => x.id === c.id ? { ...x, is_active: !c.is_active } : x))
      toast.success(c.is_active ? 'Cliente desactivado' : 'Cliente activado')
    } catch {
      toast.error('Error al cambiar estado')
    } finally { setTogglingId(null) }
  }

  return (
    <div className="p-4 md:p-8">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-100">Clientes</h2>
          <p className="text-sm text-gray-500 mt-0.5">Gestión de clientes registrados</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre, email..."
              className="border border-white/20 bg-[#172A46] text-gray-100 placeholder-gray-500 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] w-48"
            />
            <button type="submit" className="bg-[#172A46] hover:bg-[#1E3557] text-gray-300 border border-white/10 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
              Buscar
            </button>
          </form>
          <button onClick={openCreate}
            className="bg-[#D4AF37] hover:bg-[#B8860B] text-[#0F0F0F] px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors">
            + Nuevo cliente
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-[#243D66] rounded-xl shadow-sm overflow-x-auto -mx-4 md:mx-0 md:rounded-xl">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-[#172A46] border-b border-[#1E3557]">
            <tr>
              {['Nombre', 'Email', 'Teléfono', 'Documento', 'Estado', 'Acciones'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium text-white">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Cargando...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                {search ? 'Sin resultados para esa búsqueda' : 'Sin clientes — creá uno con el botón de arriba'}
              </td></tr>
            ) : customers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(c => (
              <tr key={c.id} className="hover:bg-[#1E3557] transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-100">{c.name}</p>
                  {c.address && <p className="text-xs text-gray-500 mt-0.5">{c.address}</p>}
                </td>
                <td className="px-4 py-3 text-gray-400">{c.email || '—'}</td>
                <td className="px-4 py-3 text-gray-400">{c.phone || '—'}</td>
                <td className="px-4 py-3 text-gray-400">
                  {c.document_number ? `${c.document_type} ${c.document_number}` : '—'}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(c)}
                    disabled={togglingId === c.id}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors disabled:opacity-50 ${
                      c.is_active
                        ? 'bg-green-900/30 text-green-400 border-green-800/30 hover:bg-red-900/20 hover:text-red-400 hover:border-red-800/30'
                        : 'bg-red-900/30 text-red-400 border-red-800/30 hover:bg-green-900/20 hover:text-green-400 hover:border-green-800/30'
                    }`}
                    title={c.is_active ? 'Click para desactivar' : 'Click para activar'}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${c.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                    {c.is_active ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(c)}
                      className="text-xs bg-[#172A46] hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] text-gray-400 px-3 py-1.5 rounded-lg border border-white/10 transition-colors">
                      Editar
                    </button>
                    <button onClick={() => setDeleteId(c.id)}
                      className="text-xs bg-red-900/20 hover:bg-red-900/40 text-red-400 px-3 py-1.5 rounded-lg border border-red-800/30 transition-colors">
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageSize={PAGE_SIZE} total={customers.length} onChange={setPage} />

      {/* Modal crear / editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-[#243D66] rounded-2xl shadow-2xl w-full max-w-md border border-white/10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div>
                <h3 className="text-base font-semibold text-gray-100">{editingId ? 'Editar cliente' : 'Nuevo cliente'}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{editingId ? 'Modificá los datos del cliente' : 'Completá los datos del nuevo cliente'}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-200 text-xl leading-none">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Nombre *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  required autoFocus
                  placeholder="Ej: Juan Pérez"
                  className="w-full bg-[#172A46] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="cliente@email.com"
                    className="w-full bg-[#172A46] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Teléfono</label>
                  <input
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+591 70000000"
                    className="w-full bg-[#172A46] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Dirección</label>
                <input
                  value={form.address}
                  onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  placeholder="Ej: Av. Siempre Viva 742"
                  className="w-full bg-[#172A46] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Tipo doc.</label>
                  <select
                    value={form.document_type}
                    onChange={e => setForm(p => ({ ...p, document_type: e.target.value }))}
                    className="w-full bg-[#172A46] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] transition-all"
                  >
                    <option value="">Sin documento</option>
                    {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Nro. documento</label>
                  <input
                    value={form.document_number}
                    onChange={e => setForm(p => ({ ...p, document_number: e.target.value }))}
                    placeholder="12345678"
                    disabled={!form.document_type}
                    className="w-full bg-[#172A46] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] disabled:opacity-40 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t border-white/10">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-white/10 text-gray-300 text-sm font-medium py-2.5 rounded-lg hover:bg-[#1E3557] transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-[#D4AF37] hover:bg-[#B8860B] text-[#0F0F0F] text-sm font-semibold py-2.5 rounded-lg disabled:opacity-50 transition-colors">
                  {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-[#243D66] rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-900/30 rounded-xl flex items-center justify-center text-red-400 text-lg">⚠</div>
              <div>
                <h3 className="text-base font-semibold text-gray-100">Eliminar cliente</h3>
                <p className="text-xs text-gray-400 mt-0.5">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-5">
              ¿Confirmás que querés eliminar este cliente? Se perderán todos sus datos.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 border border-white/10 text-gray-300 text-sm font-medium py-2.5 rounded-lg hover:bg-[#1E3557] transition-colors">
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2.5 rounded-lg disabled:opacity-50 transition-colors">
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
