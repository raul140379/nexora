import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { authApi } from '../services/auth.api'
import { useAuthStore } from '../store/auth.store'
import { usePermissionsStore } from '../store/permissions.store'

export function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const { setTokens, setUser } = useAuthStore()
  const { load: loadPermissions } = usePermissionsStore()

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Error', 'Completá todos los campos'); return }
    setLoading(true)
    try {
      const res = await authApi.login({ email, password })
      await AsyncStorage.setItem('access_token', res.access_token)
      await AsyncStorage.setItem('refresh_token', res.refresh_token)
      setTokens(res.access_token, res.refresh_token)
      const user = await authApi.getCurrentUser()
      setUser(user)
      await loadPermissions()
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Email o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      {/* Logo area */}
      <View style={styles.logoArea}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoP}>P</Text>
        </View>
        <Text style={styles.brand}>EL PATRÓN SHOP</Text>
        <Text style={styles.tagline}>Más que un producto, una experiencia.</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.formTitle}>Iniciar sesión</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#555"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
        />
        <View style={styles.pwWrap}>
          <TextInput
            style={styles.pwInput}
            placeholder="Contraseña"
            placeholderTextColor="#555"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPw}
            editable={!loading}
          />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPw(p => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.eyeText}>{showPw ? '🙈' : '👁'}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleLogin} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#0F0F0F" />
            : <Text style={styles.btnText}>Confirmar</Text>}
        </TouchableOpacity>
      </View>

      <Text style={styles.powered}>Powered by Nexora</Text>
    </KeyboardAvoidingView>
  )
}

const GOLD = '#D4AF37'
const BLACK = '#0F0F0F'
const CARD  = '#1A1A1A'

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: BLACK, justifyContent: 'center', paddingHorizontal: 28 },
  logoArea:     { alignItems: 'center', marginBottom: 36 },
  logoCircle:   { width: 100, height: 100, borderRadius: 50, backgroundColor: CARD, borderWidth: 2, borderColor: GOLD, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoP:        { fontSize: 52, fontWeight: '900', color: GOLD },
  brand:        { fontSize: 22, fontWeight: '800', color: GOLD, letterSpacing: 3, textAlign: 'center' },
  tagline:      { fontSize: 12, color: '#B8860B', fontStyle: 'italic', marginTop: 6, textAlign: 'center' },
  form:         { backgroundColor: CARD, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#2a2a2a' },
  formTitle:    { fontSize: 16, fontWeight: '700', color: '#ccc', marginBottom: 18, textAlign: 'center', letterSpacing: 1 },
  input:        { borderWidth: 1, borderColor: '#333', borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 15, color: '#fff', backgroundColor: BLACK },
  btn:          { backgroundColor: GOLD, borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 4 },
  btnDisabled:  { opacity: 0.6 },
  btnText:      { color: BLACK, fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  powered:      { textAlign: 'center', color: '#333', fontSize: 11, marginTop: 28 },
  pwWrap:        { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#333', borderRadius: 10, backgroundColor: BLACK, marginBottom: 12 },
  pwInput:       { flex: 1, padding: 14, fontSize: 15, color: '#fff' },
  eyeBtn:        { paddingHorizontal: 14 },
  eyeText:       { fontSize: 16 },
  registerLink:  { textAlign: 'center', color: '#B8860B', fontSize: 13, textDecorationLine: 'underline' },
})
