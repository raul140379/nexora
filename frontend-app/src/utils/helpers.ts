const EMOJI_MAP: Record<string, string> = {
  cerveza: '🍺', beer: '🍺',
  vino: '🍷', wine: '🍷',
  licor: '🥃', licores: '🥃', whisky: '🥃', whiskey: '🥃', ron: '🥃',
  vodka: '🍸', gin: '🍸', ginebra: '🍸', pisco: '🥃',
  champagne: '🍾', espumante: '🍾',
  agua: '💧',
  jugo: '🧃', jugos: '🧃',
  gaseosa: '🥤', gaseosas: '🥤', refresco: '🥤', refrescos: '🥤',
  soda: '🥤', sodas: '🥤',
  energizante: '⚡', energizantes: '⚡',
  café: '☕', cafe: '☕', coffee: '☕',
  té: '🍵', te: '🍵',
  leche: '🥛',
  snack: '🍿', snacks: '🍿',
  golosina: '🍬', golosinas: '🍬', dulce: '🍬', dulces: '🍬',
  chocolate: '🍫', chocolates: '🍫',
  galleta: '🍪', galletas: '🍪',
  pan: '🍞', panes: '🍞',
  comida: '🍽️',
  arroz: '🌾',
  aceite: '🫙',
  azucar: '🍬',
  sal: '🧂',
  cigarrillo: '🚬', cigarrillos: '🚬', tabaco: '🚬',
  higiene: '🧴',
  limpieza: '🧹',
}

export function getNameEmoji(name: string): string {
  const lower = name.toLowerCase()
  for (const [key, emoji] of Object.entries(EMOJI_MAP)) {
    if (lower.includes(key)) return emoji
  }
  return '📦'
}

export const fmt = (v: number | null) => v != null ? `$${Number(v).toFixed(2)}` : '—'
