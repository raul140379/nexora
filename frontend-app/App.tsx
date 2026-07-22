import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, Platform,
} from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Updates from 'expo-updates'
import { useAuthStore, ROLE_LABELS } from './src/store/auth.store'
import { usePermissionsStore } from './src/store/permissions.store'
import { authApi } from './src/services/auth.api'
import { LoginScreen } from './src/screens/LoginScreen'
import { RegisterScreen } from './src/screens/RegisterScreen'
import { HomeScreen } from './src/screens/HomeScreen'
import { ProductsScreen } from './src/screens/ProductsScreen'
import { SalesScreen } from './src/screens/SalesScreen'
import { CustomersScreen } from './src/screens/CustomersScreen'
import { UsersScreen } from './src/screens/UsersScreen'
import { CategoriesScreen } from './src/screens/CategoriesScreen'
import { SalesHistoryScreen } from './src/screens/SalesHistoryScreen'
import { PermissionsScreen } from './src/screens/PermissionsScreen'
import { ChangePasswordScreen } from './src/screens/ChangePasswordScreen'
import { ReportsScreen } from './src/screens/ReportsScreen'

// ─── Navigators ───────────────────────────────────────────────────────────────

const RootStack      = createNativeStackNavigator()
const Tab            = createBottomTabNavigator()
const InicioStack    = createNativeStackNavigator()
const ProductosStack = createNativeStackNavigator()
const VentasStack    = createNativeStackNavigator()
const ClientesStack  = createNativeStackNavigator()
const PerfilStack    = createNativeStackNavigator()

// Estándar: header negro + dorado en todas las pantallas
const HEADER = {
  headerStyle: { backgroundColor: '#0F0F0F' },
  headerTintColor: '#D4AF37',
  headerTitleStyle: { fontWeight: '700' as const, color: '#ffffff' },
  headerShadowVisible: false,
}

// ─── Inicio tab (Home + todas las pantallas accesibles desde Home) ─────────────

function InicioNavigator() {
  return (
    <InicioStack.Navigator screenOptions={HEADER}>
      <InicioStack.Screen name="Home"           component={HomeScreen}         options={{ headerShown: false }} />
      <InicioStack.Screen name="Products"       component={ProductsScreen}     options={{ title: 'Productos' }} />
      <InicioStack.Screen name="Sales"          component={SalesScreen}        options={{ title: 'Nueva Venta' }} />
      <InicioStack.Screen name="Customers"      component={CustomersScreen}    options={{ title: 'Clientes' }} />
      <InicioStack.Screen name="Users"          component={UsersScreen}        options={{ title: 'Usuarios' }} />
      <InicioStack.Screen name="Categories"     component={CategoriesScreen}   options={{ title: 'Categorías' }} />
      <InicioStack.Screen name="SalesHistory"   component={SalesHistoryScreen} options={{ title: 'Historial de ventas' }} />
      <InicioStack.Screen name="Permissions"    component={PermissionsScreen}  options={{ title: 'Permisos y Roles' }} />
      <InicioStack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Cambiar contraseña' }} />
      <InicioStack.Screen name="Reports"        component={ReportsScreen}      options={{ title: 'Reportes' }} />
    </InicioStack.Navigator>
  )
}

// ─── Productos tab ─────────────────────────────────────────────────────────────

function ProductosNavigator() {
  return (
    <ProductosStack.Navigator screenOptions={HEADER}>
      <ProductosStack.Screen name="ProductosList" component={ProductsScreen} options={{ title: 'Productos' }} />
    </ProductosStack.Navigator>
  )
}

// ─── Ventas tab ────────────────────────────────────────────────────────────────

function VentasNavigator() {
  return (
    <VentasStack.Navigator screenOptions={HEADER}>
      <VentasStack.Screen name="SalesMain"    component={SalesScreen}        options={{ title: 'Nueva Venta' }} />
      <VentasStack.Screen name="SalesHistory" component={SalesHistoryScreen} options={{ title: 'Historial de ventas' }} />
    </VentasStack.Navigator>
  )
}

// ─── Pantalla de perfil (inline) ───────────────────────────────────────────────

