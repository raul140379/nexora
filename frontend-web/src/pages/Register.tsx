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
    if (form.password !== form.confirm) {
      toast.error('Las contraseñas no coinciden')
      return
    }
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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Nexora</h1>
        <p className="text-gray-500 mb-8">Creá tu cuenta</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { name: 'email', label: 'Email', type: 'email', placeholder: 'tu@email.com' },
            { name: 'username', label: 'Usuario', type: 'text', placeholder: 'usuario123' },
            { name: 'full_name', label: 'Nombre completo', type: 'text', placeholder: 'Juan Pérez' },
            { name: 'password', label: 'Contraseña', type: 'password', placeholder: '••••••••' },
            { name: 'confirm', label: 'Confirmar contraseña', type: 'password', placeholder: '••••••••' },
          ].map((f) => (
            <div key={f.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input
                name={f.name}
                type={f.type}
                value={form[f.name as keyof typeof form]}
                onChange={handleChange}
                placeholder={f.placeholder}
                required={f.name !== 'full_name'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
