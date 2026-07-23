import { useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import JsBarcode from 'jsbarcode'

interface ProductPrice { pack_name: string; units_per_pack: number; price_a: number }
interface Product {
  id: number
  name: string
  sku: string | null
  description?: string | null
  price: number
  prices: ProductPrice[]
}

const PRINT_STYLE = `
  @media print {
    * { visibility: hidden !important; }
    #nexora-label, #nexora-label * { visibility: visible !important; }
    #nexora-label {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 54mm !important;
      margin: 0 !important;
      padding: 2mm !important;
      background: #fff !important;
    }
    @page { size: 58mm auto; margin: 0; }
  }
`

function BarcodeImg({ code }: { code: string }) {
  const ref = useRef<SVGSVGElement>(null)
  useEffect(() => {
    if (!ref.current) return
    try {
      JsBarcode(ref.current, code, {
        format: 'CODE128',
        width: 1.1,
        height: 28,
        displayValue: true,
        fontSize: 7,
        margin: 1,
        background: '#ffffff',
        lineColor: '#000000',
      })
    } catch {}
  }, [code])
  return <svg ref={ref} style={{ width: '100%', maxWidth: '100%', display: 'block' }} />
}

function Label({ product }: { product: Product }) {
  const code = product.sku || `P${String(product.id).padStart(5, '0')}`
  const unitPrice = product.prices.find(p => p.units_per_pack === 1)?.price_a ?? product.price
  const shortName = product.name.length > 60 ? product.name.substring(0, 60) + '…' : product.name
  const shortDesc = product.description
    ? product.description.substring(0, 55)
    : ''

  const qrContent = JSON.stringify({
    id: product.id,
    sku: product.sku || '',
    name: product.name,
  })

  return (
    <div style={{
      width: '54mm',
      fontFamily: 'Arial, Helvetica, sans-serif',
      color: '#000',
      background: '#fff',
      fontSize: '7pt',
      lineHeight: 1.3,
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        fontSize: '7pt',
        fontWeight: 900,
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        borderBottom: '0.5pt solid #000',
        paddingBottom: '1mm',
        marginBottom: '1.5mm',
      }}>
        El Patrón Shop
      </div>

      {/* QR + Info */}
      <div style={{ display: 'flex', gap: '2mm', marginBottom: '1.5mm', alignItems: 'flex-start' }}>
        <div style={{ flexShrink: 0 }}>
          <QRCodeSVG value={qrContent} size={58} level="M" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '7.5pt', fontWeight: 700, marginBottom: '1mm', wordBreak: 'break-word', lineHeight: 1.2 }}>
            {shortName}
          </div>
          {shortDesc && (
            <div style={{ fontSize: '5.5pt', color: '#555', marginBottom: '1mm', lineHeight: 1.3 }}>
              {shortDesc}
            </div>
          )}
          <div style={{ fontSize: '6pt', color: '#333', marginBottom: '0.5mm' }}>
            Cód: <strong style={{ fontFamily: 'Courier New, monospace' }}>{code}</strong>
          </div>
          <div style={{ fontSize: '9pt', fontWeight: 900, marginTop: '1mm' }}>
            Bs {Number(unitPrice).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Barcode */}
      <div style={{ borderTop: '0.5pt solid #ddd', paddingTop: '1mm' }}>
        <BarcodeImg code={code} />
      </div>
    </div>
  )
}

export function LabelPrint({ product, onClose }: { product: Product; onClose: () => void }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLE }} />

      {/* Modal (screen only) */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 print:hidden">
        <div className="bg-[#1E3557] rounded-2xl shadow-2xl p-6 w-80 mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold text-base">Etiqueta QR — 58mm</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Preview con escala visual */}
          <div className="bg-white rounded-xl p-3 mb-4 flex justify-center shadow-inner overflow-hidden">
            <div style={{ transform: 'scale(1.7)', transformOrigin: 'top center', marginBottom: '38%' }}>
              <Label product={product} />
            </div>
          </div>

          <p className="text-xs text-slate-400 text-center mb-4">
            Asegurate de seleccionar <strong>58mm</strong> en el diálogo de impresión
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => window.print()}
              className="flex-1 bg-[#D4AF37] hover:bg-[#c49b0a] text-[#0F0F0F] font-bold py-2.5 rounded-lg text-sm transition-colors"
            >
              Imprimir etiqueta
            </button>
            <button
              onClick={onClose}
              className="px-4 bg-[#243D66] hover:bg-[#2a4875] text-gray-300 rounded-lg text-sm transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>

      {/* Elemento que se imprime */}
      <div id="nexora-label">
        <Label product={product} />
      </div>
    </>
  )
}
