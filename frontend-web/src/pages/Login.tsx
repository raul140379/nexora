import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../services/auth.api'
import { useAuthStore } from '../store/auth.store'
import toast from 'react-hot-toast'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { setTokens, setUser } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authApi.login({ email, password })
      localStorage.setItem('access_token', res.access_token)
      localStorage.setItem('refresh_token', res.refresh_token)
      setTokens(res.access_token, res.refresh_token)
      setUser({ id: 0, email, username: '', full_name: '', role: 'vendedor', is_active: true, created_at: '', updated_at: '' })
      navigate('/', { replace: true })
      authApi.getCurrentUser().then(setUser).catch(() => {})
    } catch {
      toast.error('Email o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo + Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-5">
            <img src="/logo.png" alt="El Patrón Shop"
              className="w-28 h-28 rounded-full object-cover ring-2 ring-[#D4AF37]/70 shadow-[0_0_40px_rgba(212,175,55,0.25)]" />
          </div>
          <h1 className="text-xl font-bold text-[#D4AF37] tracking-[0.3em] mb-1">EL PATRÓN SHOP</h1>
          <p className="text-xs text-[#B8860B] italic">Más que un producto, una experiencia.</p>
        </div>

        {/* Form card */}
        <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <p className="text-sm font-semibold text-white tracking-wider">SISTEMA DE VENTAS</p>
            <p className="text-xs text-[#555] mt-1">la transformación digital que te guía</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#888] mb-1.5 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#0F0F0F] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#888] mb-1.5 uppercase tracking-wider">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#0F0F0F] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D4AF37] hover:bg-[#B8860B] text-[#0F0F0F] font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 mt-2 tracking-wider text-sm"
            >
              {loading ? 'Ingresando...' : 'INICIAR SESIÓN'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-[#444]">
            ¿No tenés cuenta?{' '}
            <Link to="/register" className="text-[#D4AF37] hover:text-[#B8860B] font-medium transition-colors">
              Registrate
            </Link>
          </p>
        </div>

        <p className="text-center text-[10px] text-[#333] mt-6 tracking-widest">
          NEXORA · el impulso hacia el futuro
        </p>
      </div>
    </div>
  )
}
