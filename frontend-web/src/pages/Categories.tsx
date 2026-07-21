import { useEffect, useState } from 'react'
import { api } from '../services/api'
import toast from 'react-hot-toast'

interface Subcategory { id: number; name: string; is_active: boolean }
interface Category { id: number; name: string; description: string | null; is_active: boolean }

const EMPTY_CAT = { name: '', description: '', is_active: true }

export function Categories() {
  const [categories, setCategories]   = useState<Category[]>([])
  const [loading, setLoading]         = useState(true)
  const [expanded, setExpanded]       = useState<number | null>(null)
  const [subtypes, setSubtypes]       = useState<Record<number, Subcategory[]>>({})

  // Category modal (create / edit)
  const [catModal, setCatModal]       = useState(false)
  const [editingCat, setEditingCat]   = useState<Category | null>(null)
  const [catForm, setCatForm]         = useState(EMPTY_CAT)
  const [savingCat, setSavingCat]     = useState(false)

  // Delete category
  const [deleteCatId, setDeleteCatId] = useState<number | null>(null)
  const [deletingCat, setDeletingCat] = useState(false)

  // Subcategory modal (create / edit)
  const [subModal, setSubModal]       = useState(false)
  const [subCatId, setSubCatId]       = useState<number | null>(null)   // parent
  const [editingSub, setEditingSub]   = useState<Subcategory | null>(null)
  const [subName, setSubName]         = useState('')
  const [savingSub, setSavingSub]     = useState(false)

  // Delete subcategory
  const [deleteSubInfo, setDeleteSubInfo] = useState<{ subId: number; catId: number } | null>(null)
  const [deletingSub, setDeletingSub]     = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/categories').then(r => { setCategories(r.data); setLoading(false) })
  }

  const loadSubs = (catId: number) =>
    api.get(`/subcategories?category_id=${catId}`).then(r =>
      setSubtypes(prev => ({ ...prev, [catId]: r.data }))
    )

  useEffect(() => { load() }, [])

  const toggleExpand = (cat: Category) => {
    if (expanded === cat.id) { setExpanded(null); return }
    setExpanded(cat.id)
    loadSubs(cat.id)
  }

  // ── Category handlers ────────────────────────────────────────────────────────

  const openCreateCat = () => {
    setEditingCat(null)
    setCatForm(EMPTY_CAT)
    setCatModal(true)
  }

  const openEditCat = (cat: Category) => {
    setEditingCat(cat)
    setCatForm({ name: cat.name, description: cat.description ?? '', is_active: cat.is_active })
    setCatModal(true)
  }

  const handleSaveCat = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingCat(true)
    const payload = { name: catForm.name, description: catForm.description || null, is_active: catForm.is_active }
    try {
      if (editingCat) {
        await api.put(`/categories/${editingCat.id}`, payload)
        toast.success('Categoría actualizada')
      } else {
        await api.post('/categories', payload)
        toast.success('Categoría creada')
      }
      setCatModal(false)
      load()
    } catch {
      toast.error('Error — ¿ya existe ese nombre?')
    } finally { setSavingCat(false) }
  }

  const handleDeleteCat = async () => {
    if (!deleteCatId) return
    setDeletingCat(true)
    try {
      await api.delete(`/categories/${deleteCatId}`)
      toast.success('Categoría eliminada')
      setDeleteCatId(null)
      if (expanded === deleteCatId) setExpanded(null)
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error al eliminar')
    } finally { setDeletingCat(false) }
  }

  // ── Subcategory handlers ─────────────────────────────────────────────────────

  const openCreateSub = (catId: number) => {
    setSubCatId(catId)
    setEditingSub(null)
    setSubName('')
    setSubModal(true)
  }

  const openEditSub = (sub: Subcategory, catId: number) => {
    setSubCatId(catId)
    setEditingSub(sub)
    setSubName(sub.name)
    setSubModal(true)
  }

  const handleSaveSub = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subCatId) return
    setSavingSub(true)
    try {
      if (editingSub) {
        await api.put(`/subcategories/${editingSub.id}`, { name: subName })
        toast.success('Tipo actualizado')
      } else {
        await api.post('/subcategories', { category_id: subCatId, name: subName })
        toast.success(`Tipo "${subName}" agregado`)
      }
      setSubModal(false)
      loadSubs(subCatId)
      if (expanded !== subCatId) setExpanded(subCatId)
    } catch {
      toast.error('Error al guardar el tipo')
    } finally { setSavingSub(false) }
  }

  const handleDeleteSub = async () => {
    if (!deleteSubInfo) return
    setDeletingSub(true)
    try {
      await api.delete(`/subcategories/${deleteSubInfo.subId}`)
      toast.success('Tipo eliminado')
      loadSubs(deleteSubInfo.catId)
      setDeleteSubInfo(null)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error al eliminar')
    } finally { setDeletingSub(false) }
  }

  if (loading) return <div className="p-8 text-gray-400">Cargando...</div>

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Categorías y Tipos</h2>
          <p className="text-sm text-gray-500 mt-0.5">Organización de productos por categoría</p>
        </div>
        <button onClick={openCreateCat}
          className="bg-[#D4AF37] hover:bg-[#B8860B] text-[#0F0F0F] text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          + Nueva categoría
        </button>
      </div>

      <div className="space-y-3">
        {categories.length === 0 ? (
          <div className="bg-[#243D66] rounded-xl p-8 text-center text-gray-500">
            Sin categorías — creá una con el botón de arriba
          </div>
        ) : categories.map(cat => (
          <div key={cat.id} className="bg-[#243D66] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 gap-3">
              <button onClick={() => toggleExpand(cat)} className="flex items-center gap-3 text-left flex-1 min-w-0">
                <span className={`text-gray-500 transition-transform flex-shrink-0 ${expanded === cat.id ? 'rotate-90' : ''}`}>▶</span>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-100">{cat.name}</p>
                  {cat.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{cat.description}</p>}
                </div>
              </button>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                  cat.is_active
                    ? 'bg-green-900/30 text-green-400 border-green-800/30'
                    : 'bg-red-900/20 text-red-400 border-red-800/30'
                }`}>
                  {cat.is_active ? 'Activa' : 'Inactiva'}
                </span>
                <button onClick={() => openCreateSub(cat.id)}
                  className="text-xs bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#B8860B] font-medium px-3 py-1.5 rounded-lg transition-colors">
                  + Tipo
                </button>
                <button onClick={() => openEditCat(cat)}
                  className="text-xs bg-[#172A46] hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] text-gray-400 px-3 py-1.5 rounded-lg border border-white/10 transition-colors">
                  Editar
                </button>
                <button onClick={() => setDeleteCatId(cat.id)}
                  className="text-xs bg-red-900/20 hover:bg-red-900/40 text-red-400 px-3 py-1.5 rounded-lg border border-red-800/30 transition-colors">
                  Eliminar
                </button>
              </div>
            </div>

            {expanded === cat.id && (
              <div className="border-t border-white/10 bg-[#172A46] px-5 py-4">
                {!subtypes[cat.id] ? (
                  <p className="text-sm text-gray-500">Cargando tipos...</p>
                ) : subtypes[cat.id].length === 0 ? (
                  <p className="text-sm text-gray-500">Sin tipos — hacé click en "+ Tipo" para agregar</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {subtypes[cat.id].map(sub => (
                      <div key={sub.id}
                        className={`group flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition-colors ${
                          sub.is_active
                            ? 'bg-[#243D66] border-white/10 text-gray-300'
                            : 'bg-transparent border-white/10 text-gray-600 line-through'
                        }`}>
                        <span>{sub.name}</span>
                        <span className="hidden group-hover:flex items-center gap-1 ml-1">
                          <button
                            onClick={() => openEditSub(sub, cat.id)}
                            className="text-[#D4AF37] hover:text-[#B8860B] leading-none text-xs"
                            title="Editar">
                            ✎
                          </button>
                          <button
                            onClick={() => setDeleteSubInfo({ subId: sub.id, catId: cat.id })}
                            className="text-red-400 hover:text-red-300 leading-none text-xs"
                            title="Eliminar">
                            ✕
                          </button>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal crear / editar categoría */}
      {catModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-[#243D66] rounded-2xl shadow-2xl w-full max-w-sm border border-white/10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h3 className="text-base font-semibold text-gray-100">
                {editingCat ? 'Editar categoría' : 'Nueva categoría'}
              </h3>
              <button onClick={() => setCatModal(false)} className="text-gray-400 hover:text-gray-200 text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSaveCat} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Nombre *</label>
                <input
                  value={catForm.name}
                  onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))}
                  required autoFocus
                  placeholder="Ej: Licores, Ropa, Electrónica"
                  className="w-full bg-[#172A46] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Descripción</label>
                <textarea
                  value={catForm.description}
                  onChange={e => setCatForm(p => ({ ...p, description: e.target.value }))}
                  rows={2}
                  placeholder="Descripción opcional"
                  className="w-full bg-[#172A46] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] resize-none"
                />
              </div>
              {editingCat && (
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={catForm.is_active}
                      onChange={e => setCatForm(p => ({ ...p, is_active: e.target.checked }))}
                      className="sr-only"
                    />
                    <div className={`w-10 h-5 rounded-full transition-colors ${catForm.is_active ? 'bg-[#D4AF37]' : 'bg-gray-600'}`} />
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${catForm.is_active ? 'translate-x-5' : ''}`} />
                  </div>
                  <span className="text-sm text-gray-300">Categoría activa</span>
                </label>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setCatModal(false)}
                  className="flex-1 border border-white/10 text-gray-300 text-sm font-medium py-2.5 rounded-lg hover:bg-[#1E3557] transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={savingCat}
                  className="flex-1 bg-[#D4AF37] hover:bg-[#B8860B] text-[#0F0F0F] text-sm font-semibold py-2.5 rounded-lg disabled:opacity-50 transition-colors">
                  {savingCat ? 'Guardando...' : editingCat ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar categoría */}
      {deleteCatId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-[#243D66] rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-900/30 rounded-xl flex items-center justify-center text-red-400 text-lg">⚠</div>
              <div>
                <h3 className="text-base font-semibold text-gray-100">Eliminar categoría</h3>
                <p className="text-xs text-gray-400 mt-0.5">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-5">
              Se eliminará la categoría y todos sus tipos asociados.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteCatId(null)}
                className="flex-1 border border-white/10 text-gray-300 text-sm font-medium py-2.5 rounded-lg hover:bg-[#1E3557] transition-colors">
                Cancelar
              </button>
              <button onClick={handleDeleteCat} disabled={deletingCat}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2.5 rounded-lg disabled:opacity-50 transition-colors">
                {deletingCat ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal crear / editar tipo (subcategoría) */}
      {subModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-[#243D66] rounded-2xl shadow-2xl w-full max-w-sm border border-white/10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div>
                <h3 className="text-base font-semibold text-gray-100">
                  {editingSub ? 'Editar tipo' : 'Nuevo tipo'}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Categoría: {categories.find(c => c.id === subCatId)?.name}
                </p>
              </div>
              <button onClick={() => setSubModal(false)} className="text-gray-400 hover:text-gray-200 text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSaveSub} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Nombre *</label>
                <input
                  value={subName}
                  onChange={e => setSubName(e.target.value)}
                  required autoFocus
                  placeholder="Ej: Vinos, Cerveza, Vodka"
                  className="w-full bg-[#172A46] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setSubModal(false)}
                  className="flex-1 border border-white/10 text-gray-300 text-sm font-medium py-2.5 rounded-lg hover:bg-[#1E3557] transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={savingSub}
                  className="flex-1 bg-[#D4AF37] hover:bg-[#B8860B] text-[#0F0F0F] text-sm font-semibold py-2.5 rounded-lg disabled:opacity-50 transition-colors">
                  {savingSub ? 'Guardando...' : editingSub ? 'Actualizar' : 'Agregar tipo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar tipo */}
      {deleteSubInfo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-[#243D66] rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-900/30 rounded-xl flex items-center justify-center text-red-400 text-lg">⚠</div>
              <div>
                <h3 className="text-base font-semibold text-gray-100">Eliminar tipo</h3>
                <p className="text-xs text-gray-400 mt-0.5">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-5">
              ¿Confirmás que querés eliminar este tipo?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteSubInfo(null)}
                className="flex-1 border border-white/10 text-gray-300 text-sm font-medium py-2.5 rounded-lg hover:bg-[#1E3557] transition-colors">
                Cancelar
              </button>
              <button onClick={handleDeleteSub} disabled={deletingSub}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2.5 rounded-lg disabled:opacity-50 transition-colors">
                {deletingSub ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
