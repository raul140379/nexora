import { useEffect, useState } from 'react'
import { api } from '../services/api'
import toast from 'react-hot-toast'

interface Subcategory { id: number; name: string; is_active: boolean }
interface Category { id: number; name: string; description: string | null; is_active: boolean; subcategories?: Subcategory[] }

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showCatModal, setShowCatModal] = useState(false)
  const [showSubModal, setShowSubModal] = useState(false)
  const [selectedCat, setSelectedCat] = useState<Category | null>(null)
  const [catForm, setCatForm] = useState({ name: '', description: '' })
  const [subForm, setSubForm] = useState({ name: '' })
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [subtypes, setSubtypes] = useState<Record<number, Subcategory[]>>({})

  const load = () => {
    setLoading(true)
    api.get('/categories').then((r) => { setCategories(r.data); setLoading(false) })
  }

  const loadSubtypes = (categoryId: number) => {
    api.get(`/subcategories?category_id=${categoryId}`).then((r) => {
      setSubtypes((prev) => ({ ...prev, [categoryId]: r.data }))
    })
  }

  useEffect(() => { load() }, [])

  const toggleExpand = (cat: Category) => {
    if (expanded === cat.id) {
      setExpanded(null)
    } else {
      setExpanded(cat.id)
      loadSubtypes(cat.id)
    }
  }

  const handleSaveCat = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/categories', { name: catForm.name, description: catForm.description || null })
      toast.success('Categoría creada')
      setShowCatModal(false)
      setCatForm({ name: '', description: '' })
      load()
    } catch {
      toast.error('Error — ¿ya existe ese nombre?')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSub = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCat) return
    setSaving(true)
    try {
      await api.post('/subcategories', { category_id: selectedCat.id, name: subForm.name })
      toast.success(`Tipo "${subForm.name}" agregado a ${selectedCat.name}`)
      setShowSubModal(false)
      setSubForm({ name: '' })
      loadSubtypes(selectedCat.id)
      if (expanded !== selectedCat.id) setExpanded(selectedCat.id)
    } catch {
      toast.error('Error al crear el tipo')
    } finally {
      setSaving(false)
    }
  }

  const openSubModal = (cat: Category) => {
    setSelectedCat(cat)
    setSubForm({ name: '' })
    setShowSubModal(true)
  }

  if (loading) return <div className="p-8 text-[#6B7280]">Cargando...</div>

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold text-gray-100">Categorías y Tipos</h2>
        <button onClick={() => setShowCatModal(true)}
          className="bg-[#D4AF37] hover:bg-[#B8860B] text-[#0F0F0F] text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          + Nueva categoría
        </button>
      </div>

      <div className="space-y-3">
        {categories.length === 0 ? (
          <div className="bg-[#243D66] rounded-xl shadow-sm p-8 text-center text-[#6B7280]">
            Sin categorías — creá una con el botón de arriba
          </div>
        ) : categories.map((cat) => (
          <div key={cat.id} className="bg-[#243D66] rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <button onClick={() => toggleExpand(cat)} className="flex items-center gap-3 text-left flex-1">
                <span className={`text-[#6B7280] transition-transform ${expanded === cat.id ? 'rotate-90' : ''}`}>▶</span>
                <div>
                  <p className="font-semibold text-gray-100">{cat.name}</p>
                  {cat.description && <p className="text-xs text-[#6B7280] mt-0.5">{cat.description}</p>}
                </div>
              </button>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cat.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-[#6B7280]'}`}>
                  {cat.is_active ? 'Activa' : 'Inactiva'}
                </span>
                <button onClick={() => openSubModal(cat)}
                  className="text-xs bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#B8860B] font-medium px-3 py-1.5 rounded-lg transition-colors">
                  + Tipo
                </button>
              </div>
            </div>

            {expanded === cat.id && (
              <div className="border-t border-white/10 bg-[#172A46] px-5 py-3">
                {!subtypes[cat.id] ? (
                  <p className="text-sm text-[#6B7280]">Cargando tipos...</p>
                ) : subtypes[cat.id].length === 0 ? (
                  <p className="text-sm text-[#6B7280]">Sin tipos — hacé click en "+ Tipo" para agregar</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {subtypes[cat.id].map((sub) => (
                      <span key={sub.id} className={`text-sm px-3 py-1 rounded-full border ${
                        sub.is_active
                          ? 'bg-[#243D66] border-white/10 text-gray-300'
                          : 'bg-transparent border-white/10 text-gray-600 line-through'
                      }`}>
                        {sub.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal nueva categoría */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-[#243D66] rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-100">Nueva categoría</h3>
              <button onClick={() => setShowCatModal(false)} className="text-[#6B7280] hover:text-[#6B7280] text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSaveCat} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nombre *</label>
                <input value={catForm.name} onChange={(e) => setCatForm((p) => ({ ...p, name: e.target.value }))}
                  required autoFocus
                  className="w-full border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  placeholder="Ej: Licores, Ropa, Electrónica" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Descripción</label>
                <textarea value={catForm.description} onChange={(e) => setCatForm((p) => ({ ...p, description: e.target.value }))}
                  rows={2} className="w-full border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] resize-none"
                  placeholder="Descripción opcional" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCatModal(false)}
                  className="flex-1 border border-white/10 text-gray-300 text-sm font-medium py-2 rounded-lg hover:bg-[#1E3557]">Cancelar</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-[#D4AF37] hover:bg-[#B8860B] text-[#0F0F0F] text-sm font-semibold py-2 rounded-lg disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal nuevo tipo */}
      {showSubModal && selectedCat && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-[#243D66] rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-semibold text-gray-100">Nuevo tipo</h3>
              <button onClick={() => setShowSubModal(false)} className="text-[#6B7280] hover:text-[#6B7280] text-xl leading-none">&times;</button>
            </div>
            <p className="text-sm text-[#6B7280] mb-5">Categoría: <span className="font-medium text-gray-300">{selectedCat.name}</span></p>
            <form onSubmit={handleSaveSub} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nombre del tipo *</label>
                <input value={subForm.name} onChange={(e) => setSubForm({ name: e.target.value })}
                  required autoFocus
                  className="w-full border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  placeholder="Ej: Vinos, Cerveza, Vodka" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowSubModal(false)}
                  className="flex-1 border border-white/10 text-gray-300 text-sm font-medium py-2 rounded-lg hover:bg-[#1E3557]">Cancelar</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-[#D4AF37] hover:bg-[#B8860B] text-[#0F0F0F] text-sm font-semibold py-2 rounded-lg disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Agregar tipo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
