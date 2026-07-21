import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { api } from '../services/api'
import { usePermissionsStore } from '../store/permissions.store'

interface SaleItem { product_id: number; quantity: number; subtotal: number }
interface Sale {
  id: number; total: number; discount_pct: number
  status: 'pending' | 'completed' | 'cancelled'
  items: SaleItem[]; created_at: string
}
interface Product { id: number; name: string }

const PERIODS = [
  { key: 'today', label: 'Hoy' },
  { key: 'week',  label: 'Semana' },
  { key: 'month', label: 'Mes' },
  { key: 'all',   label: 'Total' },
]

function inPeriod(dateStr: string, period: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  if (period === 'today') return d.toDateString() === now.toDateString()
  if (period === 'week') {
    const start = new Date(now); start.setDate(now.getDate() - now.getDay()); start.setHours(0,0,0,0)
    return d >= start
  }
  if (period === 'month') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  return true
}

const fmt = (v: number) => `$${Number(v).toFixed(2)}`

function HBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(4, (value / max) * 100) : 4
  return (
    <View style={hStyles.track}>
      <View style={[hStyles.fill, { width: `${pct}%` as any, backgroundColor: color }]} />
    </View>
  )
}
const hStyles = StyleSheet.create({
  track: { height: 8, backgroundColor: '#172A46', borderRadius: 4, overflow: 'hidden', flex: 1 },
  fill:  { height: '100%', borderRadius: 4 },
})

