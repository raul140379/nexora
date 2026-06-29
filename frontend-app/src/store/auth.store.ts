import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type UserRole = 'admin' | 'ejecutivo' | 'vendedor'

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  ejecutivo: 'Ejecutivo de Ventas',
  vendedor: 'Vendedor Asistente',
}

interface User {
  id: number
  email: string
  username: string
  full_name?: string
  role: UserRole
  is_active: boolean
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  setTokens: (access: string, refresh: string) => void
  logout: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setTokens: (accessToken) => set({ accessToken }),

  logout: async () => {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token'])
    set({ user: null, accessToken: null, isAuthenticated: false })
  },

  initialize: async () => {
    const token = await AsyncStorage.getItem('access_token')
    if (token) set({ accessToken: token, isAuthenticated: true })
  },
}))
