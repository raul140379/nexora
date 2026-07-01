interface TipProps {
  label: string
  children: React.ReactNode
}

export const Tip = ({ label, children }: TipProps) => (
  <div className="relative group/tip">
    {children}
    <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 bg-[#0F0F0F] text-white text-xs px-2.5 py-1 rounded-md whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 z-20 shadow-xl border border-white/10">
      {label}
    </span>
  </div>
)
