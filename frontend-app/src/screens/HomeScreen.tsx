import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native'
import { useAuthStore, ROLE_LABELS } from '../store/auth.store'
import { api } from '../services/api'

interface Stats { products: number; customers: number; sales: number }

export function HomeScreen({ navigation }: any) {
  const { user, logout } = useAuthStore()
  const [stats, setStats] = useState<Stats>({ products: 0, customers: 0, sales: 0 })
  const role = user?.role ?? 'vendedor'

  useEffect(() => {
    Promise.all([
      api.get('/products').then(r => r.data.length).catch(() => 0),
      api.get('/customers').then(r => r.data.length).catch(() => 0),
      api.get('/sales').then(r => r.data.length).catch(() => 0),
    ]).then(([products, customers, sales]) => setStats({ products, customers, sales }))
  }, [])

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Confirmás?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ])
  }

  const cards = [
    { label: 'Productos', value: stats.products, color: '#2563eb', screen: 'Products' },
    { label: 'Clientes', value: stats.customers, color: '#16a34a', screen: 'Customers', roles: ['admin', 'ejecutivo'] },
    { label: 'Ventas', value: stats.sales, color: '#7c3aed', screen: 'Sales' },
  ]

  const menuItems = [
    { label: 'Nueva venta', screen: 'Sales', color: '#2563eb', roles: ['admin', 'ejecutivo', 'vendedor'] },
    { label: 'Productos', screen: 'Products', color: '#0891b2', roles: ['admin', 'ejecutivo', 'vendedor'] },
    { label: 'Clientes', screen: 'Customers', color: '#16a34a', roles: ['admin', 'ejecutivo'] },
    { label: 'Usuarios', screen: 'Users', color: '#7c3aed', roles: ['admin'] },
  ]

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {user?.full_name?.split(' ')[0] || user?.email}</Text>
          <Text style={styles.roleTag}>{ROLE_LABELS[role]}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {cards.filter(c => !c.roles || c.roles.includes(role)).map(c => (
          <TouchableOpacity key={c.label} style={[styles.statCard, { borderTopColor: c.color }]}
            onPress={() => navigation.navigate(c.screen)}>
            <Text style={[styles.statValue, { color: c.color }]}>{c.value}</Text>
            <Text style={styles.statLabel}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Menu */}
      <Text style={styles.sectionTitle}>Accesos rápidos</Text>
      <View style={styles.menuGrid}>
        {menuItems.filter(m => m.roles.includes(role)).map(m => (
          <TouchableOpacity key={m.label} style={[styles.menuItem, { backgroundColor: m.color }]}
            onPress={() => navigation.navigate(m.screen)}>
            <Text style={styles.menuText}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { backgroundColor: '#1e40af', padding: 24, paddingTop: 52, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { color: '#fff', fontSize: 20, fontWeight: '700' },
  roleTag: { color: '#93c5fd', fontSize: 13, marginTop: 2 },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  logoutText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  statsRow: { flexDirection: 'row', padding: 16, gap: 10 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', borderTopWidth: 3, elevation: 2 },
  statValue: { fontSize: 28, fontWeight: '800' },
  statLabel: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  sectionTitle: { paddingHorizontal: 16, fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 10 },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10, paddingBottom: 30 },
  menuItem: { width: '47%', borderRadius: 12, padding: 20, alignItems: 'center', elevation: 2 },
  menuText: { color: '#fff', fontSize: 15, fontWeight: '700' },
})
