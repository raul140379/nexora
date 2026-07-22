const EMOJI_MAP: Array<[string, string]> = [
  // Cervezas
  ['cerveza', '🍺'], ['cervezas', '🍺'], ['beer', '🍺'], ['lager', '🍺'], ['pilsener', '🍺'],

  // Vinos y espumantes
  ['vino', '🍷'], ['vinos', '🍷'], ['wine', '🍷'], ['malbec', '🍷'], ['merlot', '🍷'],
  ['champagne', '🍾'], ['espumante', '🍾'], ['prosecco', '🍾'], ['brut', '🍾'], ['cava', '🍾'],

  // Licores y spirits
  ['licor', '🥃'], ['licores', '🥃'],
  ['whisky', '🥃'], ['wisky', '🥃'], ['whiskey', '🥃'], ['bourbon', '🥃'], ['scotch', '🥃'],
  ['ron', '🥃'], ['rons', '🥃'], ['rum', '🥃'],
  ['tequila', '🌵'], ['mezcal', '🌵'],
  ['vodka', '🍸'],
  ['gin', '🍸'], ['ginebra', '🍸'],
  ['pisco', '🥃'],
  ['aguardiente', '🥃'],
  ['alcohol', '🍸'],

  // Bebidas sin alcohol / gaseosas
  ['coca', '🥤'], ['cola', '🥤'],
  ['bebida', '🥤'], ['bebidas', '🥤'],
  ['gaseosa', '🥤'], ['gaseosas', '🥤'],
  ['refresco', '🥤'], ['refrescos', '🥤'],
  ['soda', '🥤'], ['sodas', '🥤'],
  ['isotónica', '🥤'], ['isotonica', '🥤'], ['deportiva', '🥤'],

  // Aguas y jugos
  ['agua', '💧'],
  ['jugo', '🧃'], ['jugos', '🧃'], ['néctar', '🧃'], ['nectar', '🧃'],
  ['energizante', '⚡'], ['energizantes', '⚡'],

  // Lácteos y calientes
  ['café', '☕'], ['cafe', '☕'], ['coffee', '☕'],
  ['té', '🍵'], ['te', '🍵'],
  ['leche', '🥛'], ['lácteo', '🥛'], ['lacteo', '🥛'], ['yogur', '🥛'],

  // Alimentos y snacks
  ['snack', '🍿'], ['snacks', '🍿'], ['papa', '🍿'], ['chip', '🍿'],
  ['golosina', '🍬'], ['golosinas', '🍬'], ['dulce', '🍬'], ['dulces', '🍬'],
  ['chocolate', '🍫'],
  ['galleta', '🍪'], ['galletas', '🍪'],
  ['pan', '🍞'], ['panes', '🍞'],
  ['comida', '🍽️'], ['alimento', '🛒'], ['alimentos', '🛒'], ['abarrote', '🛒'], ['abarrotes', '🛒'],
  ['arroz', '🌾'],
  ['aceite', '🫙'],
  ['azucar', '🍬'], ['azúcar', '🍬'],
  ['sal', '🧂'],
  ['condimento', '🌶️'], ['salsa', '🌶️'],

  // Higiene y limpieza
  ['higiene', '🧴'], ['aseo', '🧴'], ['cuidado personal', '🧴'],
  ['limpieza', '🧹'], ['desinfectante', '🧹'], ['detergente', '🧼'],
  ['jabón', '🧼'], ['jabon', '🧼'],

  // Tabaco
  ['cigarrillo', '🚬'], ['cigarrillos', '🚬'], ['tabaco', '🚬'], ['cigarro', '🚬'],

  // Otros
  ['otros', '🏷️'], ['otro', '🏷️'], ['varios', '🏷️'], ['general', '🏷️'],
]

export function getNameEmoji(name: string): string {
  const lower = name.toLowerCase()
  for (const [key, emoji] of EMOJI_MAP) {
    if (lower.includes(key)) return emoji
  }
  return '📦'
}

export const fmt = (v: number | null) => v != null ? `Bs ${Number(v).toFixed(2)}` : '—'
