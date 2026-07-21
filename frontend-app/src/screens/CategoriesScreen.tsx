import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator
} from 'react-native'
import { api } from '../services/api'
import { useAuthStore } from '../store/auth.store'
import { getNameEmoji } from '../utils/helpers'

interface Subcategory { id: number; name: string; category_id: number }
interface Category { id: number; name: string; description: string | null }

export function CategoriesScreen() {
  const { user } = useAuthStore()
  const canEdit = user?.role === 'admin' || user?.role === 'ejecutivo'

  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [loading, setLoading] = useState(true)

  const [showCatModal, setShowCatModal] = useState(false)
  const [editingCatId, setEditingCatId] = useState<number | null>(null)
  const [catForm, setCatForm] = useState({ name: '', description: '' })
  const [savingCat, setSavingCat] = useState(false)

  const [showSubModal, setShowSubModal] = useState(false)
  const [editingSubId, setEditingSubId] = useState<number | null>(null)
  const [subForm, setSubForm] = useState({ name: '', category_id: 0 })
  const [savingSub, setSavingSub] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([api.get('/categories'), api.get('/subcategories')])
      .then(([cr, sr]) => { setCategories(cr.data); setSubcategories(sr.data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const getSubs = (catId: number) => subcategories.filter(s => s.category_id === catId)

  const openCreateCat = () => { setEditingCatId(null); setCatForm({ name: '', description: '' }); setShowCatModal(true) }
  const openEditCat = (c: Category) => { setEditingCatId(c.id); setCatForm({ name: c.name, description: c.description ?? '' }); setShowCatModal(true) }

  const handleSaveCat = async () => {
    if (!catForm.name.trim()) { Alert.alert('Error', 'El nombre es obligatorio'); return }
    setSavingCat(true)
    try {
      const payload = { name: catForm.name.trim(), description: catForm.description.trim() || null }
      if (editingCatId) { await api.put(`/categories/${editingCatId}`, payload) }
      else { await api.post('/categories', payload) }
      setShowCatModal(false)
      Alert.alert('✓ Guardado', editingCatId ? 'Categoría actualizada correctamente' : 'Categoría creada correctamente')
    } catch (err: any) {
      const status = err.response?.status
      const rawDetail = err.response?.data?.detail
      const detail = typeof rawDetail === 'string' ? rawDetail
        : rawDetail ? JSON.stringify(rawDetail)
        : err.message || 'No se pudo conectar al servidor'
      Alert.alert(`Error${status ? ` ${status}` : ''}`, detail)
    } finally {
      setSavingCat(false)
      load()
    }
  }

  const handleDeleteCat = (c: Category) => {
    Alert.alert('Eliminar categoría', `¿Eliminar "${c.name}"? También se eliminarán sus subcategorías.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try { await api.delete(`/categories/${c.id}`); load() }
        catch (err: any) { Alert.alert('Error', err.response?.data?.detail || 'No se pudo eliminar') }
      }}
    ])
  }

  const openCreateSub = (categoryId: number) => { setEditingSubId(null); setSubForm({ name: '', category_id: categoryId }); setShowSubModal(true) }
  const openEditSub = (s: Subcategory) => { setEditingSubId(s.id); setSubForm({ name: s.name, category_id: s.category_id }); setShowSubModal(true) }

  const handleSaveSub = async () => {
    if (!subForm.name.trim()) { Alert.alert('Error', 'El nombre es obligatorio'); return }
    setSavingSub(true)
    try {
      if (editingSubId) { await api.put(`/subcategories/${editingSubId}`, { name: subForm.name.trim() }) }
      else { await api.post('/subcategories', { name: subForm.name.trim(), category_id: subForm.category_id }) }
      setShowSubModal(false)
      Alert.alert('✓ Guardado', editingSubId ? 'Subcategoría actualizada correctamente' : 'Subcategoría creada correctamente')
    } catch (err: any) {
      const status = err.response?.status
      const rawDetail = err.response?.data?.detail
      const detail = typeof rawDetail === 'string' ? rawDetail
        : rawDetail ? JSON.stringify(rawDetail)
        : err.message || 'No se pudo conectar al servidor'
      Alert.alert(`Error${status ? ` ${status}` : ''}`, detail)
    } finally {
      setSavingSub(false)
      load()
    }
  }

  const handleDeleteSub = (s: Subcategory) => {
    Alert.alert('Eliminar subcategoría', `¿Eliminar "${s.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try { await api.delete(`/subcategories/${s.id}`); load() }
        catch (err: any) { Alert.alert('Error', err.response?.data?.detail || 'No se pudo eliminar') }
      }}
    ])
  }

  return (
    <View style={styles.container}>
      {canEdit && (
        <TouchableOpacity style={styles.newBtn} onPress={openCreateCat}>
          <Text style={styles.newBtnText}>+ Nueva categoría</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#D4AF37" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={c => String(c.id)}
          ListEmptyComponent={<Text style={styles.empty}>Sin categorías registradas</Text>}
          contentContainerStyle={{ padding: 12, paddingBottom: 30 }}
          renderItem={({ item: cat }) => {
            const subs = getSubs(cat.id)
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.catEmoji}>
                    <Text style={{ fontSize: 20 }}>{getNameEmoji(cat.name)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.catName}>{cat.name}</Text>
                    {cat.description && <Text style={styles.catDesc}>{cat.description}</Text>}
                  </View>
                  {canEdit && (
                    <View style={styles.btnRow}>
                      <TouchableOpacity style={styles.editBtn} onPress={() => openEditCat(cat)}>
                        <Text style={styles.editBtnText}>Editar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.delBtn} onPress={() => handleDeleteCat(cat)}>
                        <Text style={styles.delBtnText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                <View style={styles.subSection}>
                  <View style={styles.subHeader}>
                    <Text style={styles.subTitle}>Subcategorías ({subs.length})</Text>
                    {canEdit && (
                      <TouchableOpacity onPress={() => openCreateSub(cat.id)}>
                        <Text style={styles.addSubText}>+ Agregar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {subs.length > 0 ? (
                    <View style={styles.subList}>
                      {subs.map(s => (
                        <View key={s.id} style={styles.subChip}>
                          <Text style={styles.subChipText}>{getNameEmoji(s.name)} {s.name}</Text>
                          {canEdit && (
                            <View style={styles.subChipBtns}>
                              <TouchableOpacity onPress={() => openEditSub(s)}>
                                <Text style={styles.subEditText}>✏</Text>
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => handleDeleteSub(s)}>
                                <Text style={styles.subDelText}>×</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.noSubs}>Sin subcategorías</Text>
                  )}
                </View>
              </View>
            )
          }}
        />
      )}

      {/* Modal categoría */}
      <Modal visible={showCatModal} animationType="slide" transparent onRequestClose={() => setShowCatModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingCatId ? 'Editar categoría' : 'Nueva categoría'}</Text>
              <TouchableOpacity onPress={() => setShowCatModal(false)}>
                <Text style={{ fontSize: 22, color: '#94a3b8' }}>×</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.label}>Nombre *</Text>
            <TextInput style={styles.input} value={catForm.name}
              onChangeText={t => setCatForm(p => ({ ...p, name: t }))}
              placeholder="Ej: Licores" placeholderTextColor="#4a6fa5" autoFocus />
            <Text style={styles.label}>Descripción</Text>
            <TextInput style={styles.input} value={catForm.description}
              onChangeText={t => setCatForm(p => ({ ...p, description: t }))}
              placeholder="Opcional" placeholderTextColor="#4a6fa5" />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCatModal(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, savingCat && { opacity: 0.5 }]} onPress={handleSaveCat} disabled={savingCat}>
                {savingCat ? <ActivityIndicator color="#0F0F0F" /> : <Text style={styles.saveBtnText}>{editingCatId ? 'Actualizar' : 'Crear'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal subcategoría */}
      <Modal visible={showSubModal} animationType="slide" transparent onRequestClose={() => setShowSubModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingSubId ? 'Editar subcategoría' : 'Nueva subcategoría'}</Text>
              <TouchableOpacity onPress={() => setShowSubModal(false)}>
                <Text style={{ fontSize: 22, color: '#94a3b8' }}>×</Text>
              </TouchableOpacity>
            </View>
            {!editingSubId && (
              <Text style={styles.catRefLabel}>
                Categoría: <Text style={{ color: '#D4AF37', fontWeight: '700' }}>
                  {getNameEmoji(categories.find(c => c.id === subForm.category_id)?.name ?? '')} {categories.find(c => c.id === subForm.category_id)?.name}
                </Text>
              </Text>
            )}
            <Text style={styles.label}>Nombre *</Text>
            <TextInput style={styles.input} value={subForm.name}
              onChangeText={t => setSubForm(p => ({ ...p, name: t }))}
              placeholder="Ej: Vodka" placeholderTextColor="#4a6fa5" autoFocus />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowSubModal(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, savingSub && { opacity: 0.5 }]} onPress={handleSaveSub} disabled={savingSub}>
                {savingSub ? <ActivityIndicator color="#0F0F0F" /> : <Text style={styles.saveBtnText}>{editingSubId ? 'Actualizar' : 'Crear'}</Text>}
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
  card:          { backgroundColor: '#243D66', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2 },
  cardHeader:    { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 10 },
  catEmoji:      { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(212,175,55,0.1)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  catName:       { fontSize: 15, fontWeight: '700', color: '#f1f5f9' },
  catDesc:       { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  btnRow:        { flexDirection: 'row', gap: 6 },
  editBtn:       { backgroundColor: 'rgba(212,175,55,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)' },
  editBtnText:   { fontSize: 12, color: '#D4AF37', fontWeight: '600' },
  delBtn:        { backgroundColor: 'rgba(239,68,68,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  delBtnText:    { fontSize: 16, color: '#ef4444', fontWeight: '700' },
  subSection:    { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: 10 },
  subHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subTitle:      { fontSize: 12, fontWeight: '600', color: '#64748b' },
  addSubText:    { fontSize: 12, color: '#D4AF37', fontWeight: '700' },
  subList:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  subChip:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#172A46', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, gap: 4, borderWidth: 1, borderColor: '#2d4a6e' },
  subChipText:   { fontSize: 13, color: '#cbd5e1', fontWeight: '500' },
  subChipBtns:   { flexDirection: 'row', gap: 4, alignItems: 'center' },
  subEditText:   { fontSize: 12, color: '#D4AF37' },
  subDelText:    { fontSize: 18, color: '#ef4444', fontWeight: '700', lineHeight: 20 },
  noSubs:        { fontSize: 12, color: '#64748b', fontStyle: 'italic' },
  empty:         { textAlign: 'center', color: '#64748b', marginTop: 40 },
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalBox:      { backgroundColor: '#1E3557', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle:    { fontSize: 17, fontWeight: '700', color: '#f1f5f9' },
  catRefLabel:   { fontSize: 13, color: '#94a3b8', marginBottom: 8 },
  label:         { fontSize: 13, fontWeight: '600', color: '#D4AF37', marginBottom: 6, marginTop: 12 },
  input:         { backgroundColor: '#172A46', borderWidth: 1, borderColor: '#2d4a6e', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#e2e8f0' },
  modalBtns:     { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn:     { flex: 1, borderWidth: 1, borderColor: '#2d4a6e', borderRadius: 10, padding: 13, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#94a3b8' },
  saveBtn:       { flex: 1, backgroundColor: '#D4AF37', borderRadius: 10, padding: 13, alignItems: 'center' },
  saveBtnText:   { color: '#0F0F0F', fontSize: 14, fontWeight: '700' },
})
