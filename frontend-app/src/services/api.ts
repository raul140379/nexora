import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuthStore } from '../store/auth.store'

export const API_URL = 'https://nexora-production-5740.up.railway.app/api/v1'

export const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use(async (config) => {
  const token = useAuthStore.getState().accessToken
    || await AsyncStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await useAuthStore.getState().logout()
    }
    return Promise.reject(error)
  }
)
