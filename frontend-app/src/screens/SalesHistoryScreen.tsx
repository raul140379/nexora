import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { api } from '../services/api'

interface SaleItem {
  id: number; product_id: number; quantity: number;
  unit_price: number; price_tier_name: string; subtotal: number
}

interface Sale {
  id: number; customer_id: number | null; user_id: number;
  total: number; discount_pct: number; status: 'pending' | 'completed' | 'cancelled';
  notes: string | null; items: SaleItem[]; created_at: string
}

interface Product { id: number; name: string }

const STATUS_LABEL = { pending: 'Pendiente', completed: 'Completada', cancelled: 'Cancelada' }
const STATUS_COLOR = {
  pending:   { bg: 'rgba(251,191,36,0.15)',  text: '#fbbf24' },
  completed: { bg: 'rgba(74,222,128,0.15)',  text: '#4ade80' },
  cancelled: { bg: 'rgba(248,113,113,0.15)', text: '#f87171' },
}

const fmt = (v: number) => `$${Number(v).toFixed(2)}`
const fmtDate = (s: string) => {
  const d = new Date(s)
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

export function SalesHistoryScreen() {
  const [sales, setSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true)
    try {
      const [sr, pr] = await Promise.all([api.get('/sales'), api.get('/products')])
      setSales(sr.data); setProducts(pr.data)
    } catch {}
    setLoading(false); setRefreshing(false)
  }

  useFocusEffect(useCallback(() => { load() }, []))

  const getProductName = (productId: number) =>
    products.find(p => p.id === productId)?.name ?? `Producto #${productId}`

  const changeStatus = (sale: Sale, newStatus: 'completed' | 'cancelled') => {
    const label = newStatus === 'completed' ? 'completar' : 'cancelar'
    Alert.alert(
      `¿${newStatus === 'completed' ? 'Completar' : 'Cancelar'} venta?`,
      `¿Confirmás ${label} la Venta #${sale.id}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí', onPress: async () => {
            setUpdatingId(sale.id)
            try {
              await api.patch(`/sales/${sale.id}`, { status: newStatus })
              setSales(prev => prev.map(s =>
                s.id === sale.id ? { ...s, status: newStatus } : s
              ))
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.detail || 'No se pudo actualizar')
            } finally {
              setUpdatingId(null)
            }
          }
        }
      ]
    )
  }

  const totalItems = sales.reduce((s, v) => s + v.items.length, 0)
  const totalRevenue = sales.filter(s => s.status === 'completed').reduce((s, v) => s + Number(v.total), 0)

  return (
    <View style={styles.container}>
      {/* Resumen */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{sales.length}</Text>
          <Text style={styles.summaryLabel}>Ventas</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totalItems}</Text>
          <Text style={styles.summaryLabel}>Ítems vendidos</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#4ade80', fontSize: 16 }]}>{fmt(totalRevenue)}</Text>
          <Text style={styles.summaryLabel}>Total cobrado</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#D4AF37" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={sales}
          keyExtractor={s => String(s.id)}
          ListEmptyComponent={<Text style={styles.empty}>Sin ventas registradas</Text>}
          contentContainerStyle={{ padding: 12, paddingBottom: 30 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={['#D4AF37']} tintColor="#D4AF37" />}
          renderItem={({ item: s }) => {
            const sc = STATUS_COLOR[s.status]
            const isExpanded = expandedId === s.id
            return (
              <View style={styles.card}>
                <TouchableOpacity onPress={() => setExpandedId(isExpanded ? null : s.id)} activeOpacity={0.7}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.saleId}>Venta #{s.id}</Text>
                      <Text style={styles.saleDate}>{fmtDate(s.created_at)}</Text>
                      <Text style={styles.itemCount}>{s.items.length} ítem{s.items.length !== 1 ? 's' : ''}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 5 }}>
                      <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                        <Text style={[styles.statusText, { color: sc.text }]}>{STATUS_LABEL[s.status]}</Text>
                      </View>
                      <Text style={styles.totalAmt}>{fmt(s.total)}</Text>
                      {Number(s.discount_pct) > 0 && (
                        <Text style={styles.discountBadge}>−{Number(s.discount_pct)}% desc.</Text>
                      )}
                    </View>
                  </View>
                  <Text style={styles.expandHint}>{isExpanded ? '▲ Ocultar' : '▼ Ver detalle'}</Text>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.detail}>
                    {s.items.map(it => (
                      <View key={it.id} style={styles.itemRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemName}>{getProductName(it.product_id)}</Text>
                          <Text style={styles.itemMeta}>{it.price_tier_name}</Text>
                        </View>
                        <Text style={styles.itemQty}>{it.quantity}×</Text>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.itemSubtotal}>{fmt(it.subtotal)}</Text>
                          <Text style={styles.itemUnit}>{fmt(it.unit_price)} c/u</Text>
                        </View>
                      </View>
                    ))}
                    {s.notes ? <Text style={styles.notes}>📝 {s.notes}</Text> : null}

                    {s.status === 'pending' && (
                      <View style={styles.actionRow}>
                        {updatingId === s.id ? (
                          <ActivityIndicator color="#D4AF37" style={{ marginTop: 8 }} />
                        ) : (
                          <>
                            <TouchableOpacity style={styles.completeBtn} onPress={() => changeStatus(s, 'completed')}>
                              <Text style={styles.completeBtnText}>✓ Completar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => changeStatus(s, 'cancelled')}>
                              <Text style={styles.cancelBtnText}>✕ Cancelar</Text>
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </View>
            )
          }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#1E3557' },
  summary:        { flexDirection: 'row', backgroundColor: '#243D66', marginHorizontal: 12, marginTop: 12, borderRadius: 12, padding: 14, elevation: 2, alignItems: 'center' },
  summaryItem:    { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.1)' },
  summaryValue:   { fontSize: 20, fontWeight: '800', color: '#f1f5f9' },
  summaryLabel:   { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  card:           { backgroundColor: '#243D66', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2 },
  cardHeader:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  saleId:         { fontSize: 14, fontWeight: '700', color: '#f1f5f9' },
  saleDate:       { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  itemCount:      { fontSize: 11, color: '#64748b', marginTop: 1 },
  statusBadge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusText:     { fontSize: 11, fontWeight: '600' },
  totalAmt:       { fontSize: 18, fontWeight: '800', color: '#D4AF37' },
  discountBadge:  { fontSize: 11, color: '#fb923c' },
  expandHint:     { fontSize: 12, color: '#64748b', textAlign: 'center', paddingTop: 2 },
  detail:         { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', marginTop: 8, paddingTop: 8 },
  itemRow:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  itemName:       { fontSize: 13, fontWeight: '600', color: '#e2e8f0' },
  itemMeta:       { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  itemQty:        { fontSize: 14, fontWeight: '700', color: '#cbd5e1', marginHorizontal: 10 },
  itemSubtotal:   { fontSize: 13, fontWeight: '700', color: '#D4AF37' },
  itemUnit:       { fontSize: 11, color: '#64748b' },
  notes:          { fontSize: 12, color: '#94a3b8', fontStyle: 'italic', marginTop: 8 },
  empty:          { textAlign: 'center', color: '#64748b', marginTop: 40 },
  actionRow:      { flexDirection: 'row', gap: 8, marginTop: 12 },
  completeBtn:    { flex: 1, backgroundColor: 'rgba(74,222,128,0.15)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.4)', borderRadius: 8, padding: 10, alignItems: 'center' },
  completeBtnText:{ fontSize: 13, fontWeight: '700', color: '#4ade80' },
  cancelBtn:      { flex: 1, backgroundColor: 'rgba(248,113,113,0.15)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.4)', borderRadius: 8, padding: 10, alignItems: 'center' },
  cancelBtnText:  { fontSize: 13, fontWeight: '700', color: '#f87171' },
})
