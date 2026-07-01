type StatusVariant = 'active' | 'inactive' | 'low_stock' | 'no_stock' | 'completed' | 'pending' | 'cancelled'

const CONFIG: Record<StatusVariant, { label: string; dot: string; bg: string; text: string; border: string; pulse?: boolean }> = {
  active:    { label: 'Activo',     dot: 'bg-green-500',  bg: 'bg-green-900/30',  text: 'text-green-400',  border: 'border-green-800/30' },
  inactive:  { label: 'Inactivo',   dot: 'bg-gray-500',   bg: 'bg-gray-700/40',   text: 'text-gray-400',   border: 'border-gray-600/30' },
  low_stock: { label: 'Stock Bajo', dot: 'bg-orange-500', bg: 'bg-orange-900/30', text: 'text-orange-400', border: 'border-orange-800/30' },
  no_stock:  { label: 'Sin Stock',  dot: 'bg-red-500',    bg: 'bg-red-900/30',    text: 'text-red-400',    border: 'border-red-800/30', pulse: true },
  completed: { label: 'Completado', dot: 'bg-blue-500',   bg: 'bg-blue-900/30',   text: 'text-blue-400',   border: 'border-blue-800/30' },
  pending:   { label: 'Pendiente',  dot: 'bg-yellow-500', bg: 'bg-yellow-900/30', text: 'text-yellow-400', border: 'border-yellow-800/30', pulse: true },
  cancelled: { label: 'Cancelado',  dot: 'bg-red-500',    bg: 'bg-red-900/30',    text: 'text-red-400',    border: 'border-red-800/30' },
}

interface StatusBadgeProps {
  variant: StatusVariant
  label?: string
}

export const StatusBadge = ({ variant, label }: StatusBadgeProps) => {
  const c = CONFIG[variant]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} ${c.pulse ? 'animate-pulse' : ''}`} />
      {label ?? c.label}
    </span>
  )
}
