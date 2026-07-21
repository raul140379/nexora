import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Switch
} from 'react-native'
import { api } from '../services/api'
import { usePermissionsStore } from '../store/permissions.store'

interface PermItem  { key: string; label: string; allowed: boolean }
interface RolePerms { role: string; permissions: PermItem[] }

const ROLE_META: Record<string, { label: string; color: string; desc: string }> = {
  admin:     { label: 'Admin',     color: '#D4AF37', desc: 'Acceso total' },
  ejecutivo: { label: 'Ejecutivo', color: '#60a5fa', desc: 'Gestión operativa' },
  vendedor:  { label: 'Vendedor',  color: '#4ade80', desc: 'Operaciones de venta' },
}

export function PermissionsScreen() {
  const [data, setData]         = useState<RolePerms[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>('ejecutivo')
  const reloadMyPerms = usePermissionsStore(s => s.load)

  const load = () => {
    setLoading(true)
    api.get<RolePerms[]>('/permissions')
      .then(r => { setData(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const toggle = async (role: string, key: string, current: boolean) => {
    const id = `${role}:${key}`
    setSaving(id)
    try {
      await api.put(`/permissions/${role}/${key}`, { allowed: !current })
      setData(prev => prev.map(r =>
        r.role !== role ? r : {
          ...r,
          permissions: r.permissions.map(p =>
            p.key !== key ? p : { ...p, allowed: !current }
          )
        }
      ))
      await reloadMyPerms()
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Error al actualizar permiso')
    } finally {
      setSaving(null)
    }
  }

  const resetRole = (role: string) => {
    Alert.alert(
      'Restaurar permisos',
      `¿Restaurar los permisos de ${ROLE_META[role]?.label} a valores por defecto?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restaurar', style: 'destructive', onPress: async () => {
            try {
              await api.post(`/permissions/${role}/reset`)
              load()
              await reloadMyPerms()
              Alert.alert('✓', 'Permisos restaurados a valores por defecto')
            } catch {
              Alert.alert('Error', 'No se pudieron restaurar los permisos')
            }
          }
        }
      ]
    )
  }

  const current = data.find(r => r.role === activeTab)
  const activeCount = current?.permissions.filter(p => p.allowed).length ?? 0
  const totalCount  = current?.permissions.length ?? 0

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>

      {/* Tabs de roles */}
      <View style={styles.tabs}>
        {(['admin', 'ejecutivo', 'vendedor'] as const).map(role => {
          const m = ROLE_META[role]
          const active = activeTab === role
          return (
            <TouchableOpacity key={role}
              style={[styles.tab, active && { borderColor: m.color, backgroundColor: 'rgba(36,61,102,0.8)' }]}
              onPress={() => setActiveTab(role)}>
              <Text style={[styles.tabLabel, { color: active ? m.color : '#64748b' }]}>{m.label}</Text>
              <Text style={[styles.tabDesc, active && { color: '#94a3b8' }]}>{m.desc}</Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#D4AF37" style={{ marginTop: 40 }} />
      ) : current ? (
        <View style={styles.card}>

          {/* Card header */}
          <View style={styles.cardHeader}>
            <View style={[styles.roleBadge, { borderColor: `${ROLE_META[current.role]?.color}40` }]}>
              <Text style={[styles.roleBadgeText, { color: ROLE_META[current.role]?.color }]}>
                {ROLE_META[current.role]?.label}
              </Text>
            </View>
            <Text style={styles.permCount}>{activeCount} / {totalCount} activos</Text>
            {current.role !== 'admin' && (
              <TouchableOpacity style={styles.resetBtn} onPress={() => resetRole(current.role)}>
                <Text style={styles.resetBtnText}>↺ Restaurar</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Lista de permisos */}
          {current.permissions.map((p, idx) => {
            const id = `${current.role}:${p.key}`
            const isLoading   = saving === id
            const isAdminCore = current.role === 'admin' && p.key === 'manage_users'

            return (
              <View key={p.key} style={[
                styles.permRow,
                idx < current.permissions.length - 1 && styles.permRowBorder,
                !p.allowed && styles.permRowDimmed,
              ]}>
                <View style={[styles.dot, { backgroundColor: p.allowed ? '#4ade80' : '#334155' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.permLabel}>{p.label}</Text>
                  <Text style={styles.permKey}>{p.key}</Text>
                </View>
                <View style={styles.switchWrap}>
                  {isAdminCore && <Text style={styles.lockedText}>bloqueado</Text>}
                  {isLoading
                    ? <ActivityIndicator size="small" color="#D4AF37" style={{ width: 51 }} />
                    : (
                      <Switch
                        value={p.allowed}
                        onValueChange={() => !isAdminCore && toggle(current.role, p.key, p.allowed)}
                        disabled={isAdminCore}
                        trackColor={{ false: '#172A46', true: '#D4AF37' }}
                        thumbColor="#fff"
                        ios_backgroundColor="#172A46"
                      />
                    )
                  }
                </View>
              </View>
            )
          })}
        </View>
      ) : null}

      {/* Info box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoIcon}>ℹ</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.infoTitle}>Sobre los permisos</Text>
          <Text style={styles.infoText}>
            Los cambios se aplican de inmediato. El rol Administrador siempre tiene acceso total. Los usuarios deben cerrar sesión y volver a entrar para ver los cambios.
          </Text>
        </View>
      </View>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#1E3557' },
  tabs:           { flexDirection: 'row', padding: 12, gap: 8 },
  tab:            { flex: 1, borderWidth: 1, borderColor: '#2d4a6e', borderRadius: 12, padding: 10, alignItems: 'center', backgroundColor: '#172A46' },
  tabLabel:       { fontSize: 13, fontWeight: '700' },
  tabDesc:        { fontSize: 10, color: '#475569', marginTop: 2, textAlign: 'center' },
  card:           { marginHorizontal: 12, backgroundColor: '#243D66', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', gap: 8, flexWrap: 'wrap' },
  roleBadge:      { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  roleBadgeText:  { fontSize: 12, fontWeight: '700' },
  permCount:      { fontSize: 12, color: '#64748b', flex: 1 },
  resetBtn:       { borderWidth: 1, borderColor: '#2d4a6e', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  resetBtnText:   { fontSize: 12, color: '#94a3b8' },
  permRow:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  permRowBorder:  { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  permRowDimmed:  { opacity: 0.55 },
  dot:            { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  permLabel:      { fontSize: 14, fontWeight: '600', color: '#e2e8f0' },
  permKey:        { fontSize: 11, color: '#475569', fontFamily: 'monospace', marginTop: 2 },
  switchWrap:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lockedText:     { fontSize: 11, color: '#334155', fontStyle: 'italic' },
  infoBox:        { flexDirection: 'row', margin: 12, marginTop: 16, backgroundColor: 'rgba(96,165,250,0.08)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.2)', borderRadius: 12, padding: 14, gap: 10 },
  infoIcon:       { fontSize: 18, color: '#60a5fa' },
  infoTitle:      { fontSize: 13, fontWeight: '600', color: '#93c5fd', marginBottom: 4 },
  infoText:       { fontSize: 12, color: '#94a3b8', lineHeight: 18 },
})
