import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, CalendarDays, User, Building2, Clock, FileText, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/header'
import {
  formatDate,
  formatDateTime,
  ESTADO_LABELS,
  ESTADO_COLORS,
  cn,
} from '@/lib/utils'
import type { Profile, Pedido, PedidoItem, PedidoHistorial } from '@/types'
import PedidoActions from '@/components/pedidos/pedido-actions'
import ItemsPrecioTable from '@/components/pedidos/items-precio-table'

export default async function PedidoDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single<Profile>()
  if (!profile) redirect('/login')

  const { data: pedido } = await supabase
    .from('pedidos')
    .select(`*, obra:obras(*), supervisor:profiles(*)`)
    .eq('id', params.id)
    .single<Pedido>()

  if (!pedido) notFound()

  // Access control
  if (profile.rol === 'supervisor' && pedido.supervisor_id !== user.id) notFound()

  const [{ data: itemsData }, { data: historialData }] = await Promise.all([
    supabase
      .from('pedido_items')
      .select('*, material:materiales(*)')
      .eq('pedido_id', params.id)
      .order('created_at'),
    supabase
      .from('pedido_historial')
      .select('*, usuario:profiles(nombre, apellido)')
      .eq('pedido_id', params.id)
      .order('created_at', { ascending: false }),
  ])

  const items     = (itemsData     ?? []) as PedidoItem[]
  const historial = (historialData ?? []) as PedidoHistorial[]

  return (
    <div>
      <Header
        title={pedido.numero}
        subtitle={`${pedido.obra?.nombre ?? ''} · ${pedido.maestro}`}
      />

      <div className="p-6 space-y-5 max-w-5xl">
        <div className="flex items-center justify-between">
          <Link href="/pedidos" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <ChevronLeft className="w-4 h-4" />
            Volver a pedidos
          </Link>
          {(profile.rol === 'administrador' ||
            (pedido.supervisor_id === user.id && ['borrador', 'pendiente'].includes(pedido.estado))) && (
            <Link href={`/pedidos/${pedido.id}/editar`} className="btn-secondary text-sm">
              <Pencil className="w-4 h-4" />
              Editar pedido
            </Link>
          )}
        </div>

        {/* Estado + metadata */}
        <div className="card p-5 flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-wrap gap-4">
            <Info icon={Building2} label="Obra">
              <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded mr-1.5">{pedido.obra?.codigo}</span>
              {pedido.obra?.nombre}
            </Info>
            <Info icon={User} label="Supervisor">
              {pedido.supervisor?.nombre} {pedido.supervisor?.apellido}
            </Info>
            <Info icon={User} label="Maestro">{pedido.maestro}</Info>
            {pedido.fecha_requerida && (
              <Info icon={CalendarDays} label="Fecha requerida">
                {formatDate(pedido.fecha_requerida)}
              </Info>
            )}
            <Info icon={Clock} label="Creado">{formatDateTime(pedido.created_at)}</Info>
          </div>
          <span className={cn('badge text-sm px-3 py-1', ESTADO_COLORS[pedido.estado])}>
            {ESTADO_LABELS[pedido.estado]}
          </span>
        </div>

        {/* Observaciones */}
        {pedido.observaciones && (
          <div className="card p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Observaciones del supervisor
            </p>
            <p className="text-sm text-gray-700">{pedido.observaciones}</p>
          </div>
        )}

        {pedido.observaciones_adquisiciones && (
          <div className="card p-5 border-yellow-200 bg-yellow-50">
            <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wider mb-1.5">
              Respuesta de adquisiciones
            </p>
            <p className="text-sm text-yellow-900">{pedido.observaciones_adquisiciones}</p>
          </div>
        )}

        {/* Items */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">Materiales solicitados</h2>
            <span className="text-sm text-gray-400">{items.length} ítem{items.length !== 1 ? 's' : ''}</span>
          </div>
          <ItemsPrecioTable items={items} pedidoId={params.id} userRol={profile.rol} />
        </div>

        {/* Acciones de gestión */}
        <PedidoActions pedidoId={pedido.id} estado={pedido.estado} userRol={profile.rol} />

        {/* Historial */}
        {historial.length > 0 && (
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Historial de estados</h2>
            <ol className="relative border-l border-gray-200 space-y-4 ml-3">
              {historial.map((h) => (
                <li key={h.id} className="pl-5 relative">
                  <span className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary-500 ring-2 ring-white" />
                  <div className="flex flex-wrap items-center gap-2">
                    {h.estado_anterior && (
                      <>
                        <span className={cn('badge text-xs', ESTADO_COLORS[h.estado_anterior])}>
                          {ESTADO_LABELS[h.estado_anterior]}
                        </span>
                        <span className="text-gray-300 text-xs">→</span>
                      </>
                    )}
                    <span className={cn('badge text-xs', ESTADO_COLORS[h.estado_nuevo])}>
                      {ESTADO_LABELS[h.estado_nuevo]}
                    </span>
                    <span className="text-xs text-gray-400">
                      {h.usuario ? `por ${(h.usuario as { nombre: string; apellido: string }).nombre} ${(h.usuario as { nombre: string; apellido: string }).apellido}` : ''}
                      {' · '}{formatDateTime(h.created_at)}
                    </span>
                  </div>
                  {h.comentario && (
                    <p className="text-sm text-gray-500 mt-1">{h.comentario}</p>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}

function Info({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-400 flex items-center gap-1 mb-0.5">
        <Icon className="w-3 h-3" />
        {label}
      </p>
      <p className="text-sm font-medium text-gray-800">{children}</p>
    </div>
  )
}
