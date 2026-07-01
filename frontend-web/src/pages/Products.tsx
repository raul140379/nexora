import { useEffect, useRef, useState } from 'react'
import { api } from '../services/api'
import toast from 'react-hot-toast'

// ── Interfaces ───────────────────────────────────────────────────────────────
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

// ── SVG Icons ────────────────────────────────────────────────────────────────
const IcoEdit    = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
const IcoTrash   = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
const IcoPlus    = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
const IcoSearch  = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
const IcoRefresh = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
const IcoDl      = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
const IcoUl      = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
const IcoClose   = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
const IcoBox     = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
const IcoOk      = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
const IcoWarn    = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
const IcoXCircle = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
const IcoBarcode = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <rect x="2"  y="4" width="2" height="16" rx="0.4"/>
    <rect x="6"  y="4" width="1" height="16" rx="0.4"/>
    <rect x="9"  y="4" width="3" height="16" rx="0.4"/>
    <rect x="14" y="4" width="1" height="16" rx="0.4"/>
    <rect x="17" y="4" width="2" height="16" rx="0.4"/>
    <rect x="21" y="4" width="1" height="16" rx="0.4"/>
  </svg>
)

// ── Tooltip ──────────────────────────────────────────────────────────────────
const Tip = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="relative group/tip">
    {children}
    <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 bg-[#0F0F0F] text-white text-xs px-2.5 py-1 rounded-md whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 z-20 shadow-xl border border-white/10">
      {label}
    </span>
  </div>
)

// ── Avatar ───────────────────────────────────────────────────────────────────
const AVATAR_PALETTE = [
  'bg-blue-900/60 text-blue-300', 'bg-violet-900/60 text-violet-300',
  'bg-cyan-900/60 text-cyan-300',  'bg-emerald-900/60 text-emerald-300',
  'bg-amber-900/60 text-amber-300','bg-rose-900/60 text-rose-300',
]
const avatarCls = (name: string) => AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length]

// ── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ p, pr }: { p: Product; pr: ProductPrice }) => {
  if (!p.is_active)
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-700/40 text-gray-400 border border-gray-600/30"><span className="w-1.5 h-1.5 rounded-full bg-gray-500" />Inactivo</span>
  if (pr.stock === 0)
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-900/30 text-red-400 border border-red-800/30"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />Sin Stock</span>
  if (pr.stock <= 5)
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-900/30 text-orange-400 border border-orange-800/30"><span className="w-1.5 h-1.5 rounded-full bg-orange-500" />Stock Bajo</span>
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-800/30"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />Activo</span>
}

// ── Chip ─────────────────────────────────────────────────────────────────────
const Chip = ({ active, gold, onClick, children }: { active: boolean; gold?: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`text-xs font-medium px-3.5 py-1.5 rounded-full border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] ${
      active
        ? gold !== false
          ? 'bg-[#D4AF37] text-[#0F0F0F] border-transparent font-semibold shadow-sm'
          : 'bg-[#1B2A49] text-white border-white/20'
        : 'bg-[#172A46] text-gray-400 border-white/10 hover:border-[#D4AF37]/40 hover:text-gray-200'
    }`}
  >
    {children}
  </button>
)

