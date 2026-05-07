'use client'

import { Trash2, Package } from 'lucide-react'
import { CATEGORIA_LABELS, formatCurrency, cn } from '@/lib/utils'
import type { Material } from '@/types'

export interface DraftItem {
  _key:        string
  material:    Material
  cantidad:    number
  observacion: string
}

interface DraftItemsTableProps {
  items:    DraftItem[]
  onUpdate: (key: string, patch: Partial<Pick<DraftItem, 'cantidad' | 'observacion'>>) => void
  onRemove: (key: string) => void
}

export default function DraftItemsTable({ items, onUpdate, onRemove }: DraftItemsTableProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
        <Package className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm font-medium text-gray-500">Sin materiales agregados</p>
        <p className="text-xs mt-1">Usa el botón "Agregar material" para buscar en el catálogo.</p>
      </div>
    )
  }

  const totalEstimado = items.reduce(
    (sum, item) =>
      item.material.precio_referencia
        ? sum + item.cantidad * item.material.precio_referencia
        : sum,
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
              <th className="table-header hidden md:table-cell w-32">Precio ref.</th>
              <th className="table-header hidden lg:table-cell">Observación</th>
              <th className="table-header w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item, idx) => (
              <tr key={item._key} className="hover:bg-gray-50/60 transition-colors">
                <td className="table-cell pl-4 text-gray-400 text-xs font-mono">{idx + 1}</td>

                {/* Material */}
                <td className="table-cell">
                  <p className="font-medium text-gray-900 text-sm leading-tight">{item.material.nombre}</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{item.material.codigo}</p>
                </td>

                {/* Categoría */}
                <td className="table-cell hidden sm:table-cell">
                  <span className="badge bg-blue-50 text-blue-700 text-xs">
                    {CATEGORIA_LABELS[item.material.categoria]}
                  </span>
                </td>

                {/* Cantidad — editable inline */}
                <td className="table-cell">
                  <input
                    type="number"
                    min="0.001"
                    step="any"
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

                <td className="table-cell text-sm text-gray-500">{item.material.unidad}</td>

                {/* Precio ref. */}
                <td className="table-cell hidden md:table-cell text-sm text-gray-500">
                  {item.material.precio_referencia ? (
                    <>
                      <span className="text-gray-700 font-medium">
                        {formatCurrency(item.cantidad * item.material.precio_referencia)}
                      </span>
                      <span className="block text-xs text-gray-400">
                        c/u {formatCurrency(item.material.precio_referencia)}
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>

                {/* Observación — editable inline */}
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

                {/* Eliminar */}
                <td className="table-cell">
                  <button
                    type="button"
                    onClick={() => onRemove(item._key)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                    aria-label="Eliminar material"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>

          {totalEstimado > 0 && (
            <tfoot>
              <tr className="bg-gray-50 border-t border-gray-200">
                <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-gray-600 text-right hidden md:table-cell">
                  Total estimado:
                </td>
                <td colSpan={5} className="px-4 py-3">
                  <span className="text-base font-bold text-gray-900">
                    {formatCurrency(totalEstimado)}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">(referencial)</span>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
        <p className="text-xs text-gray-400">
          {items.length} {items.length === 1 ? 'material' : 'materiales'} en el pedido
        </p>
        {totalEstimado > 0 && (
          <p className="text-xs text-gray-500 md:hidden">
            Total ref.: <strong>{formatCurrency(totalEstimado)}</strong>
          </p>
        )}
      </div>
    </div>
  )
}
