import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native'
import { useAuthStore, ROLE_LABELS } from '../store/auth.store'
import { usePermissionsStore } from '../store/permissions.store'
import { api } from '../services/api'

interface Stats { products: number; customers: number; sales: number }

const MENU_COLORS: Record<string, string> = {
  'Nueva venta':   '#1d4ed8',
  'Historial':     '#6d28d9',
  'Reportes':      '#064e3b',
  'Productos':     '#0e7490',
  'Categorías':    '#92400e',
  'Clientes':      '#065f46',
  'Usuarios':      '#7c3aed',
  'Permisos':      '#9f1239',
  'Mi contraseña': '#0f4c75',
}

const SECTIONS = [
  {
    title: 'VENTAS',
    keys: ['Nueva venta', 'Historial', 'Reportes'],
  },
  {
    title: 'CATÁLOGO',
    keys: ['Productos', 'Categorías'],
  },
  {
    title: 'ADMINISTRACIÓN',
    keys: ['Clientes', 'Usuarios', 'Permisos'],
  },
  {
    title: 'MI CUENTA',
    keys: ['Mi contraseña'],
  },
]

export function HomeScreen({ navigation }: any) {
  const { user, logout } = useAuthStore()
  const { has } = usePermissionsStore()
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

  const statCards = [
    { label: 'Productos', value: stats.products, color: '#D4AF37', screen: 'Products', show: true },
    { label: 'Clientes',  value: stats.customers, color: '#60a5fa', screen: 'Customers', show: has('view_customers') },
    { label: 'Ventas',    value: stats.sales,     color: '#a78bfa', screen: 'SalesHistory', show: true },
  ]

  const allItems: Record<string, { screen: string; show: boolean }> = {
    'Nueva venta':   { screen: 'Sales',          show: has('create_sales') },
    'Historial':     { screen: 'SalesHistory',   show: true },
    'Reportes':      { screen: 'Reports',        show: has('view_reports') },
    'Productos':     { screen: 'Products',       show: true },
    'Categorías':    { screen: 'Categories',     show: has('manage_categories') },
    'Clientes':      { screen: 'Customers',      show: has('view_customers') },
    'Usuarios':      { screen: 'Users',          show: role === 'admin' },
    'Permisos':      { screen: 'Permissions',    show: role === 'admin' },
    'Mi contraseña': { screen: 'ChangePassword', show: true },
  }

  const visibleSections = SECTIONS.map(s => ({
    title: s.title,
    items: s.keys
      .filter(k => allItems[k]?.show)
      .map(k => ({ label: k, screen: allItems[k].screen })),
  })).filter(s => s.items.length > 0)

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.shopName}>EL PATRÓN SHOP</Text>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Hola, {user?.full_name?.split(' ')[0] || user?.email}</Text>
            <Text style={styles.roleTag}>{ROLE_LABELS[role]}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Salir</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {statCards.filter(c => c.show).map(c => (
          <TouchableOpacity key={c.label} style={[styles.statCard, { borderTopColor: c.color }]}
            onPress={() => navigation.navigate(c.screen)}>
            <Text style={[styles.statValue, { color: c.color }]}>{c.value}</Text>
            <Text style={styles.statLabel}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Secciones de acceso rápido */}
      {visibleSections.map(section => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.menuGrid}>
            {section.items.map((item, idx, arr) => {
              const isAlone = arr.length % 2 !== 0 && idx === arr.length - 1
              return (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.menuItem,
                    { backgroundColor: MENU_COLORS[item.label] ?? '#1E3557' },
                    isAlone && styles.menuItemFull,
                  ]}
                  onPress={() => navigation.navigate(item.screen)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.menuText}>{item.label}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      ))}

      <View style={{ height: 30 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#1E3557' },
  header:       { backgroundColor: '#0F0F0F', padding: 20, paddingTop: 52 },
  shopName:     { color: '#D4AF37', fontSize: 18, fontWeight: '800', letterSpacing: 3, textAlign: 'center', marginBottom: 12 },
  headerRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting:     { color: '#fff', fontSize: 18, fontWeight: '700' },
  roleTag:      { color: '#B8860B', fontSize: 13, marginTop: 2 },
  logoutBtn:    { backgroundColor: 'rgba(212,175,55,0.15)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#D4AF37' },
  logoutText:   { color: '#D4AF37', fontSize: 13, fontWeight: '600' },
  statsRow:     { flexDirection: 'row', padding: 16, gap: 10 },
  statCard:     { flex: 1, backgroundColor: '#243D66', borderRadius: 12, padding: 16, alignItems: 'center', borderTopWidth: 3, elevation: 2 },
  statValue:    { fontSize: 28, fontWeight: '800' },
  statLabel:    { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  section:      { paddingHorizontal: 16, marginBottom: 4 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#D4AF37', marginBottom: 8, letterSpacing: 1.5, textTransform: 'uppercase' },
  menuGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  menuItem:     { width: '47%', borderRadius: 12, padding: 20, alignItems: 'center', elevation: 2 },
  menuItemFull: { width: '100%' },
  menuText:     { color: '#fff', fontSize: 15, fontWeight: '700' },
})
