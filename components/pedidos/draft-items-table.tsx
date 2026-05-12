'use client'

import { Trash2, Package, Wrench } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import type { Material } from '@/types'

export interface DraftItem {
  _key:            string
  material:        Material | null   // null = ítem manual
  nombre_custom?:  string
  unidad_custom?:  string
  cantidad:        number
  observacion:     string
  precio_unitario: number | null
}

interface DraftItemsTableProps {
  items:    DraftItem[]
  onUpdate: (key: string, patch: Partial<Pick<DraftItem, 'cantidad' | 'observacion' | 'precio_unitario'>>) => void
  onRemove: (key: string) => void
}

export default function DraftItemsTable({ items, onUpdate, onRemove }: DraftItemsTableProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
        <Package className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm font-medium text-gray-500">Sin materiales agregados</p>
        <p className="text-xs mt-1">Usa los botones de arriba para agregar materiales del catálogo o crear un ítem manual.</p>
      </div>
    )
  }

  const total = items.reduce(
    (sum, item) => item.precio_unitario ? sum + item.cantidad * item.precio_unitario : sum,
    0
  )

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="table-header pl-4 w-8">#</th>
              <th className="table-header">Material</th>
              <th className="table-header hidden sm:table-cell">Categoría</th>
              <th className="table-header w-28">Cantidad</th>
              <th className="table-header w-16">Unidad</th>
              <th className="table-header w-36">Precio unit.</th>
              <th className="table-header hidden md:table-cell w-28">Subtotal</th>
              <th className="table-header hidden lg:table-cell">Observación</th>
              <th className="table-header w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item, idx) => {
              const nombre  = item.material?.nombre ?? item.nombre_custom ?? '—'
              const codigo  = item.material?.codigo ?? null
              const unidad  = item.material?.unidad ?? item.unidad_custom ?? 'UN'
              const isCustom = !item.material

              return (
                <tr key={item._key} className="hover:bg-gray-50/60 transition-colors">
                  <td className="table-cell pl-4 text-gray-400 text-xs font-mono">{idx + 1}</td>

                  <td className="table-cell">
                    <div className="flex items-center gap-1.5">
                      {isCustom && <Wrench className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                      <div>
                        <p className="font-medium text-gray-900 text-sm leading-tight">{nombre}</p>
                        {codigo && <p className="text-xs text-gray-400 font-mono mt-0.5">{codigo}</p>}
                        {isCustom && <p className="text-xs text-amber-500 mt-0.5">Ítem manual</p>}
                      </div>
                    </div>
                  </td>

                  <td className="table-cell hidden sm:table-cell">
                    {item.material ? (
                      <span className="badge bg-blue-50 text-blue-700 text-xs">{item.material.categoria}</span>
                    ) : (
                      <span className="badge bg-amber-50 text-amber-600 text-xs">Manual</span>
                    )}
                  </td>

                  <td className="table-cell">
                    <input
                      type="number" min="0.001" step="any"
                      value={item.cantidad}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value)
                        if (!isNaN(v) && v > 0) onUpdate(item._key, { cantidad: v })
                      }}
                      className={cn(
                        'w-24 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-center',
                        'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'
                      )}
                    />
                  </td>

                  <td className="table-cell text-sm text-gray-500">{unidad}</td>

                  <td className="table-cell">
                    <input
                      type="number" min="0" step="any"
                      value={item.precio_unitario ?? ''}
                      placeholder={item.material?.precio_referencia ? String(item.material.precio_referencia) : '0'}
                      onChange={(e) => {
                        const v = e.target.value === '' ? null : parseFloat(e.target.value)
                        onUpdate(item._key, { precio_unitario: (v !== null && !isNaN(v) && v > 0) ? v : null })
                      }}
                      className={cn(
                        'w-32 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-right',
                        'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'
                      )}
                    />
                  </td>

                  <td className="table-cell hidden md:table-cell text-sm font-medium text-gray-700">
                    {item.precio_unitario
                      ? formatCurrency(item.cantidad * item.precio_unitario)
                      : <span className="text-gray-300">—</span>}
                  </td>

                  <td className="table-cell hidden lg:table-cell">
                    <input
                      type="text"
                      placeholder="Nota opcional..."
                      value={item.observacion}
                      onChange={(e) => onUpdate(item._key, { observacion: e.target.value })}
                      className={cn(
                        'w-full rounded-lg border border-gray-200 bg-transparent px-2 py-1.5 text-xs text-gray-600',
                        'placeholder-gray-300 focus:border-primary-400 focus:outline-none focus:ring-1',
                        'focus:ring-primary-300 focus:bg-white transition-colors'
                      )}
                    />
                  </td>

                  <td className="table-cell">
                    <button
                      type="button"
                      onClick={() => onRemove(item._key)}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>

          {total > 0 && (
            <tfoot>
              <tr className="bg-gray-50 border-t border-gray-200">
                <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-gray-600 text-right hidden md:table-cell">
                  Total estimado:
                </td>
                <td colSpan={5} className="px-4 py-3">
                  <span className="text-base font-bold text-gray-900">{formatCurrency(total)}</span>
                  <span className="text-xs text-gray-400 ml-2">(referencial)</span>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
        <p className="text-xs text-gray-400">
          {items.length} {items.length === 1 ? 'ítem' : 'ítems'} en el pedido
        </p>
        {total > 0 && (
          <p className="text-xs text-gray-500 md:hidden">
            Total: <strong>{formatCurrency(total)}</strong>
          </p>
        )}
      </div>
    </div>
  )
}
