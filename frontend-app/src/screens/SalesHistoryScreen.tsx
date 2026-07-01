import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl
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
  pending:   { bg: '#fef9c3', text: '#854d0e' },
  completed: { bg: '#dcfce7', text: '#166534' },
  cancelled: { bg: '#fee2e2', text: '#991b1b' },
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
          <Text style={[styles.summaryValue, { color: '#16a34a', fontSize: 16 }]}>{fmt(totalRevenue)}</Text>
          <Text style={styles.summaryLabel}>Total cobrado</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={sales}
          keyExtractor={s => String(s.id)}
          ListEmptyComponent={<Text style={styles.empty}>Sin ventas registradas</Text>}
          contentContainerStyle={{ padding: 12, paddingBottom: 30 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={['#2563eb']} />}
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
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  summary: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 12, marginTop: 12, borderRadius: 12, padding: 14, elevation: 2, alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, height: 36, backgroundColor: '#e5e7eb' },
  summaryValue: { fontSize: 20, fontWeight: '800', color: '#111827' },
  summaryLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  saleId: { fontSize: 14, fontWeight: '700', color: '#111827' },
  saleDate: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  itemCount: { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '600' },
  totalAmt: { fontSize: 18, fontWeight: '800', color: '#2563eb' },
  discountBadge: { fontSize: 11, color: '#ea580c' },
  expandHint: { fontSize: 12, color: '#9ca3af', textAlign: 'center', paddingTop: 2 },
  detail: { borderTopWidth: 1, borderTopColor: '#f3f4f6', marginTop: 8, paddingTop: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  itemName: { fontSize: 13, fontWeight: '600', color: '#111827' },
  itemMeta: { fontSize: 11, color: '#6b7280', marginTop: 1 },
  itemQty: { fontSize: 14, fontWeight: '700', color: '#374151', marginHorizontal: 10 },
  itemSubtotal: { fontSize: 13, fontWeight: '700', color: '#111827' },
  itemUnit: { fontSize: 11, color: '#9ca3af' },
  notes: { fontSize: 12, color: '#6b7280', fontStyle: 'italic', marginTop: 8 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
})
