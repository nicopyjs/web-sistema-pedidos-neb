import Link from 'next/link'
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import { formatDate, ESTADO_LABELS, ESTADO_COLORS, cn } from '@/lib/utils'
import type { Pedido, Rol } from '@/types'

interface PedidosTableProps {
  pedidos:  Pedido[]
  userRol:  Rol
  total:    number
  page:     number
  pageSize: number
}

export default function PedidosTable({ pedidos, userRol, total, page, pageSize }: PedidosTableProps) {
  const totalPages = Math.ceil(total / pageSize)

  if (pedidos.length === 0) {
    return (
      <div className="card py-16 text-center text-gray-400">
        <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium text-gray-500">No se encontraron pedidos</p>
        <p className="text-sm mt-1">Intenta ajustar los filtros o crea un nuevo pedido.</p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="table-header">N° Pedido</th>
              <th className="table-header">Obra</th>
              <th className="table-header hidden md:table-cell">Maestro</th>
              {userRol !== 'supervisor' && <th className="table-header hidden lg:table-cell">Supervisor</th>}
              <th className="table-header hidden sm:table-cell">Req.</th>
              <th className="table-header">Estado</th>
              <th className="table-header hidden sm:table-cell">Fecha</th>
              <th className="table-header w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pedidos.map((pedido) => (
              <tr key={pedido.id} className="hover:bg-gray-50 transition-colors">
                <td className="table-cell font-medium">
                  <Link href={`/pedidos/${pedido.id}`} className="text-primary-700 hover:underline">
                    {pedido.numero}
                  </Link>
                </td>
                <td className="table-cell">
                  <span className="text-xs font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                    {pedido.obra?.codigo}
                  </span>
                  <span className="hidden lg:inline ml-2 text-gray-600 text-xs">{pedido.obra?.nombre}</span>
                </td>
                <td className="table-cell hidden md:table-cell text-gray-600">{pedido.maestro}</td>
                {userRol !== 'supervisor' && (
                  <td className="table-cell hidden lg:table-cell text-gray-600 text-xs">
                    {pedido.supervisor?.nombre} {pedido.supervisor?.apellido}
                  </td>
                )}
                <td className="table-cell hidden sm:table-cell text-xs text-gray-400">
                  {formatDate(pedido.fecha_requerida)}
                </td>
                <td className="table-cell">
                  <span className={cn('badge', ESTADO_COLORS[pedido.estado])}>
                    {ESTADO_LABELS[pedido.estado]}
                  </span>
                </td>
                <td className="table-cell hidden sm:table-cell text-xs text-gray-400">
                  {formatDate(pedido.created_at)}
                </td>
                <td className="table-cell">
                  <Link
                    href={`/pedidos/${pedido.id}`}
                    className="text-gray-400 hover:text-primary-600 transition-colors"
                    aria-label="Ver detalle"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-sm text-gray-400">
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} de {total}
          </p>
          <div className="flex gap-1">
            <Link
              href={`?page=${page - 1}`}
              aria-disabled={page <= 1}
              className={cn(
                'btn-ghost px-2 py-1.5',
                page <= 1 && 'pointer-events-none opacity-40'
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <Link
              href={`?page=${page + 1}`}
              aria-disabled={page >= totalPages}
              className={cn(
                'btn-ghost px-2 py-1.5',
                page >= totalPages && 'pointer-events-none opacity-40'
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
