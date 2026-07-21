import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, ScrollView
} from 'react-native'
import { api } from '../services/api'

export function ChangePasswordScreen({ navigation }: any) {
  const [currentPw, setCurrentPw]   = useState('')
  const [newPw, setNewPw]           = useState('')
  const [confirmPw, setConfirmPw]   = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew]         = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving]           = useState(false)

  const handleSave = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      Alert.alert('Error', 'Completá todos los campos')
      return
    }
    if (newPw.length < 6) {
      Alert.alert('Error', 'La nueva contraseña debe tener al menos 6 caracteres')
      return
    }
    if (newPw !== confirmPw) {
      Alert.alert('Error', 'Las contraseñas nuevas no coinciden')
      return
    }
    if (newPw === currentPw) {
      Alert.alert('Error', 'La nueva contraseña debe ser diferente a la actual')
      return
    }
    setSaving(true)
    try {
      await api.put('/users/me/password', {
        current_password: currentPw,
        new_password: newPw,
      })
      Alert.alert('✓ Listo', 'Contraseña actualizada correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ])
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'No se pudo actualizar la contraseña')
    } finally {
      setSaving(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#1E3557' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        <View style={styles.card}>
          <Text style={styles.label}>Contraseña actual *</Text>
          <View style={styles.pwWrap}>
            <TextInput style={styles.pwInput} value={currentPw} onChangeText={setCurrentPw}
              placeholder="Tu contraseña actual" placeholderTextColor="#4a6fa5"
              secureTextEntry={!showCurrent} editable={!saving} />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowCurrent(p => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.eyeText}>{showCurrent ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Nueva contraseña *</Text>
          <View style={styles.pwWrap}>
            <TextInput style={styles.pwInput} value={newPw} onChangeText={setNewPw}
              placeholder="Mínimo 6 caracteres" placeholderTextColor="#4a6fa5"
              secureTextEntry={!showNew} editable={!saving} />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowNew(p => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.eyeText}>{showNew ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirmar nueva contraseña *</Text>
          <View style={styles.pwWrap}>
            <TextInput style={styles.pwInput} value={confirmPw} onChangeText={setConfirmPw}
              placeholder="Repetí la nueva contraseña" placeholderTextColor="#4a6fa5"
              secureTextEntry={!showConfirm} editable={!saving} />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm(p => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.eyeText}>{showConfirm ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.btn, saving && { opacity: 0.5 }]} onPress={handleSave} disabled={saving}>
            {saving
              ? <ActivityIndicator color="#0F0F0F" />
              : <Text style={styles.btnText}>Actualizar contraseña</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Por seguridad, necesitás ingresar tu contraseña actual para confirmar el cambio.
          </Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16 },
  card:      { backgroundColor: '#243D66', borderRadius: 14, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  label:     { fontSize: 13, fontWeight: '600', color: '#D4AF37', marginBottom: 6, marginTop: 14 },
  pwWrap:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#172A46', borderWidth: 1, borderColor: '#2d4a6e', borderRadius: 10 },
  pwInput:   { flex: 1, padding: 12, fontSize: 14, color: '#e2e8f0' },
  eyeBtn:    { paddingHorizontal: 14 },
  eyeText:   { fontSize: 16 },
  btn:       { backgroundColor: '#D4AF37', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 24 },
  btnText:   { color: '#0F0F0F', fontSize: 15, fontWeight: '800' },
  infoBox:   { marginTop: 16, backgroundColor: 'rgba(96,165,250,0.08)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.2)', borderRadius: 12, padding: 14 },
  infoText:  { fontSize: 12, color: '#94a3b8', lineHeight: 18 },
})
