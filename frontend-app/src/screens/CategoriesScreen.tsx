import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator
} from 'react-native'
import { api } from '../services/api'
import { useAuthStore } from '../store/auth.store'

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

  // --- Categoría ---
  const openCreateCat = () => { setEditingCatId(null); setCatForm({ name: '', description: '' }); setShowCatModal(true) }
  const openEditCat = (c: Category) => { setEditingCatId(c.id); setCatForm({ name: c.name, description: c.description ?? '' }); setShowCatModal(true) }

  const handleSaveCat = async () => {
    if (!catForm.name.trim()) { Alert.alert('Error', 'El nombre es obligatorio'); return }
    setSavingCat(true)
    try {
      const payload = { name: catForm.name.trim(), description: catForm.description.trim() || null }
      if (editingCatId) { await api.put(`/categories/${editingCatId}`, payload) }
      else { await api.post('/categories', payload) }
      setShowCatModal(false); load()
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Error al guardar')
    } finally { setSavingCat(false) }
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

  // --- Subcategoría ---
  const openCreateSub = (categoryId: number) => { setEditingSubId(null); setSubForm({ name: '', category_id: categoryId }); setShowSubModal(true) }
  const openEditSub = (s: Subcategory) => { setEditingSubId(s.id); setSubForm({ name: s.name, category_id: s.category_id }); setShowSubModal(true) }

  const handleSaveSub = async () => {
    if (!subForm.name.trim()) { Alert.alert('Error', 'El nombre es obligatorio'); return }
    setSavingSub(true)
    try {
      if (editingSubId) { await api.put(`/subcategories/${editingSubId}`, { name: subForm.name.trim() }) }
      else { await api.post('/subcategories', { name: subForm.name.trim(), category_id: subForm.category_id }) }
      setShowSubModal(false); load()
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Error al guardar')
    } finally { setSavingSub(false) }
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
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
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
                          <Text style={styles.subChipText}>{s.name}</Text>
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
                <Text style={{ fontSize: 22, color: '#6b7280' }}>×</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.label}>Nombre *</Text>
            <TextInput style={styles.input} value={catForm.name}
              onChangeText={t => setCatForm(p => ({ ...p, name: t }))}
              placeholder="Ej: Licores" placeholderTextColor="#9ca3af" autoFocus />
            <Text style={styles.label}>Descripción</Text>
            <TextInput style={styles.input} value={catForm.description}
              onChangeText={t => setCatForm(p => ({ ...p, description: t }))}
              placeholder="Opcional" placeholderTextColor="#9ca3af" />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCatModal(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, savingCat && { opacity: 0.5 }]} onPress={handleSaveCat} disabled={savingCat}>
                {savingCat ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{editingCatId ? 'Actualizar' : 'Crear'}</Text>}
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
                <Text style={{ fontSize: 22, color: '#6b7280' }}>×</Text>
              </TouchableOpacity>
            </View>
            {!editingSubId && (
              <Text style={styles.catRefLabel}>
                Categoría: <Text style={{ color: '#2563eb', fontWeight: '700' }}>
                  {categories.find(c => c.id === subForm.category_id)?.name}
                </Text>
              </Text>
            )}
            <Text style={styles.label}>Nombre *</Text>
            <TextInput style={styles.input} value={subForm.name}
              onChangeText={t => setSubForm(p => ({ ...p, name: t }))}
              placeholder="Ej: Vodka" placeholderTextColor="#9ca3af" autoFocus />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowSubModal(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, savingSub && { opacity: 0.5 }]} onPress={handleSaveSub} disabled={savingSub}>
                {savingSub ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{editingSubId ? 'Actualizar' : 'Crear'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  newBtn: { margin: 12, backgroundColor: '#2563eb', borderRadius: 10, padding: 13, alignItems: 'center' },
  newBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  catName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  catDesc: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  btnRow: { flexDirection: 'row', gap: 6 },
  editBtn: { backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  editBtnText: { fontSize: 12, color: '#2563eb', fontWeight: '600' },
  delBtn: { backgroundColor: '#fef2f2', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  delBtnText: { fontSize: 16, color: '#ef4444', fontWeight: '700' },
  subSection: { borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10 },
  subHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subTitle: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  addSubText: { fontSize: 12, color: '#2563eb', fontWeight: '700' },
  subList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  subChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, gap: 4 },
  subChipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  subChipBtns: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  subEditText: { fontSize: 12, color: '#2563eb' },
  subDelText: { fontSize: 18, color: '#ef4444', fontWeight: '700', lineHeight: 20 },
  noSubs: { fontSize: 12, color: '#9ca3af', fontStyle: 'italic' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  catRefLabel: { fontSize: 13, color: '#374151', marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827' },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 13, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  saveBtn: { flex: 1, backgroundColor: '#2563eb', borderRadius: 10, padding: 13, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
})
