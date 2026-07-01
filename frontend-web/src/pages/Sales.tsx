import { useEffect, useRef, useState } from 'react'
import { api } from '../services/api'
import toast from 'react-hot-toast'

interface PackPrice { id: number; pack_name: string; units_per_pack: number; price_a: number; price_b: number | null; price_c: number | null; stock: number }
interface Product { id: number; name: string; sku: string | null; price: number; stock: number; prices: PackPrice[] }
interface Customer { id: number; name: string }
interface SaleItem { product_id: number; pack_price_id: number; product_name: string; pack_name: string; price_label: string; quantity: number; unit_price: number; price_tier_name: string; subtotal: number }
interface Sale {
  id: number; total: number; discount_pct: number; status: string; customer_id: number | null
  items: { id: number; quantity: number; unit_price: number; price_tier_name: string; subtotal: number }[]
  created_at: string
}

const statusLabel: Record<string, string> = { completed: 'Completada', pending: 'Pendiente', cancelled: 'Cancelada' }
const statusColor: Record<string, string> = { completed: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700', cancelled: 'bg-red-100 text-red-700' }

export function Sales() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [items, setItems] = useState<SaleItem[]>([])
  const [customerId, setCustomerId] = useState('')
  const [notes, setNotes] = useState('')
  const [discount, setDiscount] = useState('0')
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)

  // selección de ítem
  const [selProductId, setSelProductId] = useState('')
  const [selPackId, setSelPackId] = useState('')
  const [selTier, setSelTier] = useState<'a' | 'b' | 'c'>('a')
  const [selQty, setSelQty] = useState('1')

  // escáner en venta
  const [scanMode, setScanMode] = useState(false)
  const [scanCode, setScanCode] = useState('')
  const scanRef = useRef<HTMLInputElement>(null)

  const load = () => { setLoading(true); api.get('/sales').then(r => { setSales(r.data); setLoading(false) }) }
  useEffect(() => { load() }, [])

  const openModal = () => {
    Promise.all([api.get('/products').then(r => r.data), api.get('/customers').then(r => r.data)])
      .then(([prods, custs]) => { setProducts(prods); setCustomers(custs) })
    setItems([]); setCustomerId(''); setNotes(''); setDiscount('0')
    setSelProductId(''); setSelPackId(''); setSelTier('a'); setSelQty('1')
    setScanCode(''); setScanMode(false)
    setShowModal(true)
  }

  const selectedProduct = products.find(p => p.id === parseInt(selProductId))
  const selectedPack = selectedProduct?.prices.find(pr => pr.id === parseInt(selPackId))

  // Al cambiar producto, preseleccionar primer empaque
  useEffect(() => {
    if (selectedProduct?.prices.length) setSelPackId(String(selectedProduct.prices[0].id))
    else setSelPackId('')
    setSelTier('a'); setSelQty('1')
  }, [selProductId])

  const getPriceForTier = (pack: PackPrice, tier: 'a' | 'b' | 'c') => {
    if (tier === 'a') return pack.price_a
    if (tier === 'b') return pack.price_b
    return pack.price_c
  }

  const tierLabel = (tier: 'a' | 'b' | 'c') => tier === 'a' ? 'Precio A' : tier === 'b' ? 'Precio B' : 'Precio C'

  const activateScan = () => { setScanMode(true); setTimeout(() => scanRef.current?.focus(), 50) }

  const handleScanKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const code = scanCode.trim()
      if (!code) return
      const found = products.find(p => p.sku === code)
      if (found) {
        setSelProductId(String(found.id))
        toast.success(`Producto encontrado: ${found.name}`)
      } else {
        toast.error(`No se encontró producto con código: ${code}`)
      }
      setScanCode(''); setScanMode(false)
    }
  }

  const currentPrice = selectedPack ? getPriceForTier(selectedPack, selTier) : null

  const addItem = () => {
    if (!selectedProduct || !selectedPack) return
    const price = currentPrice
    if (price == null) { toast.error(`El ${tierLabel(selTier)} no está definido para este empaque`); return }
    const qty = parseInt(selQty) || 1
    const tierName = `${selectedPack.pack_name} — ${tierLabel(selTier)}`
    if (qty > selectedPack.stock) { toast.error(`Stock insuficiente: disponible ${selectedPack.stock} en ${selectedPack.pack_name}`); return }
    const existing = items.findIndex(it => it.pack_price_id === selectedPack.id && it.price_tier_name === tierName)
    if (existing >= 0) {
      setItems(prev => prev.map((it, i) => i === existing ? { ...it, quantity: it.quantity + qty, subtotal: (it.quantity + qty) * it.unit_price } : it))
    } else {
      setItems(prev => [...prev, { product_id: selectedProduct.id, pack_price_id: selectedPack.id, product_name: selectedProduct.name, pack_name: selectedPack.pack_name, price_label: tierLabel(selTier), quantity: qty, unit_price: price, price_tier_name: tierName, subtotal: qty * price }])
    }
    setSelProductId(''); setSelQty('1'); setScanCode('')
  }

  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i))

  const subtotalItems = items.reduce((s, it) => s + it.subtotal, 0)
  const discountAmt = subtotalItems * (parseFloat(discount) || 0) / 100
  const total = subtotalItems - discountAmt

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!items.length) { toast.error('Agregá al menos un producto'); return }
    setSaving(true)
    try {
      await api.post('/sales', {
        customer_id: customerId ? parseInt(customerId) : null,
        notes: notes || null,
        discount_pct: parseFloat(discount) || 0,
        items: items.map(it => ({ product_id: it.product_id, pack_price_id: it.pack_price_id, quantity: it.quantity, unit_price: it.unit_price, price_tier_name: it.price_tier_name })),
      })
      toast.success('Venta registrada')
      setShowModal(false); load()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error al registrar venta')
    } finally { setSaving(false) }
  }

  if (loading) return <div className="p-8 text-gray-500">Cargando...</div>

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Ventas</h2>
        <button onClick={openModal} className="bg-[#D4AF37] hover:bg-[#B8860B] text-[#0F0F0F] text-sm font-semibold px-4 py-2 rounded-lg">
          + Nueva venta
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['#', 'Fecha', 'Cliente', 'Items', 'Subtotal', 'Desc.', 'Total', 'Estado'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sales.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Sin ventas registradas</td></tr>
            ) : sales.map(s => {
              const sub = s.items.reduce((acc, it) => acc + it.unit_price * it.quantity, 0)
              return <>
                <tr key={s.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">#{s.id}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(s.created_at).toLocaleDateString('es-AR')}</td>
                  <td className="px-4 py-3 text-gray-500">{s.customer_id ? `#${s.customer_id}` : 'Consumidor'}</td>
                  <td className="px-4 py-3 text-gray-500">{s.items.length}</td>
                  <td className="px-4 py-3 text-gray-500">${sub.toFixed(2)}</td>
                  <td className="px-4 py-3">{Number(s.discount_pct) > 0 ? <span className="bg-orange-100 text-orange-700 text-xs font-medium px-2 py-0.5 rounded-full">{Number(s.discount_pct)}%</span> : <span className="text-gray-300 text-xs">—</span>}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">${Number(s.total).toFixed(2)}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[s.status] || 'bg-gray-100'}`}>{statusLabel[s.status] || s.status}</span></td>
                </tr>
                {expanded === s.id && (
                  <tr key={`${s.id}-d`} className="bg-gray-50">
                    <td colSpan={8} className="px-6 py-3">
                      <div className="flex flex-wrap gap-2">
                        {s.items.map(it => (
                          <div key={it.id} className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs">
                            <span className="font-medium text-gray-700">{it.price_tier_name}</span>
                            <span className="text-gray-400 mx-1">·</span>
                            <span>{it.quantity} × ${Number(it.unit_price).toFixed(2)}</span>
                            <span className="text-gray-400 mx-1">=</span>
                            <span className="font-bold text-blue-600">${Number(it.subtotal).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            })}
          </tbody>
        </table>
      </div>

      {/* Modal nueva venta */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h3 className="text-lg font-semibold text-gray-900">Nueva venta</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                <select value={customerId} onChange={e => setCustomerId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]">
                  <option value="">Consumidor final</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Panel agregar producto con escáner */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">Agregar producto</p>
                  <button type="button" onClick={activateScan}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${scanMode ? 'bg-green-100 text-green-700 animate-pulse' : 'bg-gray-200 text-gray-600 hover:bg-blue-100 hover:text-blue-600'}`}>
                    {scanMode ? '● Escaneando...' : '⊡ Escanear código'}
                  </button>
                </div>

                {/* Campo escáner */}
                {scanMode && (
                  <div className="relative">
                    <input ref={scanRef} value={scanCode} onChange={e => setScanCode(e.target.value)} onKeyDown={handleScanKey}
                      className="w-full border-2 border-green-400 rounded-lg px-3 py-2 text-sm font-mono bg-green-50 focus:outline-none"
                      placeholder="Apuntá el lector de barras/QR y presioná Enter..." />
                    <p className="text-xs text-green-600 mt-1">El lector físico USB/Bluetooth tipea el código y presiona Enter automáticamente.</p>
                  </div>
                )}

                {/* Selector de producto */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Producto</label>
                  <select value={selProductId} onChange={e => setSelProductId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]">
                    <option value="">— Seleccioná o usá el escáner —</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}{p.sku ? ` [${p.sku}]` : ''}</option>)}
                  </select>
                </div>

                {selectedProduct && (
                  <>
                    {/* Aviso de stock al seleccionar empaque */}
                    {selectedPack && (
                      <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${selectedPack.stock === 0 ? 'bg-red-50 border border-red-200' : selectedPack.stock <= 5 ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'}`}>
                        <span className={`text-lg ${selectedPack.stock === 0 ? 'text-red-500' : selectedPack.stock <= 5 ? 'text-orange-500' : 'text-green-600'}`}>
                          {selectedPack.stock === 0 ? '⛔' : selectedPack.stock <= 5 ? '⚠️' : '✓'}
                        </span>
                        <span className={`font-medium ${selectedPack.stock === 0 ? 'text-red-700' : selectedPack.stock <= 5 ? 'text-orange-700' : 'text-green-700'}`}>
                          {selectedPack.stock === 0
                            ? `Sin stock disponible para "${selectedPack.pack_name}"`
                            : selectedPack.stock <= 5
                              ? `Stock bajo: ${selectedPack.stock} disponibles en ${selectedPack.pack_name}`
                              : `Stock disponible: ${selectedPack.stock} en ${selectedPack.pack_name}`}
                        </span>
                      </div>
                    )}

                    {/* Empaque + Precio A/B/C + Cantidad en una fila */}
                    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-end">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Empaque</label>
                        <select value={selPackId} onChange={e => setSelPackId(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]">
                          {selectedProduct.prices.map(pr => (
                            <option key={pr.id} value={pr.id}>
                              {pr.pack_name} ({pr.units_per_pack} un.) — stock: {pr.stock}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Precio</label>
                        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                          {(['a', 'b', 'c'] as const).map(t => {
                            const pr = selectedPack ? getPriceForTier(selectedPack, t) : null
                            return (
                              <button key={t} type="button" disabled={pr == null}
                                onClick={() => setSelTier(t)}
                                className={`px-3 py-2 text-xs font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${selTier === t ? (t === 'a' ? 'bg-[#D4AF37] text-[#0F0F0F]' : t === 'b' ? 'bg-green-600 text-white' : 'bg-orange-500 text-white') : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                                {t.toUpperCase()}{pr != null && <span className="block text-[10px] font-normal opacity-80">${Number(pr).toFixed(0)}</span>}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Cant.</label>
                        <input value={selQty} onChange={e => setSelQty(e.target.value)} type="number" min="1"
                          className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#D4AF37]" />
                      </div>
                      <button type="button" onClick={addItem}
                        disabled={!selectedProduct || !selectedPack || selectedPack.stock === 0}
                        className="bg-[#D4AF37] hover:bg-[#B8860B] text-[#0F0F0F] text-sm font-semibold px-4 py-2 rounded-lg whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed">
                        + Agregar
                      </button>
                    </div>

                    {/* Preview del precio seleccionado */}
                    {selectedPack && currentPrice != null && (
                      <div className="text-xs text-gray-500 bg-white rounded-lg px-3 py-2 border border-gray-200">
                        <span className="font-medium text-gray-700">{selectedProduct.name}</span>
                        {' '} · {selectedPack.pack_name} · <span className={`font-bold ${selTier === 'a' ? 'text-blue-600' : selTier === 'b' ? 'text-green-600' : 'text-orange-500'}`}>{tierLabel(selTier)}: ${Number(currentPrice).toFixed(2)}</span>
                        {' '} × {selQty} = <span className="font-bold text-gray-900">${(Number(currentPrice) * (parseInt(selQty) || 1)).toFixed(2)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Tabla de ítems */}
              {items.length > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Producto', 'Empaque', 'Precio', 'Cant.', 'P. Unit.', 'Subtotal', ''].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {items.map((it, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium text-gray-900">{it.product_name}</td>
                          <td className="px-3 py-2 text-gray-500 text-xs">{it.pack_name}</td>
                          <td className="px-3 py-2"><span className={`text-xs font-bold px-1.5 py-0.5 rounded ${it.price_label === 'Precio A' ? 'bg-blue-100 text-blue-700' : it.price_label === 'Precio B' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600'}`}>{it.price_label}</span></td>
                          <td className="px-3 py-2 text-center">{it.quantity}</td>
                          <td className="px-3 py-2">${Number(it.unit_price).toFixed(2)}</td>
                          <td className="px-3 py-2 font-semibold text-gray-900">${it.subtotal.toFixed(2)}</td>
                          <td className="px-3 py-2"><button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600">&times;</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Descuento + Total */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700 w-32">Descuento %</label>
                  <div className="relative w-28">
                    <input value={discount} onChange={e => setDiscount(e.target.value)}
                      type="number" min="0" max="100" step="0.5"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm pr-7 focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    <span className="absolute right-2.5 top-2 text-gray-400 text-sm">%</span>
                  </div>
                  {parseFloat(discount) > 0 && <span className="text-sm text-orange-600 font-medium">− ${discountAmt.toFixed(2)}</span>}
                </div>
                <div className="flex justify-between text-sm text-gray-500 border-t border-gray-200 pt-2">
                  <span>Subtotal</span><span>${subtotalItems.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-gray-900">Total a cobrar</span>
                  <span className="text-2xl font-bold text-[#D4AF37]">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] resize-none"
                  placeholder="Observaciones opcionales..." />
              </div>

              <div className="flex gap-3 border-t border-gray-100 pt-4">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={saving || !items.length}
                  className="flex-1 bg-[#D4AF37] hover:bg-[#B8860B] text-[#0F0F0F] text-sm font-semibold py-2.5 rounded-lg disabled:opacity-50">
                  {saving ? 'Guardando...' : `Confirmar venta — $${total.toFixed(2)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
