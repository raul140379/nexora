import { useState } from 'react'

// ── Section wrapper ──────────────────────────────────────────────────────────
const Section = ({ icon, title, sub, children }: { icon: string; title: string; sub: string; children: React.ReactNode }) => (
  <section className="space-y-5">
    <div className="border-b border-white/10 pb-3">
      <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2">{icon} {title}</h3>
      <p className="text-sm text-gray-400 mt-0.5">{sub}</p>
    </div>
    {children}
  </section>
)

// ── Color swatch ─────────────────────────────────────────────────────────────
const Swatch = ({ hex, name, usage }: { hex: string; name: string; usage: string }) => (
  <div className="flex flex-col gap-2 group cursor-default">
    <div className="h-14 rounded-xl border border-white/10 shadow-sm transition-transform duration-200 group-hover:scale-105"
      style={{ backgroundColor: hex }} />
    <div>
      <p className="text-sm font-semibold text-gray-100">{name}</p>
      <p className="text-xs font-mono text-[#D4AF37] tracking-wider">{hex}</p>
      <p className="text-xs text-gray-500 mt-0.5">{usage}</p>
    </div>
  </div>
)

// ── Type specimen ─────────────────────────────────────────────────────────────
const TypeRow = ({ label, cls, sample }: { label: string; cls: string; sample: string }) => (
  <div className="flex items-baseline gap-6 py-3 border-b border-white/5">
    <span className="text-xs text-gray-500 w-32 flex-shrink-0 font-mono">{label}</span>
    <span className={cls}>{sample}</span>
  </div>
)

// ── Code token ────────────────────────────────────────────────────────────────
const Token = ({ name, value }: { name: string; value: string }) => (
  <div className="flex items-center justify-between py-2 border-b border-white/5">
    <span className="text-xs font-mono text-[#D4AF37]">{name}</span>
    <span className="text-xs font-mono text-gray-400 bg-[#172A46] px-2 py-0.5 rounded">{value}</span>
  </div>
)

