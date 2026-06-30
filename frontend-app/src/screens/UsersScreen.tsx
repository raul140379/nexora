import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, ScrollView, TextInput, Alert, ActivityIndicator
} from 'react-native'
import { api } from '../services/api'
import { UserRole, ROLE_LABELS } from '../store/auth.store'

interface UserData {
  id: number; email: string; username: string; full_name: string | null
  role: UserRole; is_active: boolean
}

const ROLE_COLORS: Record<UserRole, { bg: string; text: string }> = {
  admin:    { bg: '#f3e8ff', text: '#7c3aed' },
  ejecutivo:{ bg: '#dbeafe', text: '#1d4ed8' },
  vendedor: { bg: '#dcfce7', text: '#16a34a' },
}

const EMPTY = { email: '', username: '', full_name: '', password: '', role: 'vendedor' as UserRole }

export function UsersScreen() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/users').then(r => { setUsers(r.data); setLoading(false) }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditingId(null); setForm(EMPTY); setShowModal(true) }

  const openEdit = (u: UserData) => {
    setEditingId(u.id)
    setForm({ email: u.email, username: u.username, full_name: u.full_name ?? '', password: '', role: u.role })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.username.trim() || !form.email.trim()) {
      Alert.alert('Error', 'Usuario y email son obligatorios'); return
    }
    if (!editingId && !form.password) {
      Alert.alert('Error', 'La contraseña es obligatoria'); return
    }
    setSaving(true)
    const payload: Record<string, unknown> = {
      email: form.email.trim(), username: form.username.trim(),
      full_name: form.full_name.trim() || null, role: form.role,
    }
    if (!editingId || form.password) payload.password = form.password
    try {
      if (editingId) {
        await api.put(`/users/${editingId}`, payload)
      } else {
        await api.post('/users', payload)
      }
      setShowModal(false); load()
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Error al guardar')
    } finally { setSaving(false) }
  }

  const handleDelete = (u: UserData) => {
    Alert.alert('Eliminar usuario', `¿Eliminar a ${u.full_name || u.username}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/users/${u.id}`); load()
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.detail || 'No se pudo eliminar')
          }
        }
      }
    ])
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.newBtn} onPress={openCreate}>
        <Text style={styles.newBtnText}>+ Nuevo usuario</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={u => String(u.id)}
          ListEmptyComponent={<Text style={styles.empty}>Sin usuarios registrados</Text>}
          contentContainerStyle={{ padding: 12, paddingBottom: 30 }}
          renderItem={({ item: u }) => {
            const rc = ROLE_COLORS[u.role]
            return (
              <View style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{u.full_name || u.username}</Text>
                    <Text style={styles.username}>@{u.username}</Text>
                    <Text style={styles.email}>{u.email}</Text>
                  </View>
                  <View style={styles.right}>
                    <View style={[styles.roleBadge, { backgroundColor: rc.bg }]}>
                      <Text style={[styles.roleText, { color: rc.text }]}>{ROLE_LABELS[u.role]}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: u.is_active ? '#dcfce7' : '#f3f4f6' }]}>
                      <Text style={{ fontSize: 10, color: u.is_active ? '#16a34a' : '#6b7280' }}>
                        {u.is_active ? 'Activo' : 'Inactivo'}
                      </Text>
                    </View>
                    <View style={styles.btnRow}>
                      <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(u)}>
                        <Text style={styles.editBtnText}>Editar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(u)}>
                        <Text style={styles.delBtnText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            )
          }}
        />
      )}

      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={styles.overlay}>
          <ScrollView contentContainerStyle={styles.modalBox} keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'Editar usuario' : 'Nuevo usuario'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={{ fontSize: 22, color: '#6b7280' }}>×</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Nombre completo</Text>
            <TextInput style={styles.input} value={form.full_name}
              onChangeText={t => setForm(p => ({ ...p, full_name: t }))}
              placeholder="Ej: Juan Pérez" placeholderTextColor="#9ca3af" />

            <Text style={styles.label}>Usuario *</Text>
            <TextInput style={styles.input} value={form.username}
              onChangeText={t => setForm(p => ({ ...p, username: t }))}
              placeholder="usuario123" placeholderTextColor="#9ca3af" autoCapitalize="none" />

            <Text style={styles.label}>Email *</Text>
            <TextInput style={styles.input} value={form.email}
              onChangeText={t => setForm(p => ({ ...p, email: t }))}
              placeholder="correo@empresa.com" placeholderTextColor="#9ca3af"
              keyboardType="email-address" autoCapitalize="none" />

            <Text style={styles.label}>
              Contraseña {editingId ? '(dejar vacío para no cambiar)' : '*'}
            </Text>
            <TextInput style={styles.input} value={form.password}
              onChangeText={t => setForm(p => ({ ...p, password: t }))}
              placeholder="••••••••" placeholderTextColor="#9ca3af" secureTextEntry />

            <Text style={styles.label}>Rol *</Text>
            <View style={styles.roleRow}>
              {(['admin', 'ejecutivo', 'vendedor'] as UserRole[]).map(r => {
                const rc = ROLE_COLORS[r]
                return (
                  <TouchableOpacity key={r}
                    style={[styles.roleBtn, form.role === r && { backgroundColor: rc.bg, borderColor: rc.text }]}
                    onPress={() => setForm(p => ({ ...p, role: r }))}>
                    <Text style={[styles.roleBtnText, form.role === r && { color: rc.text }]}>
                      {ROLE_LABELS[r]}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.5 }]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{editingId ? 'Actualizar' : 'Crear'}</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  newBtn: { margin: 12, backgroundColor: '#2563eb', borderRadius: 10, padding: 13, alignItems: 'center' },
  newBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, elevation: 2 },
  cardRow: { flexDirection: 'row', gap: 10 },
  name: { fontSize: 14, fontWeight: '700', color: '#111827' },
  username: { fontSize: 12, color: '#6b7280', fontFamily: 'monospace' },
  email: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 5 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  roleText: { fontSize: 10, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  btnRow: { flexDirection: 'row', gap: 6 },
  editBtn: { backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  editBtnText: { fontSize: 12, color: '#2563eb', fontWeight: '600' },
  delBtn: { backgroundColor: '#fef2f2', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  delBtnText: { fontSize: 16, color: '#ef4444', fontWeight: '700' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827' },
  roleRow: { gap: 8 },
  roleBtn: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, alignItems: 'center' },
  roleBtnText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 13, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  saveBtn: { flex: 1, backgroundColor: '#2563eb', borderRadius: 10, padding: 13, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
})