// ── Emoji por nombre ─────────────────────────────────────────────────────────
const getNameEmoji = (name: string): string => {
  const t = name.toLowerCase()
  if (/cerveza|beer|lager|pilsener|pils|chopp|malta/.test(t))      return '🍺'
  if (/champagne|espumante|cava|prosecco|brut/.test(t))             return '🍾'
  if (/vino|wine|merlot|cabernet|malbec|tinto|blanco|rosé/.test(t)) return '🍷'
  if (/whisky|whiskey|bourbon|scotch/.test(t))                       return '🥃'
  if (/ron|rum/.test(t))                                             return '🥃'
  if (/vodka/.test(t))                                               return '🍸'
  if (/gin|ginebra/.test(t))                                         return '🍸'
  if (/tequila|mezcal/.test(t))                                      return '🌵'
  if (/licor|liqueur|aguardiente/.test(t))                           return '🥂'
  if (/agua|water/.test(t))                                          return '💧'
  if (/jugo|juice|néctar|nectar/.test(t))                            return '🧃'
  if (/refresco|soda|cola|gaseosa|bebida/.test(t))                   return '🥤'
  if (/snack|papa|chip|galleta|maní/.test(t))                        return '🍿'
  if (/dulce|chocolate|caramelo|confite/.test(t))                    return '🍬'
  if (/café|coffee/.test(t))                                         return '☕'
  if (/leche|milk|lácteo|yogur/.test(t))                             return '🥛'
  if (/tabaco|cigarro|cigarrillo/.test(t))                           return '🚬'
  if (/abarrote|grocerie|alimento|comida/.test(t))                   return '🛒'
  return '📦'
}

// ── Emoji por categoría (producto) ───────────────────────────────────────────
const getCategoryEmoji = (p: Product): string => {
  const t = `${(p.category?.name || '')} ${(p.subcategory?.name || '')}`.toLowerCase()
  if (/cerveza|beer|lager|pilsener|pils|chopp|malta/.test(t))      return '🍺'
  if (/champagne|espumante|cava|prosecco|brut/.test(t))             return '🍾'
  if (/vino|wine|merlot|cabernet|malbec|tinto|blanco|rosé/.test(t)) return '🍷'
  if (/whisky|whiskey|bourbon|scotch/.test(t))                       return '🥃'
  if (/ron|rum/.test(t))                                             return '🥃'
  if (/vodka/.test(t))                                               return '🍸'
  if (/gin|ginebra/.test(t))                                         return '🍸'
  if (/tequila|mezcal/.test(t))                                      return '🌵'
  if (/licor|liqueur|aguardiente/.test(t))                           return '🥂'
  if (/agua|water/.test(t))                                          return '💧'
  if (/jugo|juice|néctar|nectar/.test(t))                            return '🧃'
  if (/refresco|soda|cola|gaseosa|bebida/.test(t))                   return '🥤'
  if (/snack|papa|chip|galleta|maní/.test(t))                        return '🍿'
  if (/dulce|chocolate|caramelo|confite/.test(t))                    return '🍬'
  if (/café|coffee/.test(t))                                         return '☕'
  if (/leche|milk|lácteo|yogur/.test(t))                             return '🥛'
  if (/tabaco|cigarro|cigarrillo/.test(t))                           return '🚬'
  if (/abarrote|grocerie|alimento|comida/.test(t))                   return '🛒'
  return '📦'
}

