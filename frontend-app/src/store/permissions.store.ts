import { create } from 'zustand'
import { api } from '../services/api'

interface PermissionsState {
  perms: Record<string, boolean>
  loaded: boolean
  load: () => Promise<void>
  clear: () => void
  has: (key: string) => boolean
}

export const usePermissionsStore = create<PermissionsState>((set, get) => ({
  perms: {},
  loaded: false,
  load: async () => {
    try {
      const { data } = await api.get<Record<string, boolean>>('/permissions/me')
      set({ perms: data, loaded: true })
    } catch {
      set({ loaded: true })
    }
  },
  clear: () => set({ perms: {}, loaded: false }),
  has: (key: string) => get().perms[key] ?? false,
}))
