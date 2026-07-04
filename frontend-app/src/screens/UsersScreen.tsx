import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, ScrollView, TextInput, Alert, ActivityIndicator
} from 'react-native'
import { api } from '../services/api'
import { useAuthStore, UserRole, ROLE_LABELS } from '../store/auth.store'

interface UserData {
  id: number; email: string; username: string; full_name: string | null
  role: UserRole; is_active: boolean
}

const ROLE_COLORS: Record<UserRole, { bg: string; text: string }> = {
  admin:    { bg: 'rgba(212,175,55,0.2)',  text: '#D4AF37' },
  ejecutivo:{ bg: 'rgba(96,165,250,0.2)', text: '#60a5fa' },
  vendedor: { bg: 'rgba(74,222,128,0.2)', text: '#4ade80' },
}

const EMPTY = { email: '', username: '', full_name: '', password: '', role: 'vendedor' as UserRole }

export function UsersScreen() {
  const { user: currentUser } = useAuthStore()
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const [resetModal, setResetModal] = useState<{ id: number; name: string } | null>(null)
  const [newPw, setNewPw] = useState('')
  const [resetSaving, setResetSaving] = useState(false)

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

  const handleResetPw = async () => {
    if (!resetModal) return
    if (newPw.length < 6) { Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres'); return }
    setResetSaving(true)
    try {
      await api.post(`/users/${resetModal.id}/reset-password`, { new_password: newPw })
      Alert.alert('Listo', `Contraseña de ${resetModal.name} actualizada`)
      setResetModal(null); setNewPw('')
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'No se pudo resetear')
    } finally { setResetSaving(false) }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.newBtn} onPress={openCreate}>
        <Text style={styles.newBtnText}>+ Nuevo usuario</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#D4AF37" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={u => String(u.id)}
          ListEmptyComponent={<Text style={styles.empty}>Sin usuarios registrados</Text>}
          contentContainerStyle={{ padding: 12, paddingBottom: 30 }}
          renderItem={({ item: u }) => {
            const rc = ROLE_COLORS[u.role]
            const isSelf = u.id === currentUser?.id
            return (
              <View style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(u.full_name || u.username)[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{u.full_name || u.username}</Text>
                    <Text style={styles.username}>@{u.username}</Text>
                    <Text style={styles.email}>{u.email}</Text>
                  </View>
                  <View style={styles.right}>
                    <View style={[styles.roleBadge, { backgroundColor: rc.bg }]}>
                      <Text style={[styles.roleText, { color: rc.text }]}>{ROLE_LABELS[u.role]}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: u.is_active ? 'rgba(74,222,128,0.15)' : 'rgba(148,163,184,0.1)' }]}>
                      <Text style={{ fontSize: 10, color: u.is_active ? '#4ade80' : '#64748b' }}>
                        {u.is_active ? 'Activo' : 'Inactivo'}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.btnRow}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(u)}>
                    <Text style={styles.editBtnText}>Editar</Text>
                  </TouchableOpacity>
                  {!isSelf && (
                    <TouchableOpacity style={styles.resetBtn}
                      onPress={() => { setResetModal({ id: u.id, name: u.full_name || u.username }); setNewPw('') }}>
                      <Text style={styles.resetBtnText}>Reset PW</Text>
                    </TouchableOpacity>
                  )}
                  {!isSelf && (
                    <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(u)}>
                      <Text style={styles.delBtnText}>×</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )
          }}
        />
      )}

      {/* Modal crear/editar usuario */}
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={styles.overlay}>
          <ScrollView contentContainerStyle={styles.modalBox} keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'Editar usuario' : 'Nuevo usuario'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={{ fontSize: 22, color: '#94a3b8' }}>×</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Nombre completo</Text>
            <TextInput style={styles.input} value={form.full_name}
              onChangeText={t => setForm(p => ({ ...p, full_name: t }))}
              placeholder="Ej: Juan Pérez" placeholderTextColor="#4a6fa5" />

            <Text style={styles.label}>Usuario *</Text>
            <TextInput style={styles.input} value={form.username}
              onChangeText={t => setForm(p => ({ ...p, username: t }))}
              placeholder="usuario123" placeholderTextColor="#4a6fa5" autoCapitalize="none" />

            <Text style={styles.label}>Email *</Text>
            <TextInput style={styles.input} value={form.email}
              onChangeText={t => setForm(p => ({ ...p, email: t }))}
              placeholder="correo@empresa.com" placeholderTextColor="#4a6fa5"
              keyboardType="email-address" autoCapitalize="none" />

            <Text style={styles.label}>
              Contraseña {editingId ? '(dejar vacío para no cambiar)' : '*'}
            </Text>
            <TextInput style={styles.input} value={form.password}
              onChangeText={t => setForm(p => ({ ...p, password: t }))}
              placeholder="••••••••" placeholderTextColor="#4a6fa5" secureTextEntry />

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
                {saving ? <ActivityIndicator color="#0F0F0F" /> : <Text style={styles.saveBtnText}>{editingId ? 'Actualizar' : 'Crear'}</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal reset contraseña */}
      <Modal visible={!!resetModal} animationType="fade" transparent onRequestClose={() => setResetModal(null)}>
        <View style={[styles.overlay, { justifyContent: 'center' }]}>
          <View style={styles.resetBox}>
            <Text style={styles.modalTitle}>Resetear contraseña</Text>
            <Text style={{ color: '#94a3b8', fontSize: 13, marginTop: 4, marginBottom: 16 }}>
              {resetModal?.name}
            </Text>
            <Text style={styles.label}>Nueva contraseña</Text>
            <TextInput
              style={styles.input}
              value={newPw}
              onChangeText={setNewPw}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor="#4a6fa5"
              secureTextEntry
              autoFocus
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setResetModal(null)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, resetSaving && { opacity: 0.5 }]} onPress={handleResetPw} disabled={resetSaving}>
                {resetSaving ? <ActivityIndicator color="#0F0F0F" /> : <Text style={styles.saveBtnText}>Confirmar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#1E3557' },
  newBtn:        { margin: 12, backgroundColor: '#D4AF37', borderRadius: 10, padding: 13, alignItems: 'center' },
  newBtnText:    { color: '#0F0F0F', fontWeight: '700', fontSize: 14 },
  card:          { backgroundColor: '#243D66', borderRadius: 12, padding: 14, marginBottom: 8, elevation: 2 },
  cardRow:       { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 10 },
  avatar:        { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(212,175,55,0.15)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText:    { color: '#D4AF37', fontWeight: '700', fontSize: 15 },
  name:          { fontSize: 14, fontWeight: '700', color: '#f1f5f9' },
  username:      { fontSize: 12, color: '#64748b', fontFamily: 'monospace' },
  email:         { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  right:         { alignItems: 'flex-end', gap: 5 },
  roleBadge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  roleText:      { fontSize: 10, fontWeight: '600' },
  statusBadge:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  btnRow:        { flexDirection: 'row', gap: 8 },
  editBtn:       { flex: 1, backgroundColor: 'rgba(212,175,55,0.15)', paddingVertical: 7, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)' },
  editBtnText:   { fontSize: 12, color: '#D4AF37', fontWeight: '600' },
  resetBtn:      { flex: 1, backgroundColor: 'rgba(96,165,250,0.15)', paddingVertical: 7, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(96,165,250,0.3)' },
  resetBtnText:  { fontSize: 12, color: '#60a5fa', fontWeight: '600' },
  delBtn:        { backgroundColor: 'rgba(239,68,68,0.15)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  delBtnText:    { fontSize: 16, color: '#ef4444', fontWeight: '700' },
  empty:         { textAlign: 'center', color: '#64748b', marginTop: 40 },
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalBox:      { backgroundColor: '#1E3557', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  resetBox:      { backgroundColor: '#243D66', borderRadius: 16, margin: 24, padding: 20 },
  modalHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle:    { fontSize: 17, fontWeight: '700', color: '#f1f5f9' },
  label:         { fontSize: 13, fontWeight: '600', color: '#D4AF37', marginBottom: 6, marginTop: 12 },
  input:         { backgroundColor: '#172A46', borderWidth: 1, borderColor: '#2d4a6e', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#e2e8f0' },
  roleRow:       { gap: 8 },
  roleBtn:       { borderWidth: 1, borderColor: '#2d4a6e', borderRadius: 8, padding: 10, alignItems: 'center', backgroundColor: '#172A46' },
  roleBtnText:   { fontSize: 13, fontWeight: '600', color: '#94a3b8' },
  modalBtns:     { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn:     { flex: 1, borderWidth: 1, borderColor: '#2d4a6e', borderRadius: 10, padding: 13, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#94a3b8' },
  saveBtn:       { flex: 1, backgroundColor: '#D4AF37', borderRadius: 10, padding: 13, alignItems: 'center' },
  saveBtnText:   { color: '#0F0F0F', fontSize: 14, fontWeight: '700' },
})
