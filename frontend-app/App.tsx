import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { View, ActivityIndicator } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuthStore } from './src/store/auth.store'
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

const Stack = createNativeStackNavigator()

export default function App() {
  const { setUser, setTokens, isAuthenticated } = useAuthStore()
  const { load: loadPermissions, clear: clearPermissions } = usePermissionsStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const init = async () => {
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
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: '#0F0F0F' },
              headerTintColor: '#D4AF37',
              headerTitleStyle: { fontWeight: '700', color: '#fff' },
            }}
          >
            {!isAuthenticated ? (
              <>
                <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
              </>
            ) : (
              <>
                <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Products" component={ProductsScreen} options={{ title: 'Productos' }} />
                <Stack.Screen name="Sales" component={SalesScreen} options={{ title: 'Nueva Venta' }} />
                <Stack.Screen name="Customers" component={CustomersScreen} options={{ title: 'Clientes' }} />
                <Stack.Screen name="Users" component={UsersScreen} options={{ title: 'Usuarios' }} />
                <Stack.Screen name="Categories" component={CategoriesScreen} options={{ title: 'Categorías' }} />
                <Stack.Screen name="SalesHistory" component={SalesHistoryScreen} options={{ title: 'Historial de ventas' }} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
