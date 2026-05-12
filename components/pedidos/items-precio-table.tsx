'use client'

import { useState, useTransition } from 'react'
import { Wrench } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import { updatePrecioItem } from '@/app/actions/pedidos'
import type { PedidoItem, Rol } from '@/types'

interface Props {
  items:    PedidoItem[]
  pedidoId: string
  userRol:  Rol
}

export default function ItemsPrecioTable({ items, pedidoId, userRol }: Props) {
  const canEdit = userRol === 'adquisiciones' || userRol === 'administrador'
  const [precios, setPrecios] = useState<Record<string, string>>(
    Object.fromEntries(items.map(i => [i.id, i.precio_unitario != null ? String(i.precio_unitario) : '']))
  )
  const [, startTransition] = useTransition()

  function handleBlur(item: PedidoItem) {
    const raw   = precios[item.id]
    const valor = raw === '' ? null : parseFloat(raw)
    const nuevo = valor !== null && !isNaN(valor) && valor > 0 ? valor : null
    if (nuevo === item.precio_unitario) return
    startTransition(() => { updatePrecioItem(item.id, pedidoId, nuevo) })
  }

  const total = items.reduce((sum, i) => {
    const p = parseFloat(precios[i.id] || '0')
    return !isNaN(p) && p > 0 ? sum + i.cantidad * p : sum
  }, 0)

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="table-header">#</th>
            <th className="table-header">Material</th>
            <th className="table-header hidden sm:table-cell">Categoría</th>
            <th className="table-header">Cantidad</th>
            <th className="table-header hidden md:table-cell">
              {canEdit ? 'Precio unit. (editable)' : 'Precio unit.'}
            </th>
            <th className="table-header hidden md:table-cell">Subtotal</th>
            <th className="table-header hidden lg:table-cell">Observación</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {items.map((item, idx) => {
            const nombre   = item.material?.nombre ?? item.nombre_custom ?? '—'
            const codigo   = item.material?.codigo ?? null
            const unidad   = item.material?.unidad ?? item.unidad_custom ?? 'UN'
            const isCustom = !item.material_id
            const p        = parseFloat(precios[item.id] || '0')
            const subtotal = !isNaN(p) && p > 0 ? item.cantidad * p : null

            return (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="table-cell text-gray-400 text-xs font-mono">{idx + 1}</td>
                <td className="table-cell">
                  <div className="flex items-center gap-1.5">
                    {isCustom && <Wrench className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{nombre}</p>
                      {codigo && <p className="text-xs font-mono text-gray-400">{codigo}</p>}
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
                <td className="table-cell font-medium">{item.cantidad} {unidad}</td>
                <td className="table-cell hidden md:table-cell">
                  {canEdit ? (
                    <input
                      type="number" min="0" step="any"
                      value={precios[item.id]}
                      placeholder="0"
                      onChange={e => setPrecios(prev => ({ ...prev, [item.id]: e.target.value }))}
                      onBlur={() => handleBlur(item)}
                      className={cn(
                        'w-32 rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm text-right',
                        'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'
                      )}
                    />
                  ) : (
                    <span className="text-gray-500 text-sm">{formatCurrency(item.precio_unitario)}</span>
                  )}
                </td>
                <td className="table-cell hidden md:table-cell text-gray-700 text-sm font-medium">
                  {subtotal ? formatCurrency(subtotal) : '—'}
                </td>
                <td className="table-cell hidden lg:table-cell text-gray-400 text-sm">
                  {item.observacion ?? '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
        {total > 0 && (
          <tfoot>
            <tr className="bg-gray-50 border-t border-gray-200">
              <td colSpan={5} className="px-4 py-3 text-sm font-semibold text-gray-600 text-right hidden md:table-cell">
                Total:
              </td>
              <td colSpan={2} className="px-4 py-3">
                <span className="text-base font-bold text-gray-900">{formatCurrency(total)}</span>
                {canEdit && <span className="text-xs text-gray-400 ml-2">— edita los precios arriba</span>}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}
