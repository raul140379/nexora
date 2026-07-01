import { useEffect, useRef, useState } from 'react'
import { api } from '../services/api'
import toast from 'react-hot-toast'

interface Subcategory { id: number; name: string }
interface Category { id: number; name: string }
interface PackPrice { pack_name: string; units_per_pack: string; price_a: string; price_b: string; price_c: string; stock: string }
interface ProductPrice { id: number; pack_name: string; units_per_pack: number; price_a: number; price_b: number | null; price_c: number | null; stock: number }
interface Product {
  id: number; name: string; sku: string | null; price: number; stock: number
  is_active: boolean; category: Category | null; subcategory: Subcategory | null
  prices: ProductPrice[]
}

const EMPTY_FORM = { name: '', sku: '', stock: '0', category_id: '', subcategory_id: '' }
const EMPTY_PACK: PackPrice = { pack_name: '', units_per_pack: '1', price_a: '', price_b: '', price_c: '', stock: '0' }
const fmt = (v: number | null | undefined) => v != null ? `$${Number(v).toFixed(2)}` : '—'

export function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [loading, setLoading] = useState(true)

  // filtros
  const [searchText, setSearchText] = useState('')
  const [filterCat, setFilterCat] = useState('__all__')
  const [filterSub, setFilterSub] = useState('__all__')
  const [filterPack, setFilterPack] = useState('__all__')

  // modal producto
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [packs, setPacks] = useState<PackPrice[]>([{ ...EMPTY_PACK, pack_name: 'Unidad', units_per_pack: '1' }])
  const [saving, setSaving] = useState(false)
  const [scanMode, setScanMode] = useState(false)
  const skuRef = useRef<HTMLInputElement>(null)

  // modal reposición de stock
  const [stockModal, setStockModal] = useState<{ packId: number; packName: string; productName: string; current: number } | null>(null)
  const [stockQty, setStockQty] = useState('1')
  const [stockSaving, setStockSaving] = useState(false)

  // modal eliminación
  const [deleteModal, setDeleteModal] = useState<{ id: number; name: string } | 'all' | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([api.get('/products').then(r => r.data), api.get('/categories').then(r => r.data)])
      .then(([prods, cats]) => { setProducts(prods); setCategories(cats); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  // Valores únicos para los filtros
  const allCategories = Array.from(
    new Map(products.filter(p => p.category).map(p => [p.category!.id, p.category!])).values()
  ).sort((a, b) => a.name.localeCompare(b.name))

  const allSubcategories = Array.from(
    new Map(
      products
        .filter(p => p.subcategory && (filterCat === '__all__' || p.category?.id === parseInt(filterCat)))
        .map(p => [p.subcategory!.id, p.subcategory!])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name))

  const allPackNames = Array.from(new Set(products.flatMap(p => p.prices.map(pr => pr.pack_name)))).sort()

  // Filas filtradas
  type Row = { product: Product; price: ProductPrice }
  const rows: Row[] = products.flatMap(p =>
    p.prices.map(pr => ({ product: p, price: pr }))
  ).filter(r => {
    if (filterCat !== '__all__' && r.product.category?.id !== parseInt(filterCat)) return false
    if (filterSub !== '__all__' && r.product.subcategory?.id !== parseInt(filterSub)) return false
    if (filterPack !== '__all__' && r.price.pack_name !== filterPack) return false
    if (searchText.trim()) {
      const q = searchText.toLowerCase()
      if (!r.product.name.toLowerCase().includes(q) && !(r.product.sku ?? '').toLowerCase().includes(q)) return false
    }
    return true
  })

  // handlers del formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => { const n = { ...prev, [name]: value }; if (name === 'category_id') n.subcategory_id = ''; return n })
    if (name === 'category_id' && value) api.get(`/subcategories?category_id=${value}`).then(r => setSubcategories(r.data))
    else if (name === 'category_id') setSubcategories([])
  }

  const handlePackChange = (i: number, field: keyof PackPrice, value: string) =>
    setPacks(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p))

  const addPack = () => setPacks(prev => [...prev, { ...EMPTY_PACK }])
  const removePack = (i: number) => setPacks(prev => prev.filter((_, idx) => idx !== i))

  const generateSku = () => {
    const cat = categories.find(c => c.id === parseInt(form.category_id))
    const sub = subcategories.find(s => s.id === parseInt(form.subcategory_id))
    const catCode = cat ? cat.name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3).padEnd(3, 'X') : 'PRD'
    const subCode = sub ? sub.name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 2).padEnd(2, 'X') : ''
    const prefix = subCode ? `${catCode}-${subCode}` : catCode
    const n = products.filter(p => p.sku?.startsWith(prefix + '-') && p.id !== editingId).length
    setForm(prev => ({ ...prev, sku: `${prefix}-${String(n + 1).padStart(3, '0')}` }))
  }

  const activateScan = () => { setScanMode(true); setTimeout(() => skuRef.current?.focus(), 50) }
  const handleSkuKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); setScanMode(false) } }

  const openCreate = () => {
    setEditingId(null); setForm(EMPTY_FORM); setScanMode(false); setSubcategories([])
    setPacks([{ pack_name: 'Unidad', units_per_pack: '1', price_a: '', price_b: '', price_c: '', stock: '0' }])
    setShowModal(true)
  }

  const openEdit = (p: Product) => {
    setEditingId(p.id)
    setForm({ name: p.name, sku: p.sku || '', stock: String(p.stock), category_id: p.category?.id ? String(p.category.id) : '', subcategory_id: p.subcategory?.id ? String(p.subcategory.id) : '' })
    setPacks(p.prices.length > 0
      ? p.prices.map(pr => ({ pack_name: pr.pack_name, units_per_pack: String(pr.units_per_pack), price_a: String(pr.price_a), price_b: pr.price_b != null ? String(pr.price_b) : '', price_c: pr.price_c != null ? String(pr.price_c) : '', stock: String(pr.stock) }))
      : [{ pack_name: 'Unidad', units_per_pack: '1', price_a: String(p.price), price_b: '', price_c: '', stock: '0' }])
    if (p.category?.id) api.get(`/subcategories?category_id=${p.category.id}`).then(r => setSubcategories(r.data))
    setScanMode(false); setShowModal(true)
  }

  const openStockModal = (product: Product, pr: ProductPrice) => {
    setStockModal({ packId: pr.id, packName: pr.pack_name, productName: product.name, current: pr.stock })
    setStockQty('1')
  }

  const handleAddStock = async () => {
    if (!stockModal) return
    const qty = parseInt(stockQty)
    if (!qty || qty <= 0) { toast.error('Ingresá una cantidad válida'); return }
    setStockSaving(true)
    try {
      await api.patch(`/products/prices/${stockModal.packId}/stock`, { quantity: qty })
      toast.success(`+${qty} unidades agregadas a ${stockModal.packName}`)
      setStockModal(null)
      load()
    } catch { toast.error('Error al actualizar stock') } finally { setStockSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteModal) return
    if (deleteModal === 'all' && deleteConfirmText !== 'ELIMINAR') {
      toast.error('Escribí ELIMINAR para confirmar')
      return
    }
    setDeleting(true)
    try {
      if (deleteModal === 'all') {
        await api.delete('/products')
        toast.success('Todos los productos eliminados')
      } else {
        await api.delete(`/products/${deleteModal.id}`)
        toast.success(`"${deleteModal.name}" eliminado`)
      }
      setDeleteModal(null)
      setDeleteConfirmText('')
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'No se puede eliminar: tiene ventas registradas')
    } finally {
      setDeleting(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (packs.length === 0 || !packs[0].price_a) { toast.error('Definí al menos el precio A del primer empaque'); return }
    setSaving(true)
    const payload = {
      name: form.name, sku: form.sku || null, price: parseFloat(packs[0].price_a) || 0,
      stock: 0, category_id: form.category_id ? parseInt(form.category_id) : null,
      subcategory_id: form.subcategory_id ? parseInt(form.subcategory_id) : null,
      prices: packs.filter(p => p.pack_name && p.price_a).map(p => ({
        pack_name: p.pack_name, units_per_pack: parseInt(p.units_per_pack) || 1,
        price_a: parseFloat(p.price_a),
        price_b: p.price_b ? parseFloat(p.price_b) : null,
        price_c: p.price_c ? parseFloat(p.price_c) : null,
        stock: parseInt(p.stock) || 0,
      }))
    }
    try {
      editingId ? await api.put(`/products/${editingId}`, payload) : await api.post('/products', payload)
      toast.success(editingId ? 'Producto actualizado' : 'Producto creado')
      setShowModal(false); load()
    } catch { toast.error('Error al guardar') } finally { setSaving(false) }
  }

  if (loading) return <div className="p-8 text-gray-500">Cargando...</div>

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Productos</h2>
        <div className="flex gap-2">
          <button onClick={() => { setDeleteModal('all'); setDeleteConfirmText('') }}
            className="border border-red-300 text-red-500 hover:bg-red-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            Eliminar todos
          </button>
          <button onClick={openCreate} className="bg-[#D4AF37] hover:bg-[#B8860B] text-[#0F0F0F] text-sm font-semibold px-4 py-2 rounded-lg">
            + Agregar producto
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative mb-3">
        <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
        <input
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          placeholder="Buscar por nombre o código..."
          className="border border-gray-300 rounded-lg pl-9 pr-8 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
        />
        {searchText && (
          <button onClick={() => setSearchText('')}
            className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 text-xs">✕</button>
        )}
      </div>

      {/* Filtro por Categoría */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-xs font-medium text-gray-500 w-20">Categoría:</span>
        <button onClick={() => { setFilterCat('__all__'); setFilterSub('__all__') }}
          className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${filterCat === '__all__' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          Todas
        </button>
        {allCategories.map(cat => (
          <button key={cat.id} onClick={() => { setFilterCat(String(cat.id)); setFilterSub('__all__') }}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${filterCat === String(cat.id) ? 'bg-[#D4AF37] text-[#0F0F0F]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Filtro por Tipo (solo si hay subcategorías disponibles) */}
      {allSubcategories.length > 0 && (
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-xs font-medium text-gray-500 w-20">Tipo:</span>
          <button onClick={() => setFilterSub('__all__')}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${filterSub === '__all__' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            Todos
          </button>
          {allSubcategories.map(sub => (
            <button key={sub.id} onClick={() => setFilterSub(String(sub.id))}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${filterSub === String(sub.id) ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {sub.name}
            </button>
          ))}
        </div>
      )}

      {/* Filtro por Empaque */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-xs font-medium text-gray-500 w-20">Empaque:</span>
        <button
          onClick={() => setFilterPack('__all__')}
          className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${filterPack === '__all__' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          Todos
        </button>
        {allPackNames.map(name => (
          <button key={name} onClick={() => setFilterPack(name)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${filterPack === name ? 'bg-[#D4AF37] text-[#0F0F0F]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {name}
          </button>
        ))}
        {(filterCat !== '__all__' || filterSub !== '__all__' || filterPack !== '__all__' || searchText) && (
          <>
            <span className="text-xs text-gray-400 ml-1">
              {rows.length} resultado{rows.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => { setSearchText(''); setFilterCat('__all__'); setFilterSub('__all__'); setFilterPack('__all__') }}
              className="text-xs text-red-400 hover:text-red-600 ml-1 underline">
              Limpiar filtros
            </button>
          </>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto -mx-4 md:mx-0 rounded-none md:rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Producto</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">SKU</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Categoría › Tipo</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap">Empaque</th>
              <th className="px-3 py-3 text-center font-medium text-blue-600 whitespace-nowrap">Precio A</th>
              <th className="px-3 py-3 text-center font-medium text-green-600 whitespace-nowrap">Precio B</th>
              <th className="px-3 py-3 text-center font-medium text-orange-500 whitespace-nowrap">Precio C</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600 whitespace-nowrap">Stock</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Estado</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400">Sin productos para este empaque</td></tr>
            ) : rows.map(({ product: p, price: pr }) => (
              <tr key={`${p.id}-${pr.id}`} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{p.sku || '—'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {p.category?.name || '—'}{p.subcategory && <span className="text-gray-400"> › {p.subcategory.name}</span>}
                </td>
                <td className="px-4 py-3 text-xs whitespace-nowrap">
                  <span className="font-medium text-gray-800">{pr.pack_name}</span>
                  {pr.units_per_pack > 1 && <span className="text-gray-400 ml-1">({pr.units_per_pack} un.)</span>}
                </td>
                <td className="px-3 py-3 text-center font-semibold text-blue-600">{fmt(pr.price_a)}</td>
                <td className="px-3 py-3 text-center font-semibold text-green-600">{fmt(pr.price_b)}</td>
                <td className="px-3 py-3 text-center font-semibold text-orange-500">{fmt(pr.price_c)}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className={`font-bold text-sm ${pr.stock === 0 ? 'text-red-500' : pr.stock <= 5 ? 'text-orange-500' : 'text-gray-900'}`}>
                      {pr.stock}
                    </span>
                    <button onClick={() => openStockModal(p, pr)}
                      title="Reponer stock"
                      className="text-xs bg-green-50 hover:bg-green-100 text-green-600 font-bold w-5 h-5 rounded-full flex items-center justify-center leading-none">
                      +
                    </button>
                  </div>
                  {pr.stock === 0 && <span className="text-xs text-red-400 block">sin stock</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(p)}
                      className="text-xs bg-gray-100 hover:bg-blue-100 hover:text-blue-600 text-gray-600 px-3 py-1.5 rounded-lg">
                      Editar
                    </button>
                    <button onClick={() => setDeleteModal({ id: p.id, name: p.name })}
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

      {/* Modal reposición de stock */}
      {stockModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Reponer stock</h3>
            <p className="text-sm text-gray-500 mb-4">
              <span className="font-medium text-gray-700">{stockModal.productName}</span>
              {' '} — <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">{stockModal.packName}</span>
              {' '} · Stock actual: <span className={`font-bold ${stockModal.current === 0 ? 'text-red-500' : 'text-gray-900'}`}>{stockModal.current}</span>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad a agregar</label>
                <input value={stockQty} onChange={e => setStockQty(e.target.value)}
                  type="number" min="1" autoFocus
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-green-500" />
                {parseInt(stockQty) > 0 && (
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    Nuevo stock: <span className="font-bold text-green-600">{stockModal.current + (parseInt(stockQty) || 0)}</span>
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStockModal(null)}
                  className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="button" onClick={handleAddStock} disabled={stockSaving}
                  className="flex-1 bg-[#D4AF37] hover:bg-[#B8860B] text-[#0F0F0F] text-sm font-semibold py-2 rounded-lg disabled:opacity-50">
                  {stockSaving ? 'Guardando...' : '+ Agregar stock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal crear / editar producto */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full max-w-2xl sm:mx-4 max-h-[95vh] sm:max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h3 className="text-lg font-semibold text-gray-900">{editingId ? 'Editar producto' : 'Nuevo producto'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input name="name" value={form.name} onChange={handleChange} required autoFocus
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  placeholder="Ej: Paceña 269" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select name="category_id" value={form.category_id} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]">
                    <option value="">Sin categoría</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select name="subcategory_id" value={form.subcategory_id} onChange={handleChange}
                    disabled={!form.category_id || subcategories.length === 0}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] disabled:bg-gray-50 disabled:text-gray-400">
                    <option value="">Sin tipo</option>
                    {subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">SKU / Código de barras</label>
                  <div className="flex gap-1.5">
                    <button type="button" onClick={generateSku}
                      className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-600 font-medium px-2 py-0.5 rounded-full">
                      ✦ Generar
                    </button>
                    <button type="button" onClick={activateScan}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${scanMode ? 'bg-green-100 text-green-700 animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600'}`}>
                      {scanMode ? '● Escaneando...' : '⊡ Escanear'}
                    </button>
                  </div>
                </div>
                <input ref={skuRef} name="sku" value={form.sku} onChange={handleChange} onKeyDown={handleSkuKey}
                  className={`w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 ${scanMode ? 'border-green-400 focus:ring-green-400 bg-green-50' : 'border-gray-300 focus:ring-[#D4AF37]'}`}
                  placeholder={scanMode ? 'Apuntá el lector aquí...' : 'Ej: 7790001234567'} />
              </div>

              {/* Grilla de empaques */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Empaques, precios y stock *</p>
                    <p className="text-xs text-gray-400 mt-0.5">A = precio mayor · B = precio medio · C = precio menor</p>
                  </div>
                  <button type="button" onClick={addPack}
                    className="text-xs bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#B8860B] font-medium px-3 py-1.5 rounded-full">
                    + Empaque
                  </button>
                </div>

                <div className="grid grid-cols-[140px_60px_1fr_1fr_1fr_70px_28px] gap-2 px-1 mb-1">
                  <span className="text-xs font-medium text-gray-500">Empaque</span>
                  <span className="text-xs font-medium text-gray-500 text-center">x Unid.</span>
                  <span className="text-xs font-medium text-blue-600 text-center">Precio A</span>
                  <span className="text-xs font-medium text-green-600 text-center">Precio B</span>
                  <span className="text-xs font-medium text-orange-500 text-center">Precio C</span>
                  <span className="text-xs font-medium text-gray-500 text-center">Stock ini.</span>
                  <span />
                </div>

                <div className="space-y-2">
                  {packs.map((pack, i) => (
                    <div key={i} className="grid grid-cols-[140px_60px_1fr_1fr_1fr_70px_28px] gap-2 items-center bg-gray-50 rounded-lg p-2">
                      <input value={pack.pack_name} onChange={e => handlePackChange(i, 'pack_name', e.target.value)}
                        placeholder="Unidad" required
                        className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37]" />
                      <input value={pack.units_per_pack} onChange={e => handlePackChange(i, 'units_per_pack', e.target.value)}
                        type="number" min="1" required
                        className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] text-center" />
                      <div className="relative">
                        <span className="absolute left-2 top-1.5 text-blue-400 text-xs font-bold">A $</span>
                        <input value={pack.price_a} onChange={e => handlePackChange(i, 'price_a', e.target.value)}
                          type="number" min="0" step="0.01" placeholder="0.00" required
                          className="w-full border border-blue-200 rounded-md pl-8 pr-1 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 text-right" />
                      </div>
                      <div className="relative">
                        <span className="absolute left-2 top-1.5 text-green-500 text-xs font-bold">B $</span>
                        <input value={pack.price_b} onChange={e => handlePackChange(i, 'price_b', e.target.value)}
                          type="number" min="0" step="0.01" placeholder="0.00"
                          className="w-full border border-green-200 rounded-md pl-8 pr-1 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-400 text-right" />
                      </div>
                      <div className="relative">
                        <span className="absolute left-2 top-1.5 text-orange-400 text-xs font-bold">C $</span>
                        <input value={pack.price_c} onChange={e => handlePackChange(i, 'price_c', e.target.value)}
                          type="number" min="0" step="0.01" placeholder="0.00"
                          className="w-full border border-orange-200 rounded-md pl-8 pr-1 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400 text-right" />
                      </div>
                      <input value={pack.stock} onChange={e => handlePackChange(i, 'stock', e.target.value)}
                        type="number" min="0" placeholder="0"
                        className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] text-center" />
                      <button type="button" onClick={() => removePack(i)} disabled={packs.length === 1}
                        className="text-red-400 hover:text-red-600 text-lg leading-none disabled:opacity-30">&times;</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-1 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-[#D4AF37] hover:bg-[#B8860B] text-[#0F0F0F] text-sm font-semibold py-2.5 rounded-lg disabled:opacity-50">
                  {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Guardar producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmación eliminar */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            {deleteModal === 'all' ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-xl">⚠</div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Eliminar todos los productos</h3>
                    <p className="text-sm text-red-600 font-medium">Esta acción no se puede deshacer</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Se eliminarán <span className="font-bold">todos los productos</span> y sus presentaciones de precio. Las ventas registradas no se verán afectadas.
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Escribí <span className="font-bold text-red-600">ELIMINAR</span> para confirmar
                  </label>
                  <input
                    value={deleteConfirmText}
                    onChange={e => setDeleteConfirmText(e.target.value)}
                    autoFocus
                    className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                    placeholder="ELIMINAR"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-xl">🗑</div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Eliminar producto</h3>
                    <p className="text-sm text-gray-500">Esta acción no se puede deshacer</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-5">
                  ¿Confirmás que querés eliminar{' '}
                  <span className="font-bold text-gray-900">"{deleteModal.name}"</span>?{' '}
                  Se eliminarán también todas sus presentaciones de precio.
                </p>
              </>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setDeleteModal(null); setDeleteConfirmText('') }}
                className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50">
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || (deleteModal === 'all' && deleteConfirmText !== 'ELIMINAR')}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2.5 rounded-lg disabled:opacity-40">
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
