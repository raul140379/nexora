// Formato de moneda
export const fmt = (v: number | null | undefined) =>
  v != null ? `$${Number(v).toFixed(2)}` : '—'

// Paleta de avatares por inicial
const AVATAR_PALETTE = [
  'bg-blue-900/60 text-blue-300',
  'bg-violet-900/60 text-violet-300',
  'bg-cyan-900/60 text-cyan-300',
  'bg-emerald-900/60 text-emerald-300',
  'bg-amber-900/60 text-amber-300',
  'bg-rose-900/60 text-rose-300',
]
export const avatarCls = (name: string) =>
  AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length]

// Emoji por nombre de categoría / subtipo
export const getNameEmoji = (name: string): string => {
  const t = name.toLowerCase()
  if (/cerveza|beer|lager|pilsener|pils|chopp|malta/.test(t))       return '🍺'
  if (/champagne|espumante|cava|prosecco|brut/.test(t))              return '🍾'
  if (/vino|wine|merlot|cabernet|malbec|tinto|blanco|rosé/.test(t)) return '🍷'
  if (/whisky|whiskey|bourbon|scotch/.test(t))                       return '🥃'
  if (/ron|rum/.test(t))                                             return '🥃'
  if (/vodka/.test(t))                                               return '🍸'
  if (/gin|ginebra/.test(t))                                         return '🍸'
  if (/tequila|mezcal/.test(t))                                      return '🌵'
  if (/licor|liqueur|aguardiente/.test(t))                           return '🥂'
  if (/agua|water/.test(t))                                          return '💧'
  if (/jugo|juice|néctar|nectar/.test(t))                            return '🧃'
  if (/refresco|soda|cola|gaseosa|bebida/.test(t))                   return '🥤'
  if (/snack|papa|chip|galleta|maní/.test(t))                        return '🍿'
  if (/dulce|chocolate|caramelo|confite/.test(t))                    return '🍬'
  if (/café|coffee/.test(t))                                         return '☕'
  if (/leche|milk|lácteo|yogur/.test(t))                             return '🥛'
  if (/tabaco|cigarro|cigarrillo/.test(t))                           return '🚬'
  if (/abarrote|grocerie|alimento|comida/.test(t))                   return '🛒'
  return '📦'
}
