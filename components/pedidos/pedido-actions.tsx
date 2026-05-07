'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Wrench, TrendingUp, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { updateEstadoPedido } from '@/app/actions/pedidos'
import { cn } from '@/lib/utils'
import type { EstadoPedido, Rol } from '@/types'

interface Action {
  estado:  EstadoPedido
  label:   string
  icon:    React.ElementType
  color:   string
  from:    EstadoPedido[]
}

const ACTIONS: Action[] = [
  { estado: 'aprobado',   label: 'Aprobar',           icon: CheckCircle2, color: 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100',     from: ['pendiente'] },
  { estado: 'en_proceso', label: 'Marcar en proceso', icon: Wrench,       color: 'text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100',         from: ['aprobado'] },
  { estado: 'completado', label: 'Completar',         icon: TrendingUp,   color: 'text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100', from: ['en_proceso'] },
  { estado: 'rechazado',  label: 'Rechazar',          icon: XCircle,      color: 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100',             from: ['pendiente', 'aprobado', 'en_proceso'] },
]

interface PedidoActionsProps {
  pedidoId: string
  estado:   EstadoPedido
  userRol:  Rol
}

export default function PedidoActions({ pedidoId, estado, userRol }: PedidoActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [active, setActive]           = useState<EstadoPedido | null>(null)
  const [obs, setObs]                 = useState('')

  if (!['adquisiciones', 'administrador'].includes(userRol)) return null

  const available = ACTIONS.filter(a => a.from.includes(estado))
  if (available.length === 0) return null

  function handleClick(target: EstadoPedido) {
    if (active === target) {
      startTransition(async () => {
        const result = await updateEstadoPedido(pedidoId, target, obs || undefined)
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success('Estado actualizado')
          setActive(null)
          setObs('')
          router.refresh()
        }
      })
    } else {
      setActive(target)
      setObs('')
    }
  }

  return (
    <div className="card p-5 space-y-3">
      <h2 className="font-semibold text-gray-900">Gestionar pedido</h2>

      {active && (
        <div>
          <label className="text-xs text-gray-500 block mb-1">
            Observación para el supervisor (opcional)
          </label>
          <textarea
            value={obs}
            onChange={e => setObs(e.target.value)}
            rows={2}
            className="input w-full text-sm resize-none"
            placeholder="Motivo o comentario..."
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {available.map(({ estado: target, label, icon: Icon, color }) => (
          <button
            key={target}
            onClick={() => handleClick(target)}
            disabled={isPending}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors disabled:opacity-50',
              active === target ? 'ring-2 ring-offset-1 ring-current' : '',
              color
            )}
          >
            {isPending && active === target
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Icon className="w-4 h-4" />
            }
            {active === target ? `Confirmar ${label.toLowerCase()}` : label}
          </button>
        ))}

        {active && (
          <button
            onClick={() => { setActive(null); setObs('') }}
            className="btn-secondary text-sm"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  )
}
