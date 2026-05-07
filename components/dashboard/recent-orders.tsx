import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { formatDate, ESTADO_LABELS, ESTADO_COLORS } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Pedido, Rol } from '@/types'

interface RecentOrdersProps {
  pedidos: Pedido[]
  userRol: Rol
}

export default function RecentOrders({ pedidos, userRol }: RecentOrdersProps) {
  return (
    <div className="card">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h2 className="font-semibold text-gray-900">Pedidos recientes</h2>
          <p className="text-xs text-gray-400 mt-0.5">Últimos {pedidos.length} pedidos</p>
        </div>
        <Link
          href="/pedidos"
          className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Ver todos
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {pedidos.length === 0 ? (
        <div className="py-12 text-center text-gray-400">
          <p className="text-sm">No hay pedidos registrados aún.</p>
          {userRol === 'supervisor' && (
            <Link href="/pedidos/nuevo" className="btn-primary mt-4 inline-flex">
              Crear primer pedido
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-header">N° Pedido</th>
                <th className="table-header">Obra</th>
                <th className="table-header">Maestro</th>
                <th className="table-header hidden md:table-cell">Fecha</th>
                <th className="table-header">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pedidos.map((pedido) => (
                <tr key={pedido.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-cell">
                    <Link
                      href={`/pedidos/${pedido.id}`}
                      className="font-medium text-primary-700 hover:text-primary-900 hover:underline"
                    >
                      {pedido.numero}
                    </Link>
                  </td>
                  <td className="table-cell">
                    <span className="text-xs font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded mr-1.5">
                      {pedido.obra?.codigo}
                    </span>
                    <span className="hidden sm:inline text-gray-700 truncate max-w-[120px]">
                      {pedido.obra?.nombre}
                    </span>
                  </td>
                  <td className="table-cell text-gray-600">{pedido.maestro}</td>
                  <td className="table-cell hidden md:table-cell text-gray-400 text-xs">
                    {formatDate(pedido.created_at)}
                  </td>
                  <td className="table-cell">
                    <span className={cn('badge', ESTADO_COLORS[pedido.estado])}>
                      {ESTADO_LABELS[pedido.estado]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
