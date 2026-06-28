import { api } from './api'

interface LoginRequest { email: string; password: string }
interface RegisterRequest { email: string; username: string; password: string; full_name?: string }
interface TokenResponse { access_token: string; refresh_token: string; token_type: string }

class AuthAPI {
  async login(credentials: LoginRequest): Promise<TokenResponse> {
    const res = await api.post('/auth/login', credentials)
    return res.data
  }

  async register(data: RegisterRequest): Promise<void> {
    await api.post('/auth/register', data)
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const res = await api.post('/auth/refresh', { refresh_token: refreshToken })
    return res.data
  }

  async logout(): Promise<void> {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  async getCurrentUser() {
    const res = await api.get('/auth/me')
    return res.data
  }
}

export const authApi = new AuthAPI()
