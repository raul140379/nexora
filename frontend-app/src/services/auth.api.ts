import AsyncStorage from '@react-native-async-storage/async-storage'
import { api } from './api'

interface LoginRequest { email: string; password: string }
interface TokenResponse { access_token: string; refresh_token: string; token_type: string }

class AuthAPI {
  async login(credentials: LoginRequest): Promise<TokenResponse> {
    const res = await api.post('/auth/login', credentials)
    return res.data
  }

  async getCurrentUser() {
    const res = await api.get('/auth/me')
    return res.data
  }

  async logout() {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token'])
  }
}

export const authApi = new AuthAPI()
