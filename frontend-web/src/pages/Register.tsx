import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../services/auth.api'
import toast from 'react-hot-toast'

export function Register() {
  const [form, setForm] = useState({ email: '', username: '', full_name: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirm) { toast.error('Las contraseñas no coinciden'); return }
    setLoading(true)
    try {
      await authApi.register({ email: form.email, username: form.username, password: form.password, full_name: form.full_name })
      toast.success('Cuenta creada. Iniciá sesión.')
      navigate('/login')
    } catch {
      toast.error('Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="El Patrón Shop"
            className="w-20 h-20 rounded-full object-cover ring-2 ring-[#D4AF37]/70 shadow-[0_0_30px_rgba(212,175,55,0.2)] mb-4" />
          <h1 className="text-lg font-bold text-[#D4AF37] tracking-[0.3em]">EL PATRÓN SHOP</h1>
          <p className="text-xs text-[#B8860B] italic mt-1">Sistema de Ventas — Nexora</p>
        </div>

        <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] p-8 shadow-2xl">
          <p className="text-sm font-semibold text-white tracking-wider text-center mb-6">CREAR CUENTA</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            {[
              { name: 'email',      label: 'Email',              type: 'email',    placeholder: 'tu@email.com' },
              { name: 'username',   label: 'Usuario',            type: 'text',     placeholder: 'usuario123' },
              { name: 'full_name',  label: 'Nombre completo',    type: 'text',     placeholder: 'Juan Pérez' },
              { name: 'password',   label: 'Contraseña',         type: 'password', placeholder: '••••••••' },
              { name: 'confirm',    label: 'Confirmar contraseña', type: 'password', placeholder: '••••••••' },
            ].map((f) => (
              <div key={f.name}>
                <label className="block text-xs font-semibold text-[#888] mb-1 uppercase tracking-wider">{f.label}</label>
                <input
                  name={f.name}
                  type={f.type}
                  value={form[f.name as keyof typeof form]}
                  onChange={handleChange}
                  placeholder={f.placeholder}
                  required={f.name !== 'full_name'}
                  className="w-full bg-[#0F0F0F] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors"
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D4AF37] hover:bg-[#B8860B] text-[#0F0F0F] font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 mt-2 tracking-wider text-sm"
            >
              {loading ? 'Registrando...' : 'CREAR CUENTA'}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-[#444]">
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" className="text-[#D4AF37] hover:text-[#B8860B] font-medium transition-colors">
              Iniciá sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