export function ReportsScreen() {
  const { has } = usePermissionsStore()
  const canViewRevenue = has('view_revenue')

  const [sales, setSales]       = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [period, setPeriod]     = useState<string>('month')

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true)
    try {
      const [sr, pr] = await Promise.all([api.get('/sales'), api.get('/products')])
      setSales(sr.data); setProducts(pr.data)
    } catch {}
    setLoading(false); setRefreshing(false)
  }

  useFocusEffect(useCallback(() => { load() }, []))

  const periodSales = sales.filter(s => inPeriod(s.created_at, period))
  const completed   = periodSales.filter(s => s.status === 'completed')
  const pending     = periodSales.filter(s => s.status === 'pending')
  const cancelled   = periodSales.filter(s => s.status === 'cancelled')

  const totalRevenue  = completed.reduce((acc, s) => acc + Number(s.total), 0)
  const avgTicket     = completed.length > 0 ? totalRevenue / completed.length : 0
  const maxTicket     = completed.length > 0 ? Math.max(...completed.map(s => Number(s.total))) : 0

  // Top productos por cantidad vendida
  const productQty: Record<number, number> = {}
  periodSales.forEach(s => {
    s.items.forEach(it => {
      productQty[it.product_id] = (productQty[it.product_id] ?? 0) + it.quantity
    })
  })
  const topProducts = Object.entries(productQty)
    .map(([id, qty]) => ({ id: Number(id), qty, name: products.find(p => p.id === Number(id))?.name ?? `#${id}` }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5)
  const maxQty = topProducts[0]?.qty ?? 1

  // Distribución de estados
  const total = periodSales.length || 1
  const pctCompleted = Math.round((completed.length / total) * 100)
  const pctPending   = Math.round((pending.length / total) * 100)
  const pctCancelled = Math.round((cancelled.length / total) * 100)

  // Ventas por día (últimos 7 días)
  const dailyMap: Record<string, number> = {}
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0)
    const key = d.toDateString()
    days.push(key)
    dailyMap[key] = 0
  }
  sales.filter(s => s.status === 'completed').forEach(s => {
    const key = new Date(s.created_at).toDateString()
    if (key in dailyMap) dailyMap[key] += Number(s.total)
  })
  const dailyValues = days.map(d => ({ label: new Date(d).toLocaleDateString('es', { weekday: 'short' }), value: dailyMap[d] }))
  const maxDaily = Math.max(...dailyValues.map(d => d.value), 1)

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={['#D4AF37']} tintColor="#D4AF37" />}>

      {/* Selector de período */}
      <View style={styles.periodRow}>
        {PERIODS.map(p => (
          <TouchableOpacity key={p.key}
            style={[styles.periodBtn, period === p.key && styles.periodBtnActive]}
            onPress={() => setPeriod(p.key)}>
            <Text style={[styles.periodText, period === p.key && styles.periodTextActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#D4AF37" style={{ marginTop: 60 }} />
      ) : (
        <>
          {/* KPIs */}
          <View style={styles.kpiGrid}>
            {canViewRevenue && (
              <View style={[styles.kpiCard, { borderTopColor: '#D4AF37' }]}>
                <Text style={[styles.kpiValue, { color: '#D4AF37' }]}>{fmt(totalRevenue)}</Text>
                <Text style={styles.kpiLabel}>Ingresos</Text>
              </View>
            )}
            <View style={[styles.kpiCard, { borderTopColor: '#4ade80' }]}>
              <Text style={[styles.kpiValue, { color: '#4ade80' }]}>{completed.length}</Text>
              <Text style={styles.kpiLabel}>Completadas</Text>
            </View>
            {canViewRevenue && (
              <View style={[styles.kpiCard, { borderTopColor: '#60a5fa' }]}>
                <Text style={[styles.kpiValue, { color: '#60a5fa' }]}>{fmt(avgTicket)}</Text>
                <Text style={styles.kpiLabel}>Ticket prom.</Text>
              </View>
            )}
            {canViewRevenue && (
              <View style={[styles.kpiCard, { borderTopColor: '#a78bfa' }]}>
                <Text style={[styles.kpiValue, { color: '#a78bfa' }]}>{fmt(maxTicket)}</Text>
                <Text style={styles.kpiLabel}>Ticket máx.</Text>
              </View>
            )}
          </View>

          {/* Distribución de estados */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Distribución de ventas</Text>
            {periodSales.length === 0 ? (
              <Text style={styles.empty}>Sin ventas en este período</Text>
            ) : (
              <>
                {[
                  { label: 'Completadas', count: completed.length, pct: pctCompleted, color: '#4ade80' },
                  { label: 'Pendientes',  count: pending.length,   pct: pctPending,   color: '#fbbf24' },
                  { label: 'Canceladas',  count: cancelled.length, pct: pctCancelled, color: '#f87171' },
                ].map(row => (
                  <View key={row.label} style={styles.distRow}>
                    <Text style={[styles.distLabel, { color: row.color }]}>{row.label}</Text>
                    <HBar value={row.count} max={periodSales.length} color={row.color} />
                    <Text style={styles.distCount}>{row.count} ({row.pct}%)</Text>
                  </View>
                ))}
              </>
            )}
          </View>

          {/* Top productos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top productos vendidos</Text>
            {topProducts.length === 0 ? (
              <Text style={styles.empty}>Sin datos en este período</Text>
            ) : (
              topProducts.map((p, i) => (
                <View key={p.id} style={styles.topRow}>
                  <Text style={styles.topRank}>#{i + 1}</Text>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.topName} numberOfLines={1}>{p.name}</Text>
                    <HBar value={p.qty} max={maxQty} color="#D4AF37" />
                  </View>
                  <Text style={styles.topQty}>{p.qty} uds</Text>
                </View>
              ))
            )}
          </View>

          {/* Ingresos últimos 7 días */}
          {canViewRevenue && <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingresos últimos 7 días</Text>
            <View style={styles.dailyChart}>
              {dailyValues.map((d, i) => {
                const barH = maxDaily > 0 ? Math.max(4, (d.value / maxDaily) * 80) : 4
                return (
                  <View key={i} style={styles.dailyCol}>
                    <Text style={styles.dailyVal}>{d.value > 0 ? `$${Math.round(d.value)}` : ''}</Text>
                    <View style={styles.dailyBarWrap}>
                      <View style={[styles.dailyBar, { height: barH, backgroundColor: d.value > 0 ? '#D4AF37' : '#172A46' }]} />
                    </View>
                    <Text style={styles.dailyLabel}>{d.label}</Text>
                  </View>
                )
              })}
            </View>
          </View>}
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#1E3557' },
  periodRow:        { flexDirection: 'row', margin: 12, backgroundColor: '#172A46', borderRadius: 12, padding: 4, gap: 4 },
  periodBtn:        { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
  periodBtnActive:  { backgroundColor: '#D4AF37' },
  periodText:       { fontSize: 13, fontWeight: '600', color: '#64748b' },
  periodTextActive: { color: '#0F0F0F' },
  kpiGrid:          { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10 },
  kpiCard:          { width: '47%', backgroundColor: '#243D66', borderRadius: 12, padding: 14, borderTopWidth: 3, elevation: 2 },
  kpiValue:         { fontSize: 20, fontWeight: '800' },
  kpiLabel:         { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  section:          { marginHorizontal: 12, marginTop: 16, backgroundColor: '#243D66', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  sectionTitle:     { fontSize: 13, fontWeight: '700', color: '#D4AF37', marginBottom: 14, letterSpacing: 0.5, textTransform: 'uppercase' },
  distRow:          { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  distLabel:        { fontSize: 12, fontWeight: '600', width: 90 },
  distCount:        { fontSize: 12, color: '#64748b', width: 70, textAlign: 'right' },
  topRow:           { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  topRank:          { fontSize: 13, fontWeight: '800', color: '#475569', width: 24 },
  topName:          { fontSize: 13, fontWeight: '600', color: '#e2e8f0' },
  topQty:           { fontSize: 12, color: '#94a3b8', width: 55, textAlign: 'right' },
  dailyChart:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120 },
  dailyCol:         { flex: 1, alignItems: 'center', gap: 4 },
  dailyBarWrap:     { height: 80, justifyContent: 'flex-end', width: '70%' },
  dailyBar:         { borderRadius: 4, width: '100%' },
  dailyVal:         { fontSize: 9, color: '#D4AF37', fontWeight: '700', textAlign: 'center' },
  dailyLabel:       { fontSize: 10, color: '#64748b', textTransform: 'capitalize' },
  empty:            { fontSize: 13, color: '#475569', fontStyle: 'italic', textAlign: 'center', paddingVertical: 8 },
})
