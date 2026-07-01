import { useEffect, useState } from 'react'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import { usePermissionsStore } from '../store/permissions.store'

interface PermItem  { key: string; label: string; allowed: boolean }
interface RolePerms { role: string; permissions: PermItem[] }

const ROLE_META: Record<string, { label: string; badge: string; desc: string }> = {
  admin:     { label: 'Administrador',       badge: 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/40',        desc: 'Acceso total al sistema' },
  ejecutivo: { label: 'Ejecutivo de Ventas', badge: 'bg-blue-900/40 text-blue-300 border-blue-800/40',           desc: 'Gestión operativa' },
  vendedor:  { label: 'Vendedor Asistente',  badge: 'bg-green-900/40 text-green-300 border-green-800/40',        desc: 'Operaciones de venta' },
}

export function Permissions() {
  const [data, setData]       = useState<RolePerms[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>('ejecutivo')
  const reloadMyPerms = usePermissionsStore(s => s.load)

  const load = () => {
    setLoading(true)
    api.get<RolePerms[]>('/permissions')
      .then(r => { setData(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const toggle = async (role: string, key: string, current: boolean) => {
    const id = `${role}:${key}`
    setSaving(id)
    try {
      await api.put(`/permissions/${role}/${key}`, { allowed: !current })
      setData(prev => prev.map(r =>
        r.role !== role ? r : {
          ...r,
          permissions: r.permissions.map(p =>
            p.key !== key ? p : { ...p, allowed: !current }
          )
        }
      ))
      // Recarga mis propios permisos si se modificó mi rol
      await reloadMyPerms()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error al actualizar permiso')
    } finally {
      setSaving(null)
    }
  }

  const resetRole = async (role: string) => {
    if (!confirm(`¿Restaurar los permisos de ${ROLE_META[role]?.label} a valores por defecto?`)) return
    try {
      await api.post(`/permissions/${role}/reset`)
      toast.success('Permisos restaurados')
      load()
      await reloadMyPerms()
    } catch {
      toast.error('Error al restaurar')
    }
  }

  const current = data.find(r => r.role === activeTab)

  return (
    <div className="p-4 md:p-8 pb-20">

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-100 tracking-tight">Permisos y Roles</h2>
        <p className="text-sm text-gray-400 mt-0.5">Controlá qué puede ver y hacer cada rol en el sistema</p>
      </div>

      {/* Tabs de roles */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {['admin', 'ejecutivo', 'vendedor'].map(role => {
          const m = ROLE_META[role]
          const active = activeTab === role
          return (
            <button key={role} onClick={() => setActiveTab(role)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-[#243D66] border-[#D4AF37]/40 text-gray-100 shadow-sm'
                  : 'bg-[#172A46] border-white/10 text-gray-400 hover:text-gray-200 hover:border-white/20'
              }`}>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${m.badge}`}>{m.label}</span>
              <span className="text-xs text-gray-500">{m.desc}</span>
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Cargando permisos...</div>
      ) : current ? (
        <div className="bg-[#243D66] rounded-2xl border border-white/5 shadow-sm overflow-hidden">

          {/* Tabla header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${ROLE_META[current.role]?.badge}`}>
                {ROLE_META[current.role]?.label}
              </span>
              <span className="text-xs text-gray-500">
                {current.permissions.filter(p => p.allowed).length} de {current.permissions.length} permisos activos
              </span>
            </div>
            {current.role !== 'admin' && (
              <button onClick={() => resetRole(current.role)}
                className="text-xs text-gray-500 hover:text-[#D4AF37] border border-white/10 hover:border-[#D4AF37]/30 px-3 py-1.5 rounded-lg transition-all duration-200">
                ↺ Restaurar defaults
              </button>
            )}
          </div>

          {/* Lista de permisos */}
          <div className="divide-y divide-white/5">
            {current.permissions.map(p => {
              const id = `${current.role}:${p.key}`
              const isLoading = saving === id
              const isAdminCore = current.role === 'admin' && p.key === 'manage_users'

              return (
                <div key={p.key}
                  className={`flex items-center justify-between px-6 py-4 transition-colors duration-150 ${
                    p.allowed ? 'hover:bg-[#1E3557]/40' : 'hover:bg-[#172A46]/60 opacity-60'
                  }`}>
                  <div className="flex items-center gap-4">
                    {/* Indicador visual */}
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.allowed ? 'bg-green-500' : 'bg-gray-600'}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-100">{p.label}</p>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">{p.key}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isAdminCore && (
                      <span className="text-xs text-gray-600 italic">bloqueado</span>
                    )}
                    {/* Toggle switch */}
                    <button
                      disabled={isLoading || isAdminCore}
                      onClick={() => toggle(current.role, p.key, p.allowed)}
                      className={`relative w-11 h-6 rounded-full border transition-all duration-200 focus:outline-none ${
                        isAdminCore
                          ? 'cursor-not-allowed opacity-40'
                          : 'cursor-pointer'
                      } ${
                        p.allowed
                          ? 'bg-[#D4AF37] border-[#B8860B]'
                          : 'bg-[#172A46] border-white/20'
                      }`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                        p.allowed ? 'translate-x-5' : 'translate-x-0.5'
                      } ${isLoading ? 'opacity-60' : ''}`} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      {/* Info box */}
      <div className="mt-6 bg-blue-900/20 border border-blue-800/30 rounded-xl px-5 py-4 flex gap-3">
        <span className="text-blue-400 text-lg flex-shrink-0">ℹ</span>
        <div>
          <p className="text-sm font-medium text-blue-300">Sobre los permisos</p>
          <p className="text-xs text-gray-400 mt-1">
            Los cambios se aplican de inmediato. El rol <strong className="text-gray-300">Administrador</strong> siempre tiene acceso total y no puede perder el permiso de gestión de usuarios. Los usuarios deben cerrar sesión y volver a entrar para ver los cambios aplicados.
          </p>
        </div>
      </div>

    </div>
  )
}
