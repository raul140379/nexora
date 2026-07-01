import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { ROLE_LABELS, UserRole } from '../store/auth.store'
import toast from 'react-hot-toast'

interface UserData {
  id: number; email: string; username: string; full_name: string | null
  role: UserRole; is_active: boolean; created_at: string
}

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-purple-100 text-purple-700',
  ejecutivo: 'bg-blue-100 text-blue-700',
  vendedor: 'bg-green-100 text-green-700',
}

const EMPTY = { email: '', username: '', full_name: '', password: '', role: 'vendedor' as UserRole }

export function Users() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/users').then(r => { setUsers(r.data); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY)
    setShowModal(true)
  }

  const openEdit = (u: UserData) => {
    setEditingId(u.id)
    setForm({ email: u.email, username: u.username, full_name: u.full_name || '', password: '', role: u.role })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload: Record<string, unknown> = {
      email: form.email, username: form.username,
      full_name: form.full_name || null, role: form.role,
    }
    if (!editingId || form.password) payload.password = form.password
    if (!editingId && !form.password) { toast.error('La contraseña es obligatoria'); setSaving(false); return }

    try {
      if (editingId) {
        await api.put(`/users/${editingId}`, payload)
        toast.success('Usuario actualizado')
      } else {
        await api.post('/users', payload)
        toast.success('Usuario creado')
      }
      setShowModal(false)
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error al guardar')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await api.delete(`/users/${deleteId}`)
      toast.success('Usuario eliminado')
      setDeleteId(null)
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error al eliminar')
    } finally { setDeleting(false) }
  }

  if (loading) return <div className="p-8 text-[#6B7280]">Cargando...</div>

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Usuarios</h2>
          <p className="text-sm text-[#6B7280] mt-0.5">Gestión de accesos y roles del sistema</p>
        </div>
        <button onClick={openCreate}
          className="bg-[#D4AF37] hover:bg-[#B8860B] text-[#0F0F0F] text-sm font-semibold px-4 py-2 rounded-lg">
          + Nuevo usuario
        </button>
      </div>

      <div className="bg-[#243D66] rounded-xl shadow-sm overflow-x-auto -mx-4 md:mx-0 rounded-none md:rounded-xl">
        <table className="w-full text-sm min-w-[560px]">
          <thead className="bg-[#172A46] border-b border-[#1E3557] [&_th]:text-white">
            <tr>
              {['Nombre', 'Usuario', 'Email', 'Rol', 'Estado', 'Acciones'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium text-white">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-[#1E3557]">
                <td className="px-4 py-3 font-medium text-gray-100">{u.full_name || '—'}</td>
                <td className="px-4 py-3 text-[#6B7280] font-mono text-xs">@{u.username}</td>
                <td className="px-4 py-3 text-[#6B7280]">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[u.role]}`}>
                    {ROLE_LABELS[u.role]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {u.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(u)}
                      className="text-xs bg-[#172A46] hover:bg-blue-100 hover:text-blue-600 text-[#6B7280] px-3 py-1.5 rounded-lg">
                      Editar
                    </button>
                    <button onClick={() => setDeleteId(u.id)}
                      className="text-xs bg-red-50 hover:bg-red-100 text-red-500 px-3 py-1.5 rounded-lg">
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal crear/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-[#243D66] rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-100">{editingId ? 'Editar usuario' : 'Nuevo usuario'}</h3>
              <button onClick={() => setShowModal(false)} className="text-[#6B7280] hover:text-[#6B7280] text-xl">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nombre completo</label>
                <input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                  autoFocus
                  className="w-full border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  placeholder="Ej: Juan Pérez" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Usuario *</label>
                  <input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                    required
                    className="w-full border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    placeholder="usuario123" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Rol *</label>
                  <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as UserRole }))}
                    className="w-full border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]">
                    <option value="admin">Administrador</option>
                    <option value="ejecutivo">Ejecutivo de Ventas</option>
                    <option value="vendedor">Vendedor Asistente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email *</label>
                <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  type="email" required
                  className="w-full border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  placeholder="usuario@empresa.com" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Contraseña {editingId && <span className="text-[#6B7280] font-normal">(dejar vacío para no cambiar)</span>}
                </label>
                <input value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  type="password" required={!editingId}
                  className="w-full border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  placeholder="••••••••" />
              </div>

              {/* Preview del rol seleccionado */}
              <div className={`rounded-lg px-3 py-2 text-xs ${ROLE_COLORS[form.role]}`}>
                <span className="font-medium">{ROLE_LABELS[form.role]}: </span>
                {form.role === 'admin' && 'Acceso total al sistema.'}
                {form.role === 'ejecutivo' && 'Puede gestionar ventas, clientes y productos.'}
                {form.role === 'vendedor' && 'Solo puede registrar ventas y ver productos.'}
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-white/10 text-gray-300 text-sm font-medium py-2.5 rounded-lg hover:bg-[#1E3557]">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-[#D4AF37] hover:bg-[#B8860B] text-[#0F0F0F] text-sm font-semibold py-2.5 rounded-lg disabled:opacity-50">
                  {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-[#243D66] rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-100 mb-2">Eliminar usuario</h3>
            <p className="text-sm text-[#6B7280] mb-5">
              ¿Confirmás que querés eliminar este usuario? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 border border-white/10 text-gray-300 text-sm font-medium py-2 rounded-lg hover:bg-[#1E3557]">
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-50">
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
