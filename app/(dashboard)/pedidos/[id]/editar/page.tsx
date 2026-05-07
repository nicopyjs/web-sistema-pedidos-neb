import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/header'
import EditarPedidoForm from '@/components/pedidos/editar-pedido-form'
import type { Profile, Pedido, PedidoItem, Obra, Material } from '@/types'

export default async function EditarPedidoPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single<Profile>()
  if (!profile) redirect('/login')

  const { data: pedido } = await supabase
    .from('pedidos')
    .select('*, obra:obras(*)')
    .eq('id', params.id)
    .single<Pedido>()

  if (!pedido) notFound()

  const canEdit =
    (['supervisor', 'administrador'].includes(profile.rol) &&
      pedido.supervisor_id === user.id &&
      ['borrador', 'pendiente'].includes(pedido.estado)) ||
    profile.rol === 'administrador'

  if (!canEdit) redirect(`/pedidos/${params.id}`)

  const [{ data: itemsData }, { data: materialesData }] = await Promise.all([
    supabase
      .from('pedido_items')
      .select('*, material:materiales(*)')
      .eq('pedido_id', params.id)
      .order('created_at'),
    supabase
      .from('materiales')
      .select('*')
      .eq('activo', true)
      .order('categoria')
      .order('nombre'),
  ])

  const items     = (itemsData     ?? []) as PedidoItem[]
  const materiales = (materialesData ?? []) as Material[]

  return (
    <div>
      <Header title={`Editar ${pedido.numero}`} subtitle="Modificar pedido de materiales" />
      <div className="p-6">
        <Link
          href={`/pedidos/${params.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver al pedido
        </Link>

        <EditarPedidoForm
          pedidoId={params.id}
          obra={pedido.obra as Obra}
          defaultValues={{
            maestro:         pedido.maestro,
            fecha_requerida: pedido.fecha_requerida,
            observaciones:   pedido.observaciones,
          }}
          existingItems={items}
          materiales={materiales}
        />
      </div>
    </div>
  )
}
