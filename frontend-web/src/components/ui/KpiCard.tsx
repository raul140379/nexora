import { useAuthStore, type UserRole } from '../../store/auth.store'
import { usePermissionsStore } from '../../store/permissions.store'

interface KpiCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  desc?: string
  trend?: { value: string; positive: boolean }
  onClick?: () => void
  roles?: UserRole[]
  perm?: string
}

export const KpiCard = ({ label, value, icon, iconBg, iconColor, desc, trend, onClick, roles, perm }: KpiCardProps) => {
  const userRole = useAuthStore(s => s.user?.role)
  const { has } = usePermissionsStore()

  if (roles && userRole && !roles.includes(userRole)) return null
  if (perm && !has(perm)) return null

  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      {...(onClick ? { onClick } : {})}
      className={`bg-[#243D66] rounded-xl p-5 border border-white/5 shadow-sm transition-all duration-200 group text-left w-full
        ${onClick ? 'hover:border-[#D4AF37]/30 hover:shadow-md cursor-pointer' : ''}`}
    >
      <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center mb-4 transition-transform duration-200 ${onClick ? 'group-hover:scale-110' : ''}`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-2xl font-bold text-gray-100 tabular-nums">{value}</p>
          <p className="text-sm font-medium text-gray-300 mt-0.5">{label}</p>
          {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trend.positive ? 'text-green-400 bg-green-900/30' : 'text-red-400 bg-red-900/30'}`}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      {onClick && (
        <div className="h-0.5 w-0 group-hover:w-full bg-[#D4AF37] transition-all duration-300 mt-3 rounded-full" />
      )}
    </Tag>
  )
}