// ════════════════════════════════════════════════════════════════════════════
export function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [loading, setLoading] = useState(true)

  const [searchText, setSearchText] = useState('')
  const [filterCat, setFilterCat] = useState('__all__')
  const [filterSub, setFilterSub] = useState('__all__')
  const [filterPack, setFilterPack] = useState('__all__')
  const [searchScanMode, setSearchScanMode] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [packs, setPacks] = useState<PackPrice[]>([{ ...EMPTY_PACK, pack_name: 'Unidad', units_per_pack: '1' }])
  const [saving, setSaving] = useState(false)
  const [scanMode, setScanMode] = useState(false)
  const skuRef = useRef<HTMLInputElement>(null)

  const [stockModal, setStockModal] = useState<{ packId: number; packName: string; productName: string; current: number } | null>(null)
  const [stockQty, setStockQty] = useState('1')
  const [stockSaving, setStockSaving] = useState(false)

  const [deleteModal, setDeleteModal] = useState<{ id: number; name: string } | 'all' | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([api.get('/products').then(r => r.data), api.get('/categories').then(r => r.data)])
      .then(([prods, cats]) => { setProducts(prods); setCategories(cats); setLoading(false) })
  }

  useEffect(() => { load() }, [])

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

  const activateSearchScan = () => {
    setSearchText('')
    setSearchScanMode(true)
    setTimeout(() => searchRef.current?.focus(), 50)
  }
  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchScanMode) {
      e.preventDefault()
      setSearchScanMode(false)
    }
  }

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
      setStockModal(null); load()
    } catch { toast.error('Error al actualizar stock') } finally { setStockSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteModal) return
    if (deleteModal === 'all' && deleteConfirmText !== 'ELIMINAR') { toast.error('Escribí ELIMINAR para confirmar'); return }
    setDeleting(true)
    try {
      if (deleteModal === 'all') { await api.delete('/products'); toast.success('Todos los productos eliminados') }
      else { await api.delete(`/products/${deleteModal.id}`); toast.success(`"${deleteModal.name}" eliminado`) }
      setDeleteModal(null); setDeleteConfirmText(''); load()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'No se puede eliminar: tiene ventas registradas')
    } finally { setDeleting(false) }
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

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-400 text-sm">Cargando productos...</span>
      </div>
    </div>
  )

  // ── Derived values ────────────────────────────────────────────────────────
  const kpis = [
    { label: 'Productos',  value: products.length,                                                                               icon: <IcoBox />,     iconBg: 'bg-[#D4AF37]/15', iconCl: 'text-[#D4AF37]', desc: 'Total en catálogo'       },
    { label: 'Activos',    value: products.filter(p => p.is_active).length,                                                      icon: <IcoOk />,      iconBg: 'bg-green-900/30',  iconCl: 'text-green-400',   desc: 'Disponibles para venta' },
    { label: 'Stock Bajo', value: products.filter(p => p.prices.some(pr => pr.stock > 0 && pr.stock <= 5)).length,               icon: <IcoWarn />,    iconBg: 'bg-orange-900/30', iconCl: 'text-orange-400',  desc: '5 unidades o menos'     },
    { label: 'Sin Stock',  value: products.filter(p => p.prices.length > 0 && p.prices.every(pr => pr.stock === 0)).length,      icon: <IcoXCircle />, iconBg: 'bg-red-900/30',    iconCl: 'text-red-400',     desc: 'Requieren reposición'   },
  ]

  const maxStockVal = Math.max(...products.flatMap(p => p.prices.map(pr => pr.stock)), 1)
  const hasActiveFilters = filterCat !== '__all__' || filterSub !== '__all__' || filterPack !== '__all__' || !!searchText
  const clearFilters = () => { setSearchText(''); setFilterCat('__all__'); setFilterSub('__all__'); setFilterPack('__all__') }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-5 md:p-8 space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-100 tracking-tight">Productos</h2>
          <p className="text-sm text-gray-400 mt-1">Administrá el catálogo de productos, precios y stock.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tip label="Actualizar datos">
            <button onClick={load} aria-label="Actualizar" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-100 bg-[#172A46] hover:bg-[#1B2A49] border border-white/10 px-3 py-2 rounded-lg transition-all duration-200">
              <IcoRefresh /><span className="hidden sm:inline">Actualizar</span>
            </button>
          </Tip>
          <Tip label="Importar productos (CSV)">
            <button onClick={() => toast('Próximamente disponible')} aria-label="Importar" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-100 bg-[#172A46] hover:bg-[#1B2A49] border border-white/10 px-3 py-2 rounded-lg transition-all duration-200">
              <IcoUl /><span className="hidden sm:inline">Importar</span>
            </button>
          </Tip>
          <Tip label="Exportar a CSV">
            <button onClick={() => toast('Próximamente disponible')} aria-label="Exportar" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-100 bg-[#172A46] hover:bg-[#1B2A49] border border-white/10 px-3 py-2 rounded-lg transition-all duration-200">
              <IcoDl /><span className="hidden sm:inline">Exportar</span>
            </button>
          </Tip>
          <button onClick={openCreate} className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#B8860B] text-[#0F0F0F] text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md">
            <IcoPlus />Nuevo producto
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-[#243D66] rounded-xl p-5 border border-white/5 shadow-sm hover:border-white/10 hover:shadow-md transition-all duration-200 group">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 ${k.iconBg} rounded-lg flex items-center justify-center ${k.iconCl} transition-transform duration-200 group-hover:scale-110`}>
                {k.icon}
              </div>
            </div>
            <div className={`text-3xl font-bold ${k.iconCl} tabular-nums`}>{k.value}</div>
            <div className="text-sm font-medium text-gray-200 mt-0.5">{k.label}</div>
            <div className="text-xs text-gray-500 mt-0.5">{k.desc}</div>
          </div>
        ))}
      </div>

      {/* ── Search + Filters ── */}
      <div className="bg-[#243D66] rounded-xl border border-white/5 p-5 space-y-4">

        {/* Buscador */}
        <div className="relative w-full lg:w-[70%]">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200"
                style={{ color: searchScanMode ? '#4ade80' : '#6b7280' }}>
            <IcoSearch />
          </span>
          <input
            ref={searchRef}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            onKeyDown={handleSearchKey}
            placeholder={searchScanMode ? 'Apuntá el lector al código...' : 'Buscar por nombre, SKU o código de barras...'}
            aria-label="Buscar productos"
            className={`w-full bg-[#172A46] border rounded-lg pl-10 pr-[4.5rem] py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
              searchScanMode
                ? 'border-green-500/60 focus:ring-green-500 bg-green-900/10 text-green-300'
                : 'border-white/10 focus:ring-[#D4AF37] focus:border-transparent text-gray-100'
            }`}
          />
          {/* Botones lado derecho */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            {searchText && !searchScanMode && (
              <button onClick={() => setSearchText('')} aria-label="Limpiar búsqueda"
                className="p-1.5 text-gray-500 hover:text-gray-200 transition-colors duration-150">
                <IcoClose />
              </button>
            )}
            <Tip label={searchScanMode ? 'Click para cancelar' : 'Escanear QR / código de barras'}>
              <button
                onClick={searchScanMode ? () => setSearchScanMode(false) : activateSearchScan}
                aria-label={searchScanMode ? 'Cancelar escaneo' : 'Activar escáner de código'}
                className={`p-1.5 rounded-lg transition-all duration-200 ${
                  searchScanMode
                    ? 'text-green-400 bg-green-900/30 animate-pulse'
                    : 'text-gray-500 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10'
                }`}
              >
                <IcoBarcode />
              </button>
            </Tip>
          </div>
        </div>

        {/* Filtro Categoría */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Categoría</span>
          <div className="flex flex-wrap gap-2">
            <Chip active={filterCat === '__all__'} onClick={() => { setFilterCat('__all__'); setFilterSub('__all__') }}>
              Todas
            </Chip>
            {allCategories.map(cat => (
              <Chip key={cat.id} active={filterCat === String(cat.id)} onClick={() => { setFilterCat(String(cat.id)); setFilterSub('__all__') }}>
                {getNameEmoji(cat.name)} {cat.name}
              </Chip>
            ))}
          </div>
        </div>

        {/* Filtro Tipo */}
        {allSubcategories.length > 0 && (
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Tipo</span>
            <div className="flex flex-wrap gap-2">
              <Chip active={filterSub === '__all__'} onClick={() => setFilterSub('__all__')}>
                Todos
              </Chip>
              {allSubcategories.map(sub => (
                <Chip key={sub.id} active={filterSub === String(sub.id)} onClick={() => setFilterSub(String(sub.id))}>
                  {getNameEmoji(sub.name)} {sub.name}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {/* Filtro Empaque */}
        {allPackNames.length > 0 && (
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Empaque</span>
            <div className="flex flex-wrap gap-2">
              <Chip active={filterPack === '__all__'} onClick={() => setFilterPack('__all__')}>
                Todos
              </Chip>
              {allPackNames.map(name => (
                <Chip key={name} active={filterPack === name} onClick={() => setFilterPack(name)}>
                  {name}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {/* Resultados y limpiar */}
        {hasActiveFilters && (
          <div className="flex items-center gap-3 pt-1 border-t border-white/5">
            <span className="text-xs text-gray-400">
              <span className="font-semibold text-gray-200">{rows.length}</span> resultado{rows.length !== 1 ? 's' : ''}
            </span>
            <button onClick={clearFilters} className="text-xs text-[#D4AF37] hover:text-[#B8860B] font-medium transition-colors duration-150 flex items-center gap-1">
              <IcoClose />Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* ── Tabla ── */}
      <div className="bg-[#243D66] rounded-xl border border-white/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead className="bg-[#172A46] border-b border-[#1E3557]">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Producto</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Categoría</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Empaque</th>
                <th className="px-3 py-3.5 text-center text-xs font-semibold text-blue-400 uppercase tracking-wider">Precio A</th>
                <th className="px-3 py-3.5 text-center text-xs font-semibold text-green-400 uppercase tracking-wider">Precio B</th>
                <th className="px-3 py-3.5 text-center text-xs font-semibold text-orange-400 uppercase tracking-wider">Precio C</th>
                <th className="px-4 py-3.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Stock</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-500">
                      <IcoBox />
                      <span className="text-sm">No se encontraron productos</span>
                      {hasActiveFilters && (
                        <button onClick={clearFilters} className="text-xs text-[#D4AF37] hover:underline">Limpiar filtros</button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : rows.map(({ product: p, price: pr }) => {
                const stockPct = Math.min((pr.stock / maxStockVal) * 100, 100)
                const barColor = pr.stock === 0 ? 'bg-red-500' : pr.stock <= 5 ? 'bg-orange-500' : 'bg-green-500'
                return (
                  <tr key={`${p.id}-${pr.id}`} className="hover:bg-[#1E3557]/60 transition-colors duration-150 group">

                    {/* Producto: emoji + nombre + SKU */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold select-none ${avatarCls(p.name)}`}>
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-100 text-[15px] leading-tight truncate max-w-[200px]">{p.name}</p>
                          <p className="text-xs text-gray-500 font-mono mt-0.5 tracking-wide">{p.sku || <span className="italic text-gray-600">Sin SKU</span>}</p>
                        </div>
                      </div>
                    </td>

                    {/* Categoría */}
                    <td className="px-4 py-4">
                      {p.category ? (
                        <div className="text-sm">
                          <span className="text-gray-300">{p.category.name}</span>
                          {p.subcategory && <span className="text-gray-500 text-xs block mt-0.5">› {p.subcategory.name}</span>}
                        </div>
                      ) : (
                        <span className="text-gray-600 text-xs italic">Sin categoría</span>
                      )}
                    </td>

                    {/* Empaque */}
                    <td className="px-4 py-4">
                      <span className="text-gray-200 text-sm font-medium">{pr.pack_name}</span>
                      {pr.units_per_pack > 1 && (
                        <span className="text-gray-500 text-xs block mt-0.5">{pr.units_per_pack} un. por empaque</span>
                      )}
                    </td>

                    {/* Precios */}
                    <td className="px-3 py-4 text-center">
                      <span className="font-bold text-blue-300 text-base">{fmt(pr.price_a)}</span>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <span className="text-green-400 text-sm">{fmt(pr.price_b)}</span>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <span className="text-orange-400 text-sm">{fmt(pr.price_c)}</span>
                    </td>

                    {/* Stock + barra */}
                    <td className="px-4 py-4 text-center min-w-[90px]">
                      <span className={`font-bold text-base tabular-nums ${pr.stock === 0 ? 'text-red-400' : pr.stock <= 5 ? 'text-orange-400' : 'text-gray-100'}`}>
                        {pr.stock}
                      </span>
                      <div className="w-16 mx-auto bg-white/10 rounded-full h-1.5 mt-1.5">
                        <div className={`${barColor} h-1.5 rounded-full transition-all duration-300`} style={{ width: `${stockPct}%` }} />
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-4">
                      <StatusBadge p={p} pr={pr} />
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <Tip label="Editar producto">
                          <button
                            onClick={() => openEdit(p)}
                            aria-label="Editar producto"
                            className="p-2 rounded-lg text-gray-500 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
                          >
                            <IcoEdit />
                          </button>
                        </Tip>
                        <Tip label="Reponer stock">
                          <button
                            onClick={() => openStockModal(p, pr)}
                            aria-label="Reponer stock"
                            className="p-2 rounded-lg text-gray-500 hover:text-green-400 hover:bg-green-900/20 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                          >
                            <IcoPlus />
                          </button>
                        </Tip>
                        <Tip label="Eliminar producto">
                          <button
                            onClick={() => setDeleteModal({ id: p.id, name: p.name })}
                            aria-label="Eliminar producto"
                            className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                          >
                            <IcoTrash />
                          </button>
                        </Tip>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer de tabla */}
        {rows.length > 0 && (
          <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
            <span className="text-xs text-gray-500">{rows.length} {rows.length === 1 ? 'producto' : 'productos'} mostrados</span>
            <button onClick={() => { setDeleteModal('all'); setDeleteConfirmText('') }}
              className="text-xs text-gray-600 hover:text-red-400 transition-colors duration-200">
              Eliminar todos los productos
            </button>
          </div>
        )}
      </div>

      {/* ── Modal reponer stock ── */}
      {stockModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#243D66] rounded-2xl shadow-2xl border border-white/10 w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-green-900/30 flex items-center justify-center text-green-400">
                <IcoPlus />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-100">Reponer stock</h3>
                <p className="text-xs text-gray-400 mt-0.5">{stockModal.productName} · {stockModal.packName}</p>
              </div>
            </div>
            <div className="bg-[#172A46] rounded-lg px-4 py-3 mb-5 flex items-center justify-between">
              <span className="text-xs text-gray-400">Stock actual</span>
              <span className={`font-bold text-lg ${stockModal.current === 0 ? 'text-red-400' : 'text-gray-100'}`}>{stockModal.current}</span>
            </div>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-300 mb-2">Cantidad a agregar</label>
              <input value={stockQty} onChange={e => setStockQty(e.target.value)}
                type="number" min="1" autoFocus
                className="w-full bg-[#172A46] border border-white/10 rounded-lg px-3 py-3 text-center text-2xl font-bold text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all" />
              {parseInt(stockQty) > 0 && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Nuevo total: <span className="font-bold text-green-400">{stockModal.current + (parseInt(stockQty) || 0)}</span>
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStockModal(null)} className="flex-1 border border-white/10 text-gray-300 text-sm font-medium py-2.5 rounded-lg hover:bg-[#1E3557] transition-all duration-200">
                Cancelar
              </button>
              <button onClick={handleAddStock} disabled={stockSaving} className="flex-1 bg-[#D4AF37] hover:bg-[#B8860B] text-[#0F0F0F] text-sm font-semibold py-2.5 rounded-lg disabled:opacity-50 transition-all duration-200">
                {stockSaving ? 'Guardando...' : '+ Agregar stock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal crear / editar producto ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
          <div className="bg-[#243D66] rounded-t-2xl sm:rounded-2xl border border-white/10 shadow-2xl w-full max-w-2xl sm:mx-4 max-h-[95vh] sm:max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#243D66] border-b border-white/10 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-100">{editingId ? 'Editar producto' : 'Nuevo producto'}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{editingId ? 'Modificá los datos del producto' : 'Completá los datos del nuevo producto'}</p>
              </div>
              <button onClick={() => setShowModal(false)} aria-label="Cerrar" className="p-2 text-gray-500 hover:text-gray-200 hover:bg-white/5 rounded-lg transition-all duration-200">
                <IcoClose />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Nombre *</label>
                <input name="name" value={form.name} onChange={handleChange} required autoFocus
                  className="w-full bg-[#172A46] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] transition-all"
                  placeholder="Ej: Paceña 269" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Categoría</label>
                  <select name="category_id" value={form.category_id} onChange={handleChange}
                    className="w-full bg-[#172A46] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] transition-all">
                    <option value="">Sin categoría</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Tipo</label>
                  <select name="subcategory_id" value={form.subcategory_id} onChange={handleChange}
                    disabled={!form.category_id || subcategories.length === 0}
                    className="w-full bg-[#172A46] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] disabled:opacity-40 transition-all">
                    <option value="">Sin tipo</option>
                    {subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-300">SKU / Código de barras</label>
                  <div className="flex gap-1.5">
                    <button type="button" onClick={generateSku}
                      className="text-xs bg-purple-900/30 hover:bg-purple-900/50 text-purple-400 font-medium px-2.5 py-1 rounded-full transition-colors">
                      ✦ Generar
                    </button>
                    <button type="button" onClick={activateScan}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all duration-200 ${scanMode ? 'bg-green-900/40 text-green-400 animate-pulse' : 'bg-[#172A46] text-gray-400 hover:text-gray-200'}`}>
                      {scanMode ? '● Escaneando...' : '⊡ Escanear'}
                    </button>
                  </div>
                </div>
                <input ref={skuRef} name="sku" value={form.sku} onChange={handleChange} onKeyDown={handleSkuKey}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 transition-all ${scanMode ? 'border-green-500/50 focus:ring-green-500 bg-green-900/10 text-green-300' : 'bg-[#172A46] border-white/10 focus:ring-[#D4AF37] text-gray-100'}`}
                  placeholder={scanMode ? 'Apuntá el lector aquí...' : 'Ej: 7790001234567'} />
              </div>

              {/* Empaques */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-gray-300">Empaques, precios y stock *</p>
                    <p className="text-xs text-gray-500 mt-0.5">A = precio mayor · B = precio medio · C = precio menor</p>
                  </div>
                  <button type="button" onClick={addPack}
                    className="text-xs bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#B8860B] font-medium px-3 py-1.5 rounded-full transition-colors">
                    + Empaque
                  </button>
                </div>

                <div className="grid grid-cols-[140px_60px_1fr_1fr_1fr_70px_28px] gap-2 px-1 mb-2">
                  <span className="text-xs font-medium text-gray-500">Empaque</span>
                  <span className="text-xs font-medium text-gray-500 text-center">x Unid.</span>
                  <span className="text-xs font-semibold text-blue-400 text-center">Precio A</span>
                  <span className="text-xs font-semibold text-green-400 text-center">Precio B</span>
                  <span className="text-xs font-semibold text-orange-400 text-center">Precio C</span>
                  <span className="text-xs font-medium text-gray-500 text-center">Stock ini.</span>
                  <span />
                </div>

                <div className="space-y-2">
                  {packs.map((pack, i) => (
                    <div key={i} className="grid grid-cols-[140px_60px_1fr_1fr_1fr_70px_28px] gap-2 items-center bg-[#172A46] border border-white/5 rounded-lg p-2.5">
                      <input value={pack.pack_name} onChange={e => handlePackChange(i, 'pack_name', e.target.value)}
                        placeholder="Unidad" required
                        className="bg-[#1E3557] border border-white/10 rounded-md px-2 py-1.5 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]" />
                      <input value={pack.units_per_pack} onChange={e => handlePackChange(i, 'units_per_pack', e.target.value)}
                        type="number" min="1" required
                        className="bg-[#1E3557] border border-white/10 rounded-md px-2 py-1.5 text-sm text-gray-100 text-center focus:outline-none focus:ring-1 focus:ring-[#D4AF37]" />
                      <div className="relative">
                        <span className="absolute left-2 top-1.5 text-blue-400 text-xs font-bold">A $</span>
                        <input value={pack.price_a} onChange={e => handlePackChange(i, 'price_a', e.target.value)}
                          type="number" min="0" step="0.01" placeholder="0.00" required
                          className="w-full bg-[#1E3557] border border-blue-900/50 rounded-md pl-8 pr-1 py-1.5 text-sm text-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-right" />
                      </div>
                      <div className="relative">
                        <span className="absolute left-2 top-1.5 text-green-400 text-xs font-bold">B $</span>
                        <input value={pack.price_b} onChange={e => handlePackChange(i, 'price_b', e.target.value)}
                          type="number" min="0" step="0.01" placeholder="0.00"
                          className="w-full bg-[#1E3557] border border-green-900/50 rounded-md pl-8 pr-1 py-1.5 text-sm text-green-400 focus:outline-none focus:ring-1 focus:ring-green-500 text-right" />
                      </div>
                      <div className="relative">
                        <span className="absolute left-2 top-1.5 text-orange-400 text-xs font-bold">C $</span>
                        <input value={pack.price_c} onChange={e => handlePackChange(i, 'price_c', e.target.value)}
                          type="number" min="0" step="0.01" placeholder="0.00"
                          className="w-full bg-[#1E3557] border border-orange-900/50 rounded-md pl-8 pr-1 py-1.5 text-sm text-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-500 text-right" />
                      </div>
                      <input value={pack.stock} onChange={e => handlePackChange(i, 'stock', e.target.value)}
                        type="number" min="0" placeholder="0"
                        className="bg-[#1E3557] border border-white/10 rounded-md px-2 py-1.5 text-sm text-gray-100 text-center focus:outline-none focus:ring-1 focus:ring-[#D4AF37]" />
                      <button type="button" onClick={() => removePack(i)} disabled={packs.length === 1}
                        className="text-gray-600 hover:text-red-400 text-lg leading-none disabled:opacity-20 transition-colors duration-200">&times;</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t border-white/10">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-white/10 text-gray-300 text-sm font-medium py-2.5 rounded-lg hover:bg-[#1E3557] transition-all duration-200">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-[#D4AF37] hover:bg-[#B8860B] text-[#0F0F0F] text-sm font-semibold py-2.5 rounded-lg disabled:opacity-50 transition-all duration-200">
                  {saving ? 'Guardando...' : editingId ? 'Actualizar producto' : 'Guardar producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal eliminar ── */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#243D66] rounded-2xl border border-white/10 shadow-2xl w-full max-w-sm p-6">
            {deleteModal === 'all' ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-900/30 rounded-xl flex items-center justify-center text-red-400 text-lg">⚠</div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-100">Eliminar todos los productos</h3>
                    <p className="text-xs text-red-400 font-medium mt-0.5">Esta acción no se puede deshacer</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  Se eliminarán <span className="font-bold text-gray-200">todos los productos</span> y sus presentaciones de precio.
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Escribí <span className="font-bold text-red-400">ELIMINAR</span> para confirmar
                  </label>
                  <input value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)}
                    autoFocus className="w-full bg-[#172A46] border border-red-900/50 rounded-lg px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                    placeholder="ELIMINAR" />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-900/30 rounded-xl flex items-center justify-center text-red-400">
                    <IcoTrash />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-100">Eliminar producto</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Esta acción no se puede deshacer</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-5">
                  ¿Confirmás que querés eliminar{' '}
                  <span className="font-bold text-gray-100">"{deleteModal.name}"</span>?
                  Se eliminarán también todas sus presentaciones de precio.
                </p>
              </>
            )}

            <div className="flex gap-3">
              <button onClick={() => { setDeleteModal(null); setDeleteConfirmText('') }}
                className="flex-1 border border-white/10 text-gray-300 text-sm font-medium py-2.5 rounded-lg hover:bg-[#1E3557] transition-all duration-200">
                Cancelar
              </button>
              <button onClick={handleDelete}
                disabled={deleting || (deleteModal === 'all' && deleteConfirmText !== 'ELIMINAR')}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2.5 rounded-lg disabled:opacity-40 transition-all duration-200">
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
