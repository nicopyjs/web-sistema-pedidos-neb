'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { ESTADO_LABELS } from '@/lib/utils'
import type { Rol, EstadoPedido } from '@/types'

interface Obra { id: string; nombre: string; codigo: string }

interface PedidosFiltersProps {
  obras:          Obra[]
  currentFilters: { estado?: string; obra_id?: string }
  userRol:        Rol
}

const ESTADOS: EstadoPedido[] = ['borrador', 'pendiente', 'aprobado', 'rechazado', 'en_proceso', 'completado']

export default function PedidosFilters({ obras, currentFilters, userRol }: PedidosFiltersProps) {
  const router   = useRouter()
  const pathname = usePathname()

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(currentFilters as Record<string, string>)
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  function clearFilters() {
    router.push(pathname)
  }

  const hasFilters = !!currentFilters.estado || !!currentFilters.obra_id

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Estado */}
      <select
        value={currentFilters.estado ?? ''}
        onChange={(e) => setFilter('estado', e.target.value)}
        className="input w-auto text-sm"
      >
        <option value="">Todos los estados</option>
        {ESTADOS.map((e) => (
          <option key={e} value={e}>{ESTADO_LABELS[e]}</option>
        ))}
      </select>

      {/* Obra */}
      <select
        value={currentFilters.obra_id ?? ''}
        onChange={(e) => setFilter('obra_id', e.target.value)}
        className="input w-auto text-sm"
      >
        <option value="">Todas las obras</option>
        {obras.map((o) => (
          <option key={o.id} value={o.id}>{o.codigo} — {o.nombre}</option>
        ))}
      </select>

      {hasFilters && (
        <button onClick={clearFilters} className="btn-ghost text-xs gap-1.5">
          <X className="w-3.5 h-3.5" />
          Limpiar filtros
        </button>
      )}
    </div>
  )
}
