import Link from 'next/link'
import { Building2 } from 'lucide-react'

interface ObraEntry {
  nombre:    string
  codigo:    string
  total:     number
  pendientes: number
  aprobados: number
}

interface ObrasSummaryProps {
  obras: ObraEntry[]
}

export default function ObrasSummary({ obras }: ObrasSummaryProps) {
  return (
    <div className="card">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">Pedidos por obra</h2>
        <p className="text-xs text-gray-400 mt-0.5">Top 5 obras con más actividad</p>
      </div>

      {obras.length === 0 ? (
        <div className="py-10 text-center text-gray-400">
          <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Sin datos de obras aún.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {obras.map((obra) => {
            const pct = obra.total > 0 ? Math.round((obra.aprobados / obra.total) * 100) : 0
            return (
              <div key={obra.codigo} className="px-5 py-3.5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{obra.nombre}</p>
                    <p className="text-xs text-gray-400">{obra.codigo}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 flex-shrink-0">
                    {obra.total}
                  </span>
                </div>

                {/* Barra de progreso */}
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex justify-between mt-1 text-xs text-gray-400">
                  <span>{obra.pendientes} pendientes</span>
                  <span>{pct}% aprobados</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="px-5 py-3 border-t border-gray-100">
        <Link href="/obras" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
          Ver todas las obras →
        </Link>
      </div>
    </div>
  )
}
