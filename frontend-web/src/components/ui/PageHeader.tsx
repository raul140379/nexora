import { useAuthStore, type UserRole } from '../../store/auth.store'

interface ActionButton {
  label: string
  onClick: () => void
  /** Solo visible para estos roles. Sin especificar = todos */
  roles?: UserRole[]
  variant?: 'primary' | 'secondary'
  icon?: React.ReactNode
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  actions?: ActionButton[]
}

export const PageHeader = ({ title, subtitle, icon, actions = [] }: PageHeaderProps) => {
  const userRole = useAuthStore(s => s.user?.role)

  const visibleActions = actions.filter(a =>
    !a.roles || (userRole && a.roles.includes(userRole))
  )

  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-10 h-10 bg-[#D4AF37]/15 rounded-xl flex items-center justify-center text-[#D4AF37] flex-shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-100 tracking-tight">{title}</h2>
          {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {visibleActions.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {visibleActions.map((a, i) => (
            <button
              key={i}
              onClick={a.onClick}
              className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-lg transition-all duration-200 ${
                a.variant === 'secondary'
                  ? 'bg-[#172A46] hover:bg-[#1B2A49] text-gray-300 border border-white/10'
                  : 'bg-[#D4AF37] hover:bg-[#B8860B] text-[#0F0F0F] font-semibold shadow-sm hover:shadow-md'
              }`}
            >
              {a.icon && <span>{a.icon}</span>}
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