// ════════════════════════════════════════════════════════════════════════════
export function DesignSystem() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="p-5 md:p-8 pb-20">
      {/* ── Page Header ── */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#D4AF37]/15 rounded-xl flex items-center justify-center text-[#D4AF37] text-xl">◈</div>
          <div>
            <h2 className="text-2xl font-bold text-gray-100 tracking-tight">Design System</h2>
            <p className="text-sm text-gray-400">Nexora · Guía de estilos y componentes visuales</p>
          </div>
        </div>
        <div className="mt-4 bg-[#243D66] border border-[#D4AF37]/20 rounded-xl px-5 py-4 flex flex-wrap gap-6">
          <div><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Versión</p><p className="text-sm font-semibold text-gray-100 mt-0.5">1.0.0</p></div>
          <div><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Framework</p><p className="text-sm font-semibold text-gray-100 mt-0.5">React + Tailwind CSS</p></div>
          <div><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tema</p><p className="text-sm font-semibold text-gray-100 mt-0.5">Dark Navy</p></div>
          <div><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tipografía</p><p className="text-sm font-semibold text-gray-100 mt-0.5">Inter / System UI</p></div>
        </div>
      </div>

      <div className="space-y-14">

        {/* ══ 1. PALETA DE COLORES ══════════════════════════════════════════ */}
        <Section icon="🎨" title="Paleta de Colores" sub="Tokens de color oficial. Nunca usar valores fuera de esta paleta.">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Colores primarios</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <Swatch hex="#0F0F0F" name="Negro"          usage="Sidebar, base oscura" />
              <Swatch hex="#D4AF37" name="Dorado"         usage="CTA, activo, acento" />
              <Swatch hex="#B8860B" name="Dorado Oscuro"  usage="Hover de dorado" />
              <Swatch hex="#1E3557" name="Azul Principal" usage="Fondo general" />
              <Swatch hex="#243D66" name="Azul Medio"     usage="Cards, paneles" />
            </div>
          </div>
          <div className="mt-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Colores de apoyo</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <Swatch hex="#172A46" name="Azul Oscuro"    usage="Thead, inputs, paneles" />
              <Swatch hex="#1B2A49" name="Azul Panel"     usage="Chips activos, hover" />
              <Swatch hex="#F9FAFB" name="Blanco Suave"   usage="Texto principal" />
              <Swatch hex="#9CA3AF" name="Gris 400"       usage="Texto secundario" />
              <Swatch hex="#6B7280" name="Gris 500"       usage="Placeholder, meta" />
            </div>
          </div>
          <div className="mt-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Semánticos</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Swatch hex="#4ADE80" name="Éxito"      usage="Activo, stock OK" />
              <Swatch hex="#FB923C" name="Advertencia" usage="Stock bajo" />
              <Swatch hex="#F87171" name="Peligro"    usage="Sin stock, errores" />
              <Swatch hex="#60A5FA" name="Info"       usage="Precio A, datos" />
            </div>
          </div>
        </Section>

        {/* ══ 2. TIPOGRAFÍA ════════════════════════════════════════════════ */}
        <Section icon="📝" title="Tipografía" sub="Sistema de escala tipográfica. Familia: Inter / System UI / sans-serif.">
          <div className="bg-[#243D66] rounded-xl border border-white/5 p-6 space-y-1">
            <TypeRow label="Display / 36px Bold"    cls="text-4xl font-bold text-gray-100"                  sample="El Patrón Shop" />
            <TypeRow label="H1 / 28px Bold"         cls="text-3xl font-bold text-gray-100"                  sample="Dashboard Principal" />
            <TypeRow label="H2 / 24px Bold"         cls="text-2xl font-bold text-gray-100"                  sample="Módulo de Productos" />
            <TypeRow label="H3 / 20px Semibold"     cls="text-xl font-semibold text-gray-100"               sample="Resumen de ventas" />
            <TypeRow label="H4 / 16px Semibold"     cls="text-base font-semibold text-gray-100"             sample="Paceña 440 ml" />
            <TypeRow label="Body / 14px Regular"    cls="text-sm text-gray-300"                             sample="Administrá el catálogo de productos, precios y stock." />
            <TypeRow label="Caption / 12px Regular" cls="text-xs text-gray-400"                             sample="Última actualización hace 5 minutos" />
            <TypeRow label="Micro / 11px Uppercase" cls="text-[11px] font-semibold text-gray-500 uppercase tracking-widest" sample="CATEGORÍA · ESTADO · ACCIONES" />
            <TypeRow label="Mono / 12px"            cls="text-xs font-mono text-[#D4AF37]"                  sample="LIC-CEV-001 · #1E3557 · 0.00" />
          </div>
        </Section>

        {/* ══ 3. BOTONES ═══════════════════════════════════════════════════ */}
        <Section icon="🔘" title="Botones" sub="Variantes y estados. Transición: 200ms ease.">
          <div className="bg-[#243D66] rounded-xl border border-white/5 p-6 space-y-6">
            {/* Primarios */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Primario — Acción principal</p>
              <div className="flex flex-wrap gap-3">
                <button className="bg-[#D4AF37] hover:bg-[#B8860B] text-[#0F0F0F] text-sm font-semibold px-5 py-2.5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md">
                  + Nuevo producto
                </button>
                <button className="bg-[#D4AF37] hover:bg-[#B8860B] text-[#0F0F0F] text-sm font-semibold px-5 py-2.5 rounded-lg transition-all duration-200 opacity-50 cursor-not-allowed">
                  Guardando...
                </button>
              </div>
            </div>
            {/* Secundarios */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Secundario — Acción de apoyo</p>
              <div className="flex flex-wrap gap-3">
                <button className="bg-[#172A46] hover:bg-[#1B2A49] text-gray-300 border border-white/10 text-sm font-medium px-4 py-2.5 rounded-lg transition-all duration-200">
                  Actualizar
                </button>
                <button className="bg-[#172A46] hover:bg-[#1B2A49] text-gray-300 border border-white/10 text-sm font-medium px-4 py-2.5 rounded-lg transition-all duration-200">
                  Exportar
                </button>
                <button className="border border-white/10 text-gray-300 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-[#1E3557] transition-all duration-200">
                  Cancelar
                </button>
              </div>
            </div>
            {/* Peligro */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Peligro — Acciones destructivas</p>
              <div className="flex flex-wrap gap-3">
                <button className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-all duration-200">
                  Eliminar
                </button>
                <button className="bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/40 text-sm font-medium px-4 py-2.5 rounded-lg transition-all duration-200">
                  Eliminar todos
                </button>
              </div>
            </div>
            {/* Iconos */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Icono — Acciones de tabla</p>
              <div className="flex flex-wrap gap-2">
                <button className="p-2 rounded-lg text-gray-500 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all duration-200" title="Editar">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </button>
                <button className="p-2 rounded-lg text-gray-500 hover:text-green-400 hover:bg-green-900/20 transition-all duration-200" title="Agregar stock">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                </button>
                <button className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-all duration-200" title="Eliminar">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </div>
          </div>
        </Section>

        {/* ══ 4. TARJETAS KPI ══════════════════════════════════════════════ */}
        <Section icon="🃏" title="Tarjetas" sub="KPI cards y tarjetas de información. Hover sutil con scale + border.">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Productos',  val: '248', icon: '📦', bg: 'bg-[#D4AF37]/15', cl: 'text-[#D4AF37]', desc: 'Total en catálogo' },
              { label: 'Activos',    val: '231', icon: '✅', bg: 'bg-green-900/30',  cl: 'text-green-400', desc: 'Disponibles' },
              { label: 'Stock Bajo', val: '12',  icon: '⚠️', bg: 'bg-orange-900/30', cl: 'text-orange-400', desc: '5 unidades o menos' },
              { label: 'Sin Stock',  val: '5',   icon: '❌', bg: 'bg-red-900/30',    cl: 'text-red-400',   desc: 'Requieren reposición' },
            ].map(k => (
              <div key={k.label} className="bg-[#243D66] rounded-xl p-5 border border-white/5 shadow-sm hover:border-white/10 hover:shadow-md transition-all duration-200 group">
                <div className={`w-10 h-10 ${k.bg} rounded-lg flex items-center justify-center text-lg mb-4 transition-transform duration-200 group-hover:scale-110`}>{k.icon}</div>
                <div className={`text-3xl font-bold ${k.cl} tabular-nums`}>{k.val}</div>
                <div className="text-sm font-medium text-gray-200 mt-0.5">{k.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{k.desc}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-[#243D66] rounded-xl border border-white/5 p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Tarjeta de información</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Total Ventas Hoy', val: '$12,480.00', sub: '+18% vs ayer', color: 'text-green-400' },
                { label: 'Ticket Promedio',  val: '$234.50',    sub: '53 ventas',     color: 'text-blue-400' },
                { label: 'Margen Bruto',     val: '34.2%',      sub: 'Este mes',      color: 'text-[#D4AF37]' },
              ].map(c => (
                <div key={c.label} className="bg-[#172A46] rounded-xl p-4 border border-white/5">
                  <p className="text-xs text-gray-500">{c.label}</p>
                  <p className="text-2xl font-bold text-gray-100 mt-1">{c.val}</p>
                  <p className={`text-xs font-medium mt-1 ${c.color}`}>{c.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ══ 5. TABLAS ════════════════════════════════════════════════════ */}
        <Section icon="📋" title="Tablas" sub="Cabecera oscura, filas con separador sutil, hover en azul profundo.">
          <div className="bg-[#243D66] rounded-xl border border-white/5 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#172A46] border-b border-[#1E3557]">
                <tr>
                  {['Producto', 'Categoría', 'Precio A', 'Stock', 'Estado', 'Acciones'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  { emoji: '🍺', name: 'Paceña 440ml', sku: 'LIC-CEV-001', cat: 'Licores › Cerveza', price: '$12.50', stock: 84, pct: 84, status: 'active' },
                  { emoji: '🥃', name: 'Johnnie Red',  sku: 'LIC-WHI-002', cat: 'Licores › Whisky',  price: '$245.00', stock: 3, pct: 3, status: 'low' },
                  { emoji: '💧', name: 'Agua Vital',   sku: 'BEB-AGU-003', cat: 'Bebidas › Agua',    price: '$5.00',   stock: 0, pct: 0, status: 'empty' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-[#1E3557]/60 transition-colors duration-150 group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-900/40 text-blue-300 flex items-center justify-center text-xl">{row.emoji}</div>
                        <div>
                          <p className="font-semibold text-gray-100 text-[15px]">{row.name}</p>
                          <p className="text-xs text-gray-500 font-mono tracking-wide">{row.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-300">{row.cat}</td>
                    <td className="px-5 py-4"><span className="font-bold text-blue-300 text-base">{row.price}</span></td>
                    <td className="px-5 py-4">
                      <span className={`font-bold text-base ${row.stock === 0 ? 'text-red-400' : row.stock <= 5 ? 'text-orange-400' : 'text-gray-100'}`}>{row.stock}</span>
                      <div className="w-16 bg-white/10 rounded-full h-1.5 mt-1.5">
                        <div className={`h-1.5 rounded-full ${row.stock === 0 ? 'bg-red-500' : row.stock <= 5 ? 'bg-orange-500' : 'bg-green-500'}`} style={{ width: `${row.pct}%` }} />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {row.status === 'active' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-800/30"><span className="w-1.5 h-1.5 rounded-full bg-green-500"/>Activo</span>}
                      {row.status === 'low'    && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-900/30 text-orange-400 border border-orange-800/30"><span className="w-1.5 h-1.5 rounded-full bg-orange-500"/>Stock Bajo</span>}
                      {row.status === 'empty'  && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-900/30 text-red-400 border border-red-800/30"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/>Sin Stock</span>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <button className="p-2 rounded-lg text-gray-500 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all">✏</button>
                        <button className="p-2 rounded-lg text-gray-500 hover:text-green-400 hover:bg-green-900/20 transition-all">+</button>
                        <button className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-all">🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* ══ 6. BADGES Y ETIQUETAS ════════════════════════════════════════ */}
        <Section icon="🏷️" title="Badges y Etiquetas de Estado" sub="Punto de color + texto. Nunca solo texto sin indicador visual.">
          <div className="bg-[#243D66] rounded-xl border border-white/5 p-6">
            <div className="flex flex-wrap gap-3 mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-800/30"><span className="w-1.5 h-1.5 rounded-full bg-green-500"/>Activo</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-orange-900/30 text-orange-400 border border-orange-800/30"><span className="w-1.5 h-1.5 rounded-full bg-orange-500"/>Stock Bajo</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-red-900/30 text-red-400 border border-red-800/30"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/>Sin Stock</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-700/40 text-gray-400 border border-gray-600/30"><span className="w-1.5 h-1.5 rounded-full bg-gray-500"/>Inactivo</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400 border border-blue-800/30"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"/>Completado</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-violet-900/30 text-violet-400 border border-violet-800/30"><span className="w-1.5 h-1.5 rounded-full bg-violet-500"/>Admin</span>
            </div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Roles de usuario</p>
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">Administrador</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-900/40 text-blue-300 border border-blue-800/40">Ejecutivo</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-900/40 text-green-300 border border-green-800/40">Vendedor</span>
            </div>
          </div>
        </Section>

        {/* ══ 7. FORMULARIOS ═══════════════════════════════════════════════ */}
        <Section icon="📑" title="Formularios" sub="Inputs, selects y checkboxes. Fondo #172A46, foco con anillo dorado.">
          <div className="bg-[#243D66] rounded-xl border border-white/5 p-6 space-y-5 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Input normal</label>
              <input defaultValue="Paceña 440ml" className="w-full bg-[#172A46] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Input con placeholder</label>
              <input placeholder="Ej: Nombre del producto..." className="w-full bg-[#172A46] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Input disabled</label>
              <input defaultValue="Valor bloqueado" disabled className="w-full bg-[#172A46] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-500 opacity-40 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Input error</label>
              <input defaultValue="valor inválido" className="w-full bg-[#172A46] border border-red-500/60 rounded-lg px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all" />
              <p className="text-xs text-red-400 mt-1.5">Este campo es obligatorio</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Select</label>
              <select className="w-full bg-[#172A46] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] transition-all">
                <option>Sin categoría</option>
                <option>Licores</option>
                <option>Bebidas</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Textarea</label>
              <textarea rows={3} placeholder="Descripción del producto..." className="w-full bg-[#172A46] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] transition-all resize-none" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">Checkbox / Radio</label>
              {['Precio A visible', 'Precio B visible', 'Precio C visible'].map((l, i) => (
                <label key={l} className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" defaultChecked={i < 2} className="w-4 h-4 rounded border-white/20 bg-[#172A46] text-[#D4AF37] focus:ring-[#D4AF37] focus:ring-offset-0" />
                  <span className="text-sm text-gray-300 group-hover:text-gray-100 transition-colors">{l}</span>
                </label>
              ))}
            </div>
          </div>
        </Section>

        {/* ══ 8. ALERTAS Y MODALES ═════════════════════════════════════════ */}
        <Section icon="🔔" title="Alertas, Modales y Notificaciones" sub="Cuatro niveles semánticos: éxito, advertencia, error, info.">
          <div className="space-y-3 max-w-2xl">
            {[
              { type: 'success', icon: '✅', title: 'Producto guardado', msg: 'Los cambios se guardaron correctamente.', bg: 'bg-green-900/20 border-green-800/40 text-green-400', tb: 'text-green-300' },
              { type: 'warning', icon: '⚠️', title: 'Stock bajo',        msg: 'Paceña 440ml tiene solo 3 unidades restantes.', bg: 'bg-orange-900/20 border-orange-800/40 text-orange-400', tb: 'text-orange-300' },
              { type: 'error',   icon: '❌', title: 'Error al eliminar', msg: 'No se puede eliminar: el producto tiene ventas registradas.', bg: 'bg-red-900/20 border-red-800/40 text-red-400', tb: 'text-red-300' },
              { type: 'info',    icon: 'ℹ️', title: 'Función próxima',  msg: 'Importar desde CSV estará disponible en la próxima versión.', bg: 'bg-blue-900/20 border-blue-800/40 text-blue-400', tb: 'text-blue-300' },
            ].map(a => (
              <div key={a.type} className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border ${a.bg}`}>
                <span className="text-lg flex-shrink-0 mt-0.5">{a.icon}</span>
                <div>
                  <p className={`text-sm font-semibold ${a.tb}`}>{a.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{a.msg}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <button onClick={() => setModalOpen(true)} className="bg-[#D4AF37] hover:bg-[#B8860B] text-[#0F0F0F] text-sm font-semibold px-4 py-2.5 rounded-lg transition-all duration-200">
              Ver ejemplo de Modal →
            </button>
          </div>
          {modalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-[#243D66] rounded-2xl border border-white/10 shadow-2xl w-full max-w-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#D4AF37]/15 rounded-xl flex items-center justify-center text-[#D4AF37] text-xl">🛑</div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-100">Modal de confirmación</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Estructura estándar Nexora</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-5">Esta es la estructura base de todos los modales del sistema. Usa backdrop-blur, bordes sutiles y botones en la parte inferior.</p>
                <div className="flex gap-3">
                  <button onClick={() => setModalOpen(false)} className="flex-1 border border-white/10 text-gray-300 text-sm font-medium py-2.5 rounded-lg hover:bg-[#1E3557] transition-all">Cancelar</button>
                  <button onClick={() => setModalOpen(false)} className="flex-1 bg-[#D4AF37] hover:bg-[#B8860B] text-[#0F0F0F] text-sm font-semibold py-2.5 rounded-lg transition-all">Confirmar</button>
                </div>
              </div>
            </div>
          )}
        </Section>

        {/* ══ 9. GRÁFICOS Y PANELES ════════════════════════════════════════ */}
        <Section icon="📊" title="Gráficos y Paneles" sub="Paleta de colores para visualizaciones de datos.">
          <div className="bg-[#243D66] rounded-xl border border-white/5 p-6 space-y-6">
            {/* Barra chart simple */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Barras — Ventas por día</p>
              <div className="flex items-end gap-2 h-28">
                {[
                  { day: 'Lun', val: 65, color: 'bg-[#D4AF37]' },
                  { day: 'Mar', val: 80, color: 'bg-[#D4AF37]' },
                  { day: 'Mié', val: 45, color: 'bg-[#D4AF37]' },
                  { day: 'Jue', val: 90, color: 'bg-[#D4AF37]/80' },
                  { day: 'Vie', val: 100,color: 'bg-[#D4AF37]' },
                  { day: 'Sáb', val: 70, color: 'bg-[#D4AF37]/60' },
                  { day: 'Dom', val: 30, color: 'bg-[#D4AF37]/40' },
                ].map(b => (
                  <div key={b.day} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="w-full flex items-end justify-center" style={{ height: '96px' }}>
                      <div className={`w-full ${b.color} rounded-t-md transition-all duration-300 hover:opacity-80`} style={{ height: `${b.val}%` }} />
                    </div>
                    <span className="text-[10px] text-gray-500">{b.day}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Donut fake */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Distribución — Categorías</p>
                <div className="space-y-2">
                  {[
                    { label: 'Licores',  pct: 45, color: 'bg-[#D4AF37]' },
                    { label: 'Bebidas',  pct: 25, color: 'bg-blue-500' },
                    { label: 'Abarrotes',pct: 20, color: 'bg-green-500' },
                    { label: 'Otros',    pct: 10, color: 'bg-gray-500' },
                  ].map(r => (
                    <div key={r.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-300">{r.label}</span>
                        <span className="text-gray-400 font-mono">{r.pct}%</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full ${r.color} rounded-full transition-all duration-500`} style={{ width: `${r.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Colores para gráficos</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: 'Serie 1', hex: '#D4AF37' }, { name: 'Serie 2', hex: '#60A5FA' },
                    { name: 'Serie 3', hex: '#4ADE80' }, { name: 'Serie 4', hex: '#FB923C' },
                    { name: 'Serie 5', hex: '#C084FC' }, { name: 'Serie 6', hex: '#F472B6' },
                  ].map(s => (
                    <div key={s.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.hex }} />
                      <span className="text-xs text-gray-400">{s.name}</span>
                      <span className="text-xs font-mono text-gray-600 ml-auto">{s.hex}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ══ 10. ESPACIADO, RADIOS Y SOMBRAS ══════════════════════════════ */}
        <Section icon="📐" title="Espaciado, Radios de Borde y Sombras" sub="Tokens de espaciado y estilo estructural.">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Espaciado */}
            <div className="bg-[#243D66] rounded-xl border border-white/5 p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Espaciado</p>
              <div className="space-y-0">
                <Token name="xs  / py-1 px-2"      value="4px / 8px" />
                <Token name="sm  / py-1.5 px-3"    value="6px / 12px" />
                <Token name="md  / py-2.5 px-4"    value="10px / 16px" />
                <Token name="lg  / py-3.5 px-5"    value="14px / 20px" />
                <Token name="xl  / p-6"             value="24px" />
                <Token name="2xl / p-8"             value="32px" />
                <Token name="gap-section / gap-14"  value="56px" />
              </div>
            </div>
            {/* Border radius */}
            <div className="bg-[#243D66] rounded-xl border border-white/5 p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Border Radius</p>
              <div className="space-y-3">
                {[
                  { name: 'rounded-md',  label: 'Micro / inputs internos',  r: '6px' },
                  { name: 'rounded-lg',  label: 'Botones / inputs',         r: '8px' },
                  { name: 'rounded-xl',  label: 'Cards, tablas',            r: '12px' },
                  { name: 'rounded-2xl', label: 'Modales, KPI cards',       r: '16px' },
                  { name: 'rounded-full',label: 'Chips, badges, avatares',  r: '9999px' },
                ].map(br => (
                  <div key={br.name} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#172A46] border border-white/10 flex-shrink-0" style={{ borderRadius: br.r }} />
                    <div>
                      <p className="text-xs font-mono text-[#D4AF37]">{br.name}</p>
                      <p className="text-[10px] text-gray-500">{br.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Sombras */}
            <div className="bg-[#243D66] rounded-xl border border-white/5 p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Sombras</p>
              <div className="space-y-4">
                {[
                  { name: 'shadow-sm',  label: 'Cards en reposo',    shadow: '0 1px 3px rgba(0,0,0,.3)' },
                  { name: 'shadow-md',  label: 'Cards en hover',     shadow: '0 4px 12px rgba(0,0,0,.4)' },
                  { name: 'shadow-lg',  label: 'Dropdowns, tooltips',shadow: '0 8px 24px rgba(0,0,0,.5)' },
                  { name: 'shadow-2xl', label: 'Modales',            shadow: '0 20px 48px rgba(0,0,0,.7)' },
                ].map(s => (
                  <div key={s.name} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#1B2A49] rounded-xl flex-shrink-0" style={{ boxShadow: s.shadow }} />
                    <div>
                      <p className="text-xs font-mono text-[#D4AF37]">{s.name}</p>
                      <p className="text-[10px] text-gray-500">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

      </div>
    </div>
  )
}
