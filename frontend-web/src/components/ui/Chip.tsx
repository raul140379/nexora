interface ChipProps {
  active: boolean
  gold?: boolean
  onClick: () => void
  children: React.ReactNode
}

export const Chip = ({ active, gold = true, onClick, children }: ChipProps) => (
  <button
    onClick={onClick}
    className={`text-xs font-medium px-3.5 py-1.5 rounded-full border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] ${
      active
        ? gold
          ? 'bg-[#D4AF37] text-[#0F0F0F] border-transparent font-semibold shadow-sm'
          : 'bg-[#1B2A49] text-white border-white/20'
        : 'bg-[#172A46] text-gray-400 border-white/10 hover:border-[#D4AF37]/40 hover:text-gray-200'
    }`}
  >
    {children}
  </button>
)
