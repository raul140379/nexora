import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { api } from '../services/api'

interface PackPrice { id: number; pack_name: string; price_a: number; price_b: number | null; price_c: number | null; stock: number }
interface Product { id: number; name: string; sku: string | null; prices: PackPrice[] }
interface SaleItem { product_id: number; pack_price_id: number; product_name: string; pack_name: string; price_label: string; quantity: number; unit_price: number; price_tier_name: string; subtotal: number }

type Tier = 'a' | 'b' | 'c'
const TIER_LABELS: Record<Tier, string> = { a: 'Precio A', b: 'Precio B', c: 'Precio C' }
const TIER_COLORS: Record<Tier, string> = { a: '#2563eb', b: '#16a34a', c: '#ea580c' }

export function SalesScreen() {
  const [products, setProducts] = useState<Product[]>([])
  const [items, setItems] = useState<SaleItem[]>([])
  const [discount, setDiscount] = useState('0')
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [selProduct, setSelProduct] = useState<Product | null>(null)
  const [selPack, setSelPack] = useState<PackPrice | null>(null)
  const [selTier, setSelTier] = useState<Tier>('a')
  const [qty, setQty] = useState('1')
  const [showResults, setShowResults] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [cameraPermission, requestCameraPermission] = useCameraPermissions()

  useEffect(() => { api.get('/products').then(r => setProducts(r.data)) }, [])
  useEffect(() => {
    if (selProduct?.prices.length) setSelPack(selProduct.prices[0])
    else setSelPack(null)
    setSelTier('a'); setQty('1')
  }, [selProduct])

  const openScanner = async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission()
      if (!result.granted) { Alert.alert('Sin permiso', 'Necesitás permitir el acceso a la cámara'); return }
    }
    setScannerOpen(true)
  }

  const handleBarcodeScan = ({ data }: { data: string }) => {
    setScannerOpen(false)
    const exact = products.find(p => p.sku === data)
    if (exact) {
      setSelProduct(exact); setSearch(exact.name); setShowResults(false)
    } else {
      setSearch(data); setShowResults(true)
    }
  }

  const filtered = search.trim().length >= 1
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku ?? '').includes(search)).slice(0, 6)
    : []

  const getPrice = (pack: PackPrice, tier: Tier) => tier === 'a' ? pack.price_a : tier === 'b' ? pack.price_b : pack.price_c
  const currentPrice = selPack ? getPrice(selPack, selTier) : null
  const subtotal = items.reduce((s, i) => s + i.subtotal, 0)
  const discountAmt = subtotal * (parseFloat(discount) || 0) / 100
  const total = subtotal - discountAmt

  const addItem = () => {
    if (!selProduct || !selPack || currentPrice == null) return
    const q = parseInt(qty) || 1
    if (q > selPack.stock) { Alert.alert('Sin stock', `Solo hay ${selPack.stock} disponibles`); return }
    const tierName = `${selPack.pack_name} — ${TIER_LABELS[selTier]}`
    const existing = items.findIndex(i => i.pack_price_id === selPack.id && i.price_tier_name === tierName)
    if (existing >= 0) {
      setItems(prev => prev.map((it, i) => i === existing ? { ...it, quantity: it.quantity + q, subtotal: (it.quantity + q) * it.unit_price } : it))
    } else {
      setItems(prev => [...prev, { product_id: selProduct.id, pack_price_id: selPack.id, product_name: selProduct.name, pack_name: selPack.pack_name, price_label: TIER_LABELS[selTier], quantity: q, unit_price: Number(currentPrice), price_tier_name: tierName, subtotal: q * Number(currentPrice) }])
    }
    setSelProduct(null); setSearch(''); setQty('1'); setShowResults(false)
  }

  const handleSave = async () => {
    if (!items.length) { Alert.alert('Error', 'Agregá al menos un producto'); return }
    setSaving(true)
    try {
      await api.post('/sales', {
        discount_pct: parseFloat(discount) || 0,
        items: items.map(i => ({ product_id: i.product_id, pack_price_id: i.pack_price_id, quantity: i.quantity, unit_price: i.unit_price, price_tier_name: i.price_tier_name })),
      })
      Alert.alert('✓ Venta registrada', `Total cobrado: $${total.toFixed(2)}`)
      setItems([]); setDiscount('0')
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Error al registrar')
    } finally { setSaving(false) }
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">

      {/* Buscar producto */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Agregar producto</Text>
        <View style={styles.searchRow}>
          <TextInput style={[styles.searchInput, { flex: 1 }]} placeholder="Buscar por nombre o código..."
            placeholderTextColor="#9ca3af" value={search}
            onChangeText={t => { setSearch(t); setShowResults(true); if (!t) setSelProduct(null) }} />
          <TouchableOpacity style={styles.scanBtn} onPress={openScanner}>
            <Text style={styles.scanBtnText}>📷</Text>
          </TouchableOpacity>
        </View>

        {showResults && filtered.length > 0 && (
          <View style={styles.results}>
            {filtered.map(p => (
              <TouchableOpacity key={p.id} style={styles.resultItem}
                onPress={() => { setSelProduct(p); setSearch(p.name); setShowResults(false) }}>
                <Text style={styles.resultName}>{p.name}</Text>
                {p.sku && <Text style={styles.resultSku}>{p.sku}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {selProduct && selPack && (
          <View style={{ marginTop: 12 }}>
            {/* Empaques */}
            <Text style={styles.label}>Empaque</Text>
            <View style={styles.chipWrap}>
              {selProduct.prices.map(pr => (
                <TouchableOpacity key={pr.id}
                  style={[styles.chip, selPack.id === pr.id && styles.chipActive]}
                  onPress={() => setSelPack(pr)}>
                  <Text style={[styles.chipText, selPack.id === pr.id && { color: '#fff' }]}>{pr.pack_name}</Text>
                  <Text style={[styles.chipStock, selPack.id === pr.id && { color: '#bfdbfe' }, pr.stock === 0 && { color: '#fca5a5' }]}>
                    Stock: {pr.stock}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {selPack.stock === 0 && (
              <View style={styles.alertRed}><Text style={{ color: '#dc2626', fontWeight: '600' }}>⛔ Sin stock para {selPack.pack_name}</Text></View>
            )}

            {/* Precios A/B/C */}
            <Text style={styles.label}>Precio</Text>
            <View style={styles.tierRow}>
              {(['a', 'b', 'c'] as Tier[]).map(t => {
                const pr = getPrice(selPack, t)
                if (pr == null) return null
                return (
                  <TouchableOpacity key={t} style={[styles.tierBtn, selTier === t && { backgroundColor: TIER_COLORS[t], borderColor: TIER_COLORS[t] }]}
                    onPress={() => setSelTier(t)}>
                    <Text style={[styles.tierLabel, selTier === t && { color: '#fff' }]}>{TIER_LABELS[t]}</Text>
                    <Text style={[styles.tierPrice, { color: selTier === t ? '#fff' : TIER_COLORS[t] }]}>${Number(pr).toFixed(2)}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            {/* Cantidad + Agregar */}
            <View style={styles.addRow}>
              <TextInput style={styles.qtyInput} value={qty} onChangeText={setQty} keyboardType="numeric" placeholder="1" />
              <TouchableOpacity style={[styles.addBtn, selPack.stock === 0 && { opacity: 0.4 }]}
                onPress={addItem} disabled={selPack.stock === 0}>
                <Text style={styles.addBtnText}>+ Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Lista de ítems */}
      {items.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ítems ({items.length})</Text>
          {items.map((it, i) => (
            <View key={i} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{it.product_name}</Text>
                <Text style={styles.itemDetail}>{it.pack_name} · {it.price_label}</Text>
              </View>
              <Text style={styles.itemQty}>{it.quantity}×</Text>
              <Text style={styles.itemTotal}>${it.subtotal.toFixed(2)}</Text>
              <TouchableOpacity onPress={() => setItems(p => p.filter((_, idx) => idx !== i))}>
                <Text style={{ color: '#ef4444', fontSize: 20, paddingLeft: 10 }}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Descuento y total */}
      <View style={styles.section}>
        <View style={styles.discountRow}>
          <Text style={styles.label}>Descuento %</Text>
          <TextInput style={styles.discountInput} value={discount} onChangeText={setDiscount} keyboardType="numeric" />
          {parseFloat(discount) > 0 && <Text style={{ color: '#ea580c' }}>−${discountAmt.toFixed(2)}</Text>}
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity style={[styles.saveBtn, (!items.length || saving) && { opacity: 0.5 }]}
          onPress={handleSave} disabled={!items.length || saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Confirmar venta · ${total.toFixed(2)}</Text>}
        </TouchableOpacity>
      </View>
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
            <Text style={styles.scanHint}>Apuntá la cámara al código del producto</Text>
            <TouchableOpacity style={styles.scanCloseBtn} onPress={() => setScannerOpen(false)}>
              <Text style={styles.scanCloseBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  section: { backgroundColor: '#fff', margin: 12, borderRadius: 14, padding: 14, elevation: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 10 },
  searchRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 4 },
  searchInput: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827' },
  scanBtn: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 10, padding: 10, alignItems: 'center', justifyContent: 'center' },
  scanBtnText: { fontSize: 20 },
  scanOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  scanFrame: { width: 260, height: 160, borderWidth: 3, borderColor: '#fff', borderRadius: 12, marginBottom: 24 },
  scanHint: { color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 32, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  scanCloseBtn: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 32, paddingVertical: 12 },
  scanCloseBtnText: { color: '#111827', fontWeight: '700', fontSize: 15 },
  results: { marginTop: 4, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, overflow: 'hidden' },
  resultItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  resultSku: { fontSize: 11, color: '#6b7280' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 10 },
  chip: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, alignItems: 'center' },
  chipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  chipStock: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  alertRed: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fca5a5', borderRadius: 8, padding: 10, marginBottom: 6 },
  tierRow: { flexDirection: 'row', gap: 8 },
  tierBtn: { flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 10, alignItems: 'center' },
  tierLabel: { fontSize: 11, fontWeight: '600', color: '#374151' },
  tierPrice: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  addRow: { flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' },
  qtyInput: { width: 64, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, textAlign: 'center', fontSize: 16, fontWeight: '700' },
  addBtn: { flex: 1, backgroundColor: '#2563eb', borderRadius: 8, padding: 12, alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: '700' },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  itemName: { fontSize: 13, fontWeight: '600', color: '#111827' },
  itemDetail: { fontSize: 11, color: '#6b7280' },
  itemQty: { fontSize: 14, color: '#374151', marginHorizontal: 8 },
  itemTotal: { fontSize: 14, fontWeight: '700', color: '#111827' },
  discountRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  discountInput: { width: 70, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 8, textAlign: 'center', fontSize: 15 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  totalLabel: { fontSize: 18, fontWeight: '700', color: '#111827' },
  totalValue: { fontSize: 28, fontWeight: '800', color: '#2563eb' },
  saveBtn: { backgroundColor: '#2563eb', borderRadius: 12, padding: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
})
