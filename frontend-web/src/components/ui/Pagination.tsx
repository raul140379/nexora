interface Props {
  page: number
  pageSize: number
  total: number
  onChange: (p: number) => void
}

export function Pagination({ page, pageSize, total, onChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null

  const pages: (number | '…')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…')
    }
  }

  const btn = (label: React.ReactNode, target: number, disabled: boolean, active = false) => (
    <button
      key={String(label)}
      onClick={() => !disabled && onChange(target)}
      disabled={disabled}
      className={`min-w-[34px] h-8 px-2 rounded-lg text-sm font-medium transition-all duration-150 ${
        active
          ? 'bg-[#D4AF37] text-[#0F0F0F] font-semibold'
          : disabled
            ? 'text-gray-600 cursor-not-allowed'
            : 'text-gray-400 hover:text-gray-100 hover:bg-[#1E3557]'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <p className="text-xs text-gray-500">
        {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} de {total}
      </p>
      <div className="flex items-center gap-1">
        {btn('‹', page - 1, page === 1)}
        {pages.map((p, i) =>
          p === '…'
            ? <span key={`e${i}`} className="text-gray-600 px-1 text-sm">…</span>
            : btn(p, p as number, false, p === page)
        )}
        {btn('›', page + 1, page === totalPages)}
      </div>
    </div>
  )
}
