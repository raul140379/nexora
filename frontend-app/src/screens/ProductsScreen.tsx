import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  Modal, ScrollView, Alert, ActivityIndicator
} from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { api } from '../services/api'
import { useAuthStore } from '../store/auth.store'
import { getNameEmoji } from '../utils/helpers'

interface PackPrice { id: number; pack_name: string; price_a: number; price_b: number | null; price_c: number | null; stock: number }
interface Category { id: number; name: string }
interface Subcategory { id: number; name: string; category_id: number }
interface Product { id: number; name: string; sku: string | null; description: string | null; prices: PackPrice[]; category: Category | null; subcategory: Subcategory | null }

interface PackForm { pack_name: string; units_per_pack: string; price_a: string; price_b: string; price_c: string; stock: string }

const EMPTY_FORM = { name: '', sku: '', description: '', category_id: '', subcategory_id: '' }
const EMPTY_PACK: PackForm = { pack_name: '', units_per_pack: '1', price_a: '', price_b: '', price_c: '', stock: '0' }
const fmt = (v: number | null) => v != null ? `$${Number(v).toFixed(2)}` : '—'

export function ProductsScreen() {
  const { user } = useAuthStore()
  const role = user?.role ?? 'vendedor'
  const canEdit = role === 'admin' || role === 'ejecutivo'

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCatId, setFilterCatId] = useState('')
  const [filterSubId, setFilterSubId] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [packs, setPacks] = useState<PackForm[]>([{ ...EMPTY_PACK, pack_name: 'Unidad' }])
  const [saving, setSaving] = useState(false)

  const [stockModal, setStockModal] = useState<{ packId: number; packName: string; productName: string; current: number } | null>(null)
  const [stockQty, setStockQty] = useState('1')
  const [stockSaving, setStockSaving] = useState(false)

  const [scannerOpen, setScannerOpen] = useState(false)
  const [cameraPermission, requestCameraPermission] = useCameraPermissions()

  const generateSku = () => {
    const cat = categories.find(c => String(c.id) === form.category_id)
    const sub = subcategories.find(s => String(s.id) === form.subcategory_id)
    const catCode = cat ? cat.name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3).padEnd(3, 'X') : 'PRD'
    const subCode = sub ? sub.name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 2).padEnd(2, 'X') : ''
    const prefix = subCode ? `${catCode}-${subCode}` : catCode
    const n = products.filter(p => p.sku?.startsWith(prefix + '-') && p.id !== editingId).length
    setForm(prev => ({ ...prev, sku: `${prefix}-${String(n + 1).padStart(3, '0')}` }))
  }

  const openScanner = async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission()
      if (!result.granted) { Alert.alert('Sin permiso', 'Necesitás permitir el acceso a la cámara'); return }
    }
    setScannerOpen(true)
  }

  const handleBarcodeScan = ({ data }: { data: string }) => {
    setScannerOpen(false)
    setForm(prev => ({ ...prev, sku: data }))
  }

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get('/products'),
      api.get('/categories'),
      api.get('/subcategories'),
    ]).then(([pr, cr, sr]) => {
      setProducts(pr.data); setCategories(cr.data); setSubcategories(sr.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filterSubs = subcategories.filter(s => !filterCatId || s.category_id === Number(filterCatId))

  const filtered = products.filter(p => {
    const q = search.toLowerCase()
    const matchText = !q || p.name.toLowerCase().includes(q) || (p.sku ?? '').toLowerCase().includes(q)
    const matchCat = !filterCatId || p.category?.id === Number(filterCatId)
    const matchSub = !filterSubId || p.subcategory?.id === Number(filterSubId)
    return matchText && matchCat && matchSub
  })

  const filteredSubs = subcategories.filter(s => !form.category_id || s.category_id === Number(form.category_id))

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setPacks([{ ...EMPTY_PACK, pack_name: 'Unidad' }])
    setShowModal(true)
  }

  const openEdit = (p: Product) => {
    setEditingId(p.id)
    setForm({
      name: p.name, sku: p.sku ?? '', description: p.description ?? '',
      category_id: p.category ? String(p.category.id) : '',
      subcategory_id: p.subcategory ? String(p.subcategory.id) : '',
    })
    setPacks(p.prices.map(pr => ({
      pack_name: pr.pack_name, units_per_pack: '1',
      price_a: String(pr.price_a), price_b: pr.price_b != null ? String(pr.price_b) : '',
      price_c: pr.price_c != null ? String(pr.price_c) : '', stock: String(pr.stock),
    })))
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { Alert.alert('Error', 'El nombre es obligatorio'); return }
    if (!packs.length || !packs[0].pack_name || !packs[0].price_a) {
      Alert.alert('Error', 'Agregá al menos un empaque con precio A'); return
    }
    setSaving(true)
    const payload = {
      name: form.name.trim(), sku: form.sku.trim() || null,
      description: form.description.trim() || null,
      category_id: form.category_id ? Number(form.category_id) : null,
      subcategory_id: form.subcategory_id ? Number(form.subcategory_id) : null,
      prices: packs.map(pk => ({
        pack_name: pk.pack_name, units_per_pack: Number(pk.units_per_pack) || 1,
        price_a: Number(pk.price_a), price_b: pk.price_b ? Number(pk.price_b) : null,
        price_c: pk.price_c ? Number(pk.price_c) : null, stock: Number(pk.stock) || 0,
      })),
    }
    try {
      if (editingId) { await api.put(`/products/${editingId}`, payload) }
      else { await api.post('/products', payload) }
      setShowModal(false); load()
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Error al guardar')
    } finally { setSaving(false) }
  }

  const handleDelete = (p: Product) => {
    Alert.alert('Eliminar producto', `¿Eliminar "${p.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          try { await api.delete(`/products/${p.id}`); load() }
          catch (err: any) { Alert.alert('Error', err.response?.data?.detail || 'No se pudo eliminar') }
        }
      }
    ])
  }

  const handleStockAdd = async () => {
    if (!stockModal) return
    const qty = parseInt(stockQty) || 0
    if (qty <= 0) { Alert.alert('Error', 'Ingresá una cantidad mayor a 0'); return }
    setStockSaving(true)
    try {
      await api.post(`/products/stock/${stockModal.packId}/add`, { quantity: qty })
      setStockModal(null); load()
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Error al agregar stock')
    } finally { setStockSaving(false) }
  }

  const updatePack = (i: number, field: keyof PackForm, val: string) => {
    setPacks(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: val } : p))
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o código..."
          placeholderTextColor="#4a6fa5"
          value={search}
          onChangeText={setSearch}
        />
        {canEdit && (
          <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
            <Text style={styles.addBtnText}>+ Agregar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filtro por categoría */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipRow}>
            <TouchableOpacity style={[styles.chip, !filterCatId && styles.chipActive]}
              onPress={() => { setFilterCatId(''); setFilterSubId('') }}>
              <Text style={[styles.chipText, !filterCatId && styles.chipTextActive]}>Todas</Text>
            </TouchableOpacity>
            {categories.map(c => (
              <TouchableOpacity key={c.id}
                style={[styles.chip, filterCatId === String(c.id) && styles.chipActive]}
                onPress={() => { setFilterCatId(String(c.id)); setFilterSubId('') }}>
                <Text style={[styles.chipText, filterCatId === String(c.id) && styles.chipTextActive]}>
                  {getNameEmoji(c.name)} {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Filtro por subcategoría */}
      {filterCatId && filterSubs.length > 0 && (
        <View style={[styles.filterBar, { paddingTop: 0 }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              <TouchableOpacity style={[styles.chip, !filterSubId && styles.chipActive]}
                onPress={() => setFilterSubId('')}>
                <Text style={[styles.chipText, !filterSubId && styles.chipTextActive]}>Todas</Text>
              </TouchableOpacity>
              {filterSubs.map(s => (
                <TouchableOpacity key={s.id}
                  style={[styles.chip, filterSubId === String(s.id) && styles.chipActive]}
                  onPress={() => setFilterSubId(String(s.id))}>
                  <Text style={[styles.chipText, filterSubId === String(s.id) && styles.chipTextActive]}>
                    {getNameEmoji(s.name)} {s.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#D4AF37" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={p => String(p.id)}
          ListEmptyComponent={<Text style={styles.empty}>Sin productos</Text>}
          contentContainerStyle={{ padding: 12, paddingBottom: 30 }}
          renderItem={({ item: p }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName}>{p.name}</Text>
                  {p.sku && <Text style={styles.sku}>{p.sku}</Text>}
                  {p.category && (
                    <Text style={styles.category}>
                      {getNameEmoji(p.category.name)} {p.category.name}
                      {p.subcategory ? ` › ${getNameEmoji(p.subcategory.name)} ${p.subcategory.name}` : ''}
                    </Text>
                  )}
                  {p.description && <Text style={styles.description}>{p.description}</Text>}
                </View>
                {canEdit && (
                  <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(p)}>
                      <Text style={styles.editBtnText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(p)}>
                      <Text style={styles.delBtnText}>×</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {p.prices.map(pr => (
                <View key={pr.id} style={styles.priceRow}>
                  <Text style={styles.packName}>{pr.pack_name}</Text>
                  <Text style={[styles.price, { color: '#60a5fa' }]}>A: {fmt(pr.price_a)}</Text>
                  {pr.price_b != null && <Text style={[styles.price, { color: '#4ade80' }]}>B: {fmt(pr.price_b)}</Text>}
                  {pr.price_c != null && <Text style={[styles.price, { color: '#fb923c' }]}>C: {fmt(pr.price_c)}</Text>}
                  <View style={styles.stockRow}>
                    <Text style={[styles.stock, { color: pr.stock === 0 ? '#ef4444' : '#94a3b8' }]}>
                      Stock: {pr.stock}
                    </Text>
                    {canEdit && (
                      <TouchableOpacity style={styles.stockBtn}
                        onPress={() => { setStockModal({ packId: pr.id, packName: pr.pack_name, productName: p.name, current: pr.stock }); setStockQty('1') }}>
                        <Text style={styles.stockBtnText}>+</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        />
      )}

      {/* Modal agregar/editar producto */}
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={styles.overlay}>
          <ScrollView contentContainerStyle={styles.modalBox} keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'Editar producto' : 'Nuevo producto'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={{ fontSize: 22, color: '#94a3b8' }}>×</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Categoría</Text>
            <View style={styles.chipWrap}>
              <TouchableOpacity style={[styles.chip, !form.category_id && styles.chipActive]}
                onPress={() => setForm(p => ({ ...p, category_id: '', subcategory_id: '' }))}>
                <Text style={[styles.chipText, !form.category_id && styles.chipTextActive]}>Ninguna</Text>
              </TouchableOpacity>
              {categories.map(c => (
                <TouchableOpacity key={c.id}
                  style={[styles.chip, form.category_id === String(c.id) && styles.chipActive]}
                  onPress={() => setForm(p => ({ ...p, category_id: String(c.id), subcategory_id: '' }))}>
                  <Text style={[styles.chipText, form.category_id === String(c.id) && styles.chipTextActive]}>
                    {getNameEmoji(c.name)} {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {form.category_id && filteredSubs.length > 0 && (
              <>
                <Text style={styles.label}>Subcategoría</Text>
                <View style={styles.chipWrap}>
                  {filteredSubs.map(s => (
                    <TouchableOpacity key={s.id}
                      style={[styles.chip, form.subcategory_id === String(s.id) && styles.chipActive]}
                      onPress={() => setForm(p => ({ ...p, subcategory_id: String(s.id) }))}>
                      <Text style={[styles.chipText, form.subcategory_id === String(s.id) && styles.chipTextActive]}>
                        {getNameEmoji(s.name)} {s.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <Text style={styles.label}>Código (SKU)</Text>
            <View style={styles.skuRow}>
              <TextInput style={[styles.input, { flex: 1 }]} value={form.sku} onChangeText={t => setForm(p => ({ ...p, sku: t }))}
                placeholder="Ej: LIC-001" placeholderTextColor="#4a6fa5" autoCapitalize="characters" />
              <TouchableOpacity style={styles.skuBtn} onPress={openScanner}>
                <Text style={styles.skuBtnText}>📷</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.skuBtn, { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' }]} onPress={generateSku}>
                <Text style={[styles.skuBtnText, { color: '#4ade80' }]}>⚙️</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Nombre *</Text>
            <TextInput style={styles.input} value={form.name} onChangeText={t => setForm(p => ({ ...p, name: t }))}
              placeholder="Nombre del producto" placeholderTextColor="#4a6fa5" />

            <Text style={styles.label}>Descripción</Text>
            <TextInput style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]}
              value={form.description} onChangeText={t => setForm(p => ({ ...p, description: t }))}
              placeholder="Descripción opcional del producto" placeholderTextColor="#4a6fa5"
              multiline numberOfLines={3} />

            <View style={styles.packHeader}>
              <Text style={styles.label}>Empaques y precios</Text>
              <TouchableOpacity onPress={() => setPacks(p => [...p, { ...EMPTY_PACK }])}>
                <Text style={{ color: '#D4AF37', fontWeight: '700', fontSize: 13 }}>+ Empaque</Text>
              </TouchableOpacity>
            </View>

            {packs.map((pk, i) => (
              <View key={i} style={styles.packBox}>
                <View style={styles.packBoxHeader}>
                  <Text style={styles.packBoxTitle}>Empaque {i + 1}</Text>
                  {packs.length > 1 && (
                    <TouchableOpacity onPress={() => setPacks(p => p.filter((_, idx) => idx !== i))}>
                      <Text style={{ color: '#ef4444', fontWeight: '700' }}>Quitar</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.subLabel}>Nombre del empaque</Text>
                <TextInput style={styles.input} value={pk.pack_name} onChangeText={t => updatePack(i, 'pack_name', t)}
                  placeholder="Ej: Unidad, Caja, Six-pack" placeholderTextColor="#4a6fa5" />
                <View style={styles.priceGrid}>
                  {[['price_a', 'Precio A *', '#60a5fa'], ['price_b', 'Precio B', '#4ade80'], ['price_c', 'Precio C', '#fb923c']].map(([field, lbl, color]) => (
                    <View key={field} style={{ flex: 1 }}>
                      <Text style={[styles.subLabel, { color }]}>{lbl}</Text>
                      <TextInput style={styles.smallInput}
                        value={pk[field as keyof PackForm]}
                        onChangeText={t => updatePack(i, field as keyof PackForm, t)}
                        placeholder="0.00" placeholderTextColor="#4a6fa5" keyboardType="decimal-pad" />
                    </View>
                  ))}
                </View>
                <Text style={styles.subLabel}>Stock inicial</Text>
                <TextInput style={styles.input} value={pk.stock} onChangeText={t => updatePack(i, 'stock', t)}
                  placeholder="0" placeholderTextColor="#4a6fa5" keyboardType="numeric" />
              </View>
            ))}

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.5 }]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#0F0F0F" /> : <Text style={styles.saveBtnText}>{editingId ? 'Actualizar' : 'Crear producto'}</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal reposición de stock */}
      <Modal visible={!!stockModal} animationType="fade" transparent onRequestClose={() => setStockModal(null)}>
        <View style={[styles.overlay, { justifyContent: 'center' }]}>
          <View style={styles.stockBox}>
            <Text style={styles.modalTitle}>Agregar stock</Text>
            <Text style={{ color: '#94a3b8', fontSize: 13, marginTop: 4, marginBottom: 16 }}>
              {stockModal?.productName} — {stockModal?.packName}{'\n'}Stock actual: {stockModal?.current}
            </Text>
            <TextInput style={styles.input} value={stockQty} onChangeText={setStockQty}
              keyboardType="numeric" autoFocus />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setStockModal(null)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, stockSaving && { opacity: 0.5 }]} onPress={handleStockAdd} disabled={stockSaving}>
                {stockSaving ? <ActivityIndicator color="#0F0F0F" /> : <Text style={styles.saveBtnText}>+ Agregar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal escáner de código de barras */}
      <Modal visible={scannerOpen} animationType="slide" onRequestClose={() => setScannerOpen(false)}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39', 'upc_a', 'upc_e'] }}
            onBarcodeScanned={handleBarcodeScan}
          />
          <View style={styles.scanOverlay}>
            <View style={styles.scanFrame} />
            <Text style={styles.scanHint}>Apuntá la cámara al código de barras o QR</Text>
            <TouchableOpacity style={styles.scanCloseBtn} onPress={() => setScannerOpen(false)}>
              <Text style={styles.scanCloseBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#1E3557' },
  topBar:        { flexDirection: 'row', padding: 12, gap: 8, alignItems: 'center' },
  filterBar:     { paddingHorizontal: 12, paddingBottom: 8 },
  description:   { fontSize: 11, color: '#64748b', marginTop: 2, fontStyle: 'italic' },
  searchInput:   { flex: 1, backgroundColor: '#172A46', borderWidth: 1, borderColor: '#2d4a6e', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#e2e8f0' },
  addBtn:        { backgroundColor: '#D4AF37', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  addBtnText:    { color: '#0F0F0F', fontWeight: '700', fontSize: 13 },
  card:          { backgroundColor: '#243D66', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2 },
  cardHeader:    { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  productName:   { fontSize: 15, fontWeight: '700', color: '#f1f5f9' },
  sku:           { fontSize: 11, color: '#64748b', marginTop: 2 },
  category:      { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  cardActions:   { flexDirection: 'row', gap: 6 },
  editBtn:       { backgroundColor: 'rgba(212,175,55,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)' },
  editBtnText:   { fontSize: 12, color: '#D4AF37', fontWeight: '600' },
  delBtn:        { backgroundColor: 'rgba(239,68,68,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  delBtnText:    { fontSize: 16, color: '#ef4444', fontWeight: '700' },
  priceRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', flexWrap: 'wrap' },
  packName:      { fontSize: 12, fontWeight: '600', color: '#cbd5e1', width: 75 },
  price:         { fontSize: 12, fontWeight: '600' },
  stockRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 'auto' },
  stock:         { fontSize: 12 },
  stockBtn:      { backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: 5, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)' },
  stockBtnText:  { color: '#4ade80', fontWeight: '800', fontSize: 14 },
  empty:         { textAlign: 'center', color: '#64748b', marginTop: 40 },
  chipRow:       { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  chipWrap:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 4, marginBottom: 4 },
  chip:          { borderWidth: 1, borderColor: '#2d4a6e', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#172A46' },
  chipActive:    { backgroundColor: '#D4AF37', borderColor: '#D4AF37' },
  chipText:      { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
  chipTextActive:{ color: '#0F0F0F' },
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalBox:      { backgroundColor: '#1E3557', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  stockBox:      { backgroundColor: '#243D66', borderRadius: 16, margin: 24, padding: 20 },
  modalHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle:    { fontSize: 17, fontWeight: '700', color: '#f1f5f9' },
  label:         { fontSize: 13, fontWeight: '600', color: '#D4AF37', marginBottom: 6, marginTop: 12 },
  subLabel:      { fontSize: 12, fontWeight: '600', color: '#94a3b8', marginBottom: 4, marginTop: 8 },
  input:         { backgroundColor: '#172A46', borderWidth: 1, borderColor: '#2d4a6e', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#e2e8f0' },
  smallInput:    { backgroundColor: '#172A46', borderWidth: 1, borderColor: '#2d4a6e', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 8, fontSize: 13, color: '#e2e8f0', textAlign: 'center' },
  packHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  packBox:       { borderWidth: 1, borderColor: '#2d4a6e', borderRadius: 10, padding: 12, marginTop: 8, backgroundColor: '#172A46' },
  packBoxHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  packBoxTitle:  { fontSize: 13, fontWeight: '700', color: '#cbd5e1' },
  priceGrid:     { flexDirection: 'row', gap: 8, marginTop: 4 },
  modalBtns:     { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn:     { flex: 1, borderWidth: 1, borderColor: '#2d4a6e', borderRadius: 10, padding: 13, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#94a3b8' },
  saveBtn:       { flex: 1, backgroundColor: '#D4AF37', borderRadius: 10, padding: 13, alignItems: 'center' },
  saveBtnText:   { color: '#0F0F0F', fontSize: 14, fontWeight: '700' },
  skuRow:        { flexDirection: 'row', gap: 8, alignItems: 'center' },
  skuBtn:        { backgroundColor: 'rgba(212,175,55,0.1)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)', borderRadius: 10, padding: 10, alignItems: 'center', justifyContent: 'center' },
  skuBtnText:    { fontSize: 18, color: '#D4AF37' },
  scanOverlay:   { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  scanFrame:     { width: 260, height: 160, borderWidth: 3, borderColor: '#D4AF37', borderRadius: 12, marginBottom: 24 },
  scanHint:      { color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 32, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  scanCloseBtn:  { backgroundColor: '#D4AF37', borderRadius: 10, paddingHorizontal: 32, paddingVertical: 12 },
  scanCloseBtnText: { color: '#0F0F0F', fontWeight: '700', fontSize: 15 },
})
