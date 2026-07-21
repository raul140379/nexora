import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  Modal, ScrollView, Alert, ActivityIndicator
} from 'react-native'
import { api } from '../services/api'
import { usePermissionsStore } from '../store/permissions.store'

interface Customer {
  id: number; name: string; email: string | null; phone: string | null
  address: string | null; document_type: string | null; document_number: string | null; is_active: boolean
}

const EMPTY = { name: '', email: '', phone: '', address: '', document_type: 'CI', document_number: '' }
const DOC_TYPES = ['CI', 'DNI', 'RUT', 'Pasaporte']

export function CustomersScreen() {
  const { has } = usePermissionsStore()
  const canEdit = has('view_customers')

  const [customers, setCustomers]   = useState<Customer[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [showModal, setShowModal]   = useState(false)
  const [editingId, setEditingId]   = useState<number | null>(null)
  const [form, setForm]             = useState(EMPTY)
  const [saving, setSaving]         = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    api.get('/customers')
      .then(r => { setCustomers(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = customers.filter(c => {
    const q = search.toLowerCase()
    return c.name.toLowerCase().includes(q)
      || (c.email ?? '').toLowerCase().includes(q)
      || (c.phone ?? '').includes(q)
  })

  const openCreate = () => { setEditingId(null); setForm(EMPTY); setShowModal(true) }

  const openEdit = (c: Customer) => {
    setEditingId(c.id)
    setForm({
      name: c.name,
      email: c.email ?? '',
      phone: c.phone ?? '',
      address: c.address ?? '',
      document_type: c.document_type ?? 'CI',
      document_number: c.document_number ?? '',
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { Alert.alert('Error', 'El nombre es obligatorio'); return }
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      document_type: form.document_type || null,
      document_number: form.document_number.trim() || null,
    }
    try {
      if (editingId) { await api.put(`/customers/${editingId}`, payload) }
      else { await api.post('/customers', payload) }
      setShowModal(false)
      load()
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Error al guardar')
    } finally { setSaving(false) }
  }

  const handleDelete = (c: Customer) => {
    Alert.alert('Eliminar cliente', `¿Eliminar a ${c.name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          try { await api.delete(`/customers/${c.id}`); load() }
          catch (err: any) { Alert.alert('Error', err.response?.data?.detail || 'No se pudo eliminar') }
        }
      }
    ])
  }

  const toggleActive = async (c: Customer) => {
    setTogglingId(c.id)
    try {
      await api.put(`/customers/${c.id}`, { is_active: !c.is_active })
      setCustomers(prev => prev.map(x => x.id === c.id ? { ...x, is_active: !c.is_active } : x))
    } catch {
      Alert.alert('Error', 'No se pudo cambiar el estado')
    } finally { setTogglingId(null) }
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar cliente..."
          placeholderTextColor="#4a6fa5"
          value={search}
          onChangeText={setSearch}
        />
        {canEdit && (
          <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
            <Text style={styles.addBtnText}>+ Agregar</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#D4AF37" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={c => String(c.id)}
          ListEmptyComponent={<Text style={styles.empty}>Sin clientes registrados</Text>}
          contentContainerStyle={{ padding: 12, paddingBottom: 30 }}
          renderItem={({ item: c }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{c.name[0].toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{c.name}</Text>
                  {c.email     && <Text style={styles.detail}>{c.email}</Text>}
                  {c.phone     && <Text style={styles.detail}>{c.phone}</Text>}
                  {c.address   && <Text style={styles.detail}>{c.address}</Text>}
                  {c.document_number && (
                    <Text style={styles.detail}>{c.document_type} {c.document_number}</Text>
                  )}
                </View>
                <View style={styles.actions}>
                  {/* Toggle activo */}
                  <TouchableOpacity
                    onPress={() => canEdit && toggleActive(c)}
                    disabled={togglingId === c.id}
                    style={[styles.badge, { backgroundColor: c.is_active ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.1)' }]}
                  >
                    {togglingId === c.id
                      ? <ActivityIndicator size="small" color="#D4AF37" />
                      : <Text style={{ fontSize: 10, color: c.is_active ? '#4ade80' : '#ef4444' }}>
                          {c.is_active ? 'Activo' : 'Inactivo'}
                        </Text>
                    }
                  </TouchableOpacity>

                  {canEdit && (
                    <View style={styles.btnRow}>
                      <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(c)}>
                        <Text style={styles.editBtnText}>Editar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(c)}>
                        <Text style={styles.delBtnText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={styles.overlay}>
          <ScrollView contentContainerStyle={styles.modalBox} keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'Editar cliente' : 'Nuevo cliente'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={{ fontSize: 22, color: '#94a3b8' }}>×</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Nombre *</Text>
            <TextInput style={styles.input} value={form.name}
              onChangeText={t => setForm(p => ({ ...p, name: t }))}
              placeholder="Ej: Juan Pérez" placeholderTextColor="#4a6fa5" />

            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} value={form.email}
              onChangeText={t => setForm(p => ({ ...p, email: t }))}
              placeholder="correo@ejemplo.com" placeholderTextColor="#4a6fa5"
              keyboardType="email-address" autoCapitalize="none" />

            <Text style={styles.label}>Teléfono</Text>
            <TextInput style={styles.input} value={form.phone}
              onChangeText={t => setForm(p => ({ ...p, phone: t }))}
              placeholder="0981 234 567" placeholderTextColor="#4a6fa5" keyboardType="phone-pad" />

            <Text style={styles.label}>Dirección</Text>
            <TextInput style={styles.input} value={form.address}
              onChangeText={t => setForm(p => ({ ...p, address: t }))}
              placeholder="Ej: Av. Siempre Viva 742" placeholderTextColor="#4a6fa5" />

            <Text style={styles.label}>Tipo de documento</Text>
            <View style={styles.segmentRow}>
              {DOC_TYPES.map(dt => (
                <TouchableOpacity key={dt}
                  style={[styles.segment, form.document_type === dt && styles.segmentActive]}
                  onPress={() => setForm(p => ({ ...p, document_type: dt }))}>
                  <Text style={[styles.segmentText, form.document_type === dt && styles.segmentTextActive]}>{dt}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Número de documento</Text>
            <TextInput style={styles.input} value={form.document_number}
              onChangeText={t => setForm(p => ({ ...p, document_number: t }))}
              placeholder="12345678" placeholderTextColor="#4a6fa5" keyboardType="numeric" />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.5 }]} onPress={handleSave} disabled={saving}>
                {saving
                  ? <ActivityIndicator color="#0F0F0F" />
                  : <Text style={styles.saveBtnText}>{editingId ? 'Actualizar' : 'Crear cliente'}</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container:           { flex: 1, backgroundColor: '#1E3557' },
  topBar:              { flexDirection: 'row', padding: 12, gap: 8, alignItems: 'center' },
  searchInput:         { flex: 1, backgroundColor: '#172A46', borderWidth: 1, borderColor: '#2d4a6e', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#e2e8f0' },
  addBtn:              { backgroundColor: '#D4AF37', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  addBtnText:          { color: '#0F0F0F', fontWeight: '700', fontSize: 13 },
  card:                { backgroundColor: '#243D66', borderRadius: 12, padding: 14, marginBottom: 8, elevation: 2 },
  cardTop:             { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  avatar:              { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(212,175,55,0.15)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText:          { color: '#D4AF37', fontWeight: '700', fontSize: 15 },
  name:                { fontSize: 15, fontWeight: '700', color: '#f1f5f9' },
  detail:              { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  actions:             { alignItems: 'flex-end', gap: 6 },
  badge:               { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, minWidth: 56, alignItems: 'center' },
  btnRow:              { flexDirection: 'row', gap: 6 },
  editBtn:             { backgroundColor: 'rgba(212,175,55,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)' },
  editBtnText:         { fontSize: 12, color: '#D4AF37', fontWeight: '600' },
  delBtn:              { backgroundColor: 'rgba(239,68,68,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  delBtnText:          { fontSize: 16, color: '#ef4444', fontWeight: '700' },
  empty:               { textAlign: 'center', color: '#64748b', marginTop: 40 },
  overlay:             { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalBox:            { backgroundColor: '#1E3557', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalHeader:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle:          { fontSize: 17, fontWeight: '700', color: '#f1f5f9' },
  label:               { fontSize: 13, fontWeight: '600', color: '#D4AF37', marginBottom: 6, marginTop: 12 },
  input:               { backgroundColor: '#172A46', borderWidth: 1, borderColor: '#2d4a6e', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#e2e8f0' },
  segmentRow:          { flexDirection: 'row', gap: 6 },
  segment:             { flex: 1, borderWidth: 1, borderColor: '#2d4a6e', borderRadius: 8, padding: 8, alignItems: 'center', backgroundColor: '#172A46' },
  segmentActive:       { backgroundColor: '#D4AF37', borderColor: '#D4AF37' },
  segmentText:         { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
  segmentTextActive:   { color: '#0F0F0F' },
  modalBtns:           { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn:           { flex: 1, borderWidth: 1, borderColor: '#2d4a6e', borderRadius: 10, padding: 13, alignItems: 'center' },
  cancelBtnText:       { fontSize: 14, fontWeight: '600', color: '#94a3b8' },
  saveBtn:             { flex: 1, backgroundColor: '#D4AF37', borderRadius: 10, padding: 13, alignItems: 'center' },
  saveBtnText:         { color: '#0F0F0F', fontSize: 14, fontWeight: '700' },
})
