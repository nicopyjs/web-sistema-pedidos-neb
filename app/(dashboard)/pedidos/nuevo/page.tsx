import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/header'
import NuevoPedidoForm from '@/components/pedidos/nuevo-pedido-form'
import type { Profile, Obra, Material } from '@/types'

export const metadata = { title: 'Nuevo pedido' }

export default async function NuevoPedidoPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  if (!profile || profile.rol !== 'supervisor') redirect('/pedidos')

  const [{ data: obrasData }, { data: materialesData }] = await Promise.all([
    supabase
      .from('obras')
      .select('id, nombre, codigo, cliente')
      .eq('activa', true)
      .order('nombre'),
    supabase
      .from('materiales')
      .select('*')
      .eq('activo', true)
      .order('categoria')
      .order('nombre'),
  ])

  const obras      = (obrasData      ?? []) as Obra[]
  const materiales = (materialesData ?? []) as Material[]

  return (
    <div>
      <Header title="Nuevo pedido" subtitle="Solicitud de materiales para obra" />
      <div className="p-6">
        <Link
          href="/pedidos"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver a pedidos
        </Link>

        <NuevoPedidoForm obras={obras} materiales={materiales} />
      </div>
    </div>
  )
}
