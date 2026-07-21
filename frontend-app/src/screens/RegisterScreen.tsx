import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, ScrollView
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { authApi } from '../services/auth.api'
import { useAuthStore } from '../store/auth.store'
import { usePermissionsStore } from '../store/permissions.store'

export function RegisterScreen({ navigation }: any) {
  const [fullName, setFullName]   = useState('')
  const [username, setUsername]   = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [showCf, setShowCf]       = useState(false)
  const [loading, setLoading]     = useState(false)

  const { setTokens, setUser } = useAuthStore()
  const { load: loadPermissions } = usePermissionsStore()

  const handleRegister = async () => {
    if (!fullName.trim() || !username.trim() || !email.trim() || !password) {
      Alert.alert('Error', 'Completá todos los campos obligatorios')
      return
    }
    if (password !== confirm) {
      Alert.alert('Error', 'Las contraseñas no coinciden')
      return
    }
    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres')
      return
    }
    setLoading(true)
    try {
      const res = await authApi.register({
        full_name: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
      })
      await AsyncStorage.setItem('access_token', res.access_token)
      await AsyncStorage.setItem('refresh_token', res.refresh_token)
      setTokens(res.access_token, res.refresh_token)
      const user = await authApi.getCurrentUser()
      setUser(user)
      await loadPermissions()
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'No se pudo crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: BLACK }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoP}>P</Text>
          </View>
          <Text style={styles.brand}>EL PATRÓN SHOP</Text>
          <Text style={styles.tagline}>Crear cuenta</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Nombre completo *</Text>
          <TextInput style={styles.input} value={fullName} onChangeText={setFullName}
            placeholder="Ej: Juan Pérez" placeholderTextColor="#555" editable={!loading} />

          <Text style={styles.label}>Usuario *</Text>
          <TextInput style={styles.input} value={username} onChangeText={setUsername}
            placeholder="Ej: jperez" placeholderTextColor="#555" autoCapitalize="none" editable={!loading} />

          <Text style={styles.label}>Email *</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail}
            placeholder="correo@ejemplo.com" placeholderTextColor="#555"
            keyboardType="email-address" autoCapitalize="none" editable={!loading} />

          <Text style={styles.label}>Contraseña *</Text>
          <View style={styles.pwWrap}>
            <TextInput style={styles.pwInput} value={password} onChangeText={setPassword}
              placeholder="Mínimo 6 caracteres" placeholderTextColor="#555"
              secureTextEntry={!showPw} editable={!loading} />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPw(p => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.eyeText}>{showPw ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirmar contraseña *</Text>
          <View style={styles.pwWrap}>
            <TextInput style={styles.pwInput} value={confirm} onChangeText={setConfirm}
              placeholder="Repetí la contraseña" placeholderTextColor="#555"
              secureTextEntry={!showCf} editable={!loading} />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowCf(p => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.eyeText}>{showCf ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleRegister} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#0F0F0F" />
              : <Text style={styles.btnText}>Crear cuenta</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          <Text style={styles.backText}>¿Ya tenés cuenta? Iniciá sesión</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const GOLD  = '#D4AF37'
const BLACK = '#0F0F0F'
const CARD  = '#1A1A1A'

const styles = StyleSheet.create({
  container:  { flexGrow: 1, backgroundColor: BLACK, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 40 },
  logoArea:   { alignItems: 'center', marginBottom: 28 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: CARD, borderWidth: 2, borderColor: GOLD, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoP:      { fontSize: 42, fontWeight: '900', color: GOLD },
  brand:      { fontSize: 20, fontWeight: '800', color: GOLD, letterSpacing: 3, textAlign: 'center' },
  tagline:    { fontSize: 13, color: '#B8860B', fontStyle: 'italic', marginTop: 4, textAlign: 'center' },
  form:       { backgroundColor: CARD, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#2a2a2a' },
  label:      { fontSize: 12, fontWeight: '600', color: GOLD, marginBottom: 5, marginTop: 12 },
  input:      { borderWidth: 1, borderColor: '#333', borderRadius: 10, padding: 13, fontSize: 14, color: '#fff', backgroundColor: BLACK, marginBottom: 0 },
  pwWrap:     { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#333', borderRadius: 10, backgroundColor: BLACK },
  pwInput:    { flex: 1, padding: 13, fontSize: 14, color: '#fff' },
  eyeBtn:     { paddingHorizontal: 14 },
  eyeText:    { fontSize: 16 },
  btn:        { backgroundColor: GOLD, borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 20 },
  btnText:    { color: BLACK, fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  backText:   { textAlign: 'center', color: '#555', fontSize: 13 },
})