function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuthStore()
  const role = user?.role ?? 'vendedor'
  const displayName = user?.full_name || user?.email || 'Usuario'
  const initials = displayName.slice(0, 2).toUpperCase()

  const handleLogout = () =>
    Alert.alert('Cerrar sesión', '¿Confirmás?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ])

  return (
    <View style={ps.container}>
      {/* Avatar + info */}
      <View style={ps.avatarBlock}>
        <View style={ps.avatar}>
          <Text style={ps.avatarText}>{initials}</Text>
        </View>
        <Text style={ps.name}>{displayName}</Text>
        <Text style={ps.roleBadge}>{ROLE_LABELS[role] ?? role}</Text>
        {user?.email && <Text style={ps.email}>{user.email}</Text>}
      </View>

      {/* Acciones */}
      <View style={ps.card}>
        <TouchableOpacity style={ps.row} onPress={() => navigation.navigate('ChangePassword')}>
          <View style={ps.iconBox}>
            <Ionicons name="lock-closed-outline" size={20} color="#D4AF37" />
          </View>
          <Text style={ps.rowText}>Cambiar contraseña</Text>
          <Ionicons name="chevron-forward" size={16} color="#4a6fa5" />
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={ps.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#ef4444" />
        <Text style={ps.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  )
}

const ps = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#1E3557' },
  avatarBlock:{ alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20 },
  avatar:     { width: 80, height: 80, borderRadius: 40, backgroundColor: '#D4AF37', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  avatarText: { color: '#0F0F0F', fontSize: 28, fontWeight: '800' },
  name:       { color: '#f1f5f9', fontSize: 20, fontWeight: '700', textAlign: 'center' },
  roleBadge:  { color: '#D4AF37', fontSize: 13, fontWeight: '600', marginTop: 4 },
  email:      { color: '#64748b', fontSize: 12, marginTop: 4 },
  card:       { marginHorizontal: 16, backgroundColor: '#243D66', borderRadius: 14, overflow: 'hidden' },
  row:        { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  iconBox:    { width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(212,175,55,0.1)', alignItems: 'center', justifyContent: 'center' },
  rowText:    { flex: 1, color: '#e2e8f0', fontSize: 15, fontWeight: '500' },
  logoutBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginTop: 12, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 12, padding: 14 },
  logoutText: { color: '#ef4444', fontSize: 15, fontWeight: '600' },
})

// ─── Clientes tab ──────────────────────────────────────────────────────────────

function ClientesNavigator() {
  return (
    <ClientesStack.Navigator screenOptions={HEADER}>
      <ClientesStack.Screen name="ClientesList" component={CustomersScreen} options={{ title: 'Clientes' }} />
    </ClientesStack.Navigator>
  )
}

// ─── Perfil tab ────────────────────────────────────────────────────────────────

function PerfilNavigator() {
  return (
    <PerfilStack.Navigator screenOptions={HEADER}>
      <PerfilStack.Screen name="PerfilMain"     component={ProfileScreen}      options={{ title: 'Mi perfil' }} />
      <PerfilStack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Cambiar contraseña' }} />
    </PerfilStack.Navigator>
  )
}

// ─── Bottom Tab Navigator ──────────────────────────────────────────────────────

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0F0F0F',
          borderTopWidth: 1,
          borderTopColor: 'rgba(212,175,55,0.35)',
          height: Platform.OS === 'ios' ? 82 : 62,
          paddingBottom: Platform.OS === 'ios' ? 26 : 8,
          paddingTop: 8,
          elevation: 16,
        },
        tabBarActiveTintColor: '#D4AF37',
        tabBarInactiveTintColor: '#4a6fa5',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 1 },
      }}
    >
      <Tab.Screen
        name="Inicio"
        component={InicioNavigator}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Productos"
        component={ProductosNavigator}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'cube' : 'cube-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Ventas"
        component={VentasNavigator}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Clientes"
        component={ClientesNavigator}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={PerfilNavigator}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  )
}

// ─── Root App ──────────────────────────────────────────────────────────────────

export default function App() {
  const { setUser, setTokens, isAuthenticated } = useAuthStore()
  const { load: loadPermissions, clear: clearPermissions } = usePermissionsStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const init = async () => {
      // Aplicar OTA update disponible de inmediato (solo en producción)
      if (!__DEV__) {
        try {
          const { isAvailable } = await Updates.checkForUpdateAsync()
          if (isAvailable) {
            await Updates.fetchUpdateAsync()
            await Updates.reloadAsync()
            return
          }
        } catch {}
      }
      try {
        const token = await AsyncStorage.getItem('access_token')
        if (token) {
          setTokens(token, '')
          const user = await authApi.getCurrentUser()
          setUser(user)
          await loadPermissions()
        }
      } catch {
        // sin sesión previa
      } finally {
        setReady(true)
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (!isAuthenticated) clearPermissions()
  }, [isAuthenticated])

  if (!ready) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F0F' }}>
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      </GestureHandlerRootView>
    )
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <RootStack.Navigator screenOptions={{ headerShown: false }}>
            {!isAuthenticated ? (
              <>
                <RootStack.Screen name="Login"    component={LoginScreen} />
                <RootStack.Screen name="Register" component={RegisterScreen} />
              </>
            ) : (
              <RootStack.Screen name="Main" component={MainTabs} />
            )}
          </RootStack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
