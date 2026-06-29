import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'
import { api } from '../services/api'

interface PackPrice { id: number; pack_name: string; price_a: number; price_b: number | null; price_c: number | null; stock: number }
interface Product { id: number; name: string; sku: string | null; prices: PackPrice[]; category: { name: string } | null }

const fmt = (v: number | null) => v != null ? `$${Number(v).toFixed(2)}` : '—'

export function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/products').then(r => { setProducts(r.data); setLoading(false) })
  }, [])

  const filtered = products.filter(p => {
    const q = search.toLowerCase()
    return p.name.toLowerCase().includes(q) || (p.sku ?? '').toLowerCase().includes(q)
  })

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar por nombre o código..."
        placeholderTextColor="#9ca3af"
        value={search}
        onChangeText={setSearch}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={p => String(p.id)}
          renderItem={({ item: p }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.productName}>{p.name}</Text>
                {p.sku && <Text style={styles.sku}>{p.sku}</Text>}
              </View>
              {p.category && <Text style={styles.category}>{p.category.name}</Text>}
              {p.prices.map(pr => (
                <View key={pr.id} style={styles.priceRow}>
                  <Text style={styles.packName}>{pr.pack_name}</Text>
                  <Text style={[styles.price, { color: '#2563eb' }]}>A: {fmt(pr.price_a)}</Text>
                  {pr.price_b != null && <Text style={[styles.price, { color: '#16a34a' }]}>B: {fmt(pr.price_b)}</Text>}
                  {pr.price_c != null && <Text style={[styles.price, { color: '#ea580c' }]}>C: {fmt(pr.price_c)}</Text>}
                  <Text style={[styles.stock, { color: pr.stock === 0 ? '#ef4444' : '#374151' }]}>
                    Stock: {pr.stock}
                  </Text>
                </View>
              ))}
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Sin productos</Text>}
          contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  searchInput: { margin: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#111827' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  productName: { fontSize: 15, fontWeight: '700', color: '#111827', flex: 1 },
  sku: { fontSize: 11, color: '#6b7280' },
  category: { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  packName: { fontSize: 12, fontWeight: '600', color: '#374151', width: 80 },
  price: { fontSize: 12, fontWeight: '600' },
  stock: { fontSize: 12, marginLeft: 'auto' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
})
