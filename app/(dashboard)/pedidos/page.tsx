import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Filter } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/header'
import PedidosTable from '@/components/pedidos/pedidos-table'
import PedidosFilters from '@/components/pedidos/pedidos-filters'
import type { Profile, Pedido, EstadoPedido } from '@/types'

interface SearchParams {
  estado?:    string
  obra_id?:   string
  supervisor?: string
  page?:      string
}

export default async function PedidosPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  if (!profile) redirect('/login')

  let query = supabase
    .from('pedidos')
    .select(`
      *,
      obra:obras(id, nombre, codigo),
      supervisor:profiles(id, nombre, apellido)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })

  if (profile.rol === 'supervisor') query = query.eq('supervisor_id', user.id)
  if (searchParams.estado)  query = query.eq('estado', searchParams.estado as EstadoPedido)
  if (searchParams.obra_id) query = query.eq('obra_id', searchParams.obra_id)

  const page = Number(searchParams.page ?? 1)
  const PAGE_SIZE = 20
  query = query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  const { data: pedidosData, count } = await query.returns<Pedido[]>()
  const pedidos = pedidosData ?? []

  // Para filtros
  const { data: obrasData } = await supabase
    .from('obras')
    .select('id, nombre, codigo')
    .eq('activa', true)
    .order('nombre')
  const obras = (obrasData ?? []) as { id: string; nombre: string; codigo: string }[]

  return (
    <div>
      <Header
        title="Pedidos"
        subtitle={`${count ?? 0} pedidos en total`}
      />

      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <PedidosFilters obras={obras} currentFilters={searchParams} userRol={profile.rol} />
          {['supervisor', 'administrador'].includes(profile.rol) && (
            <Link href="/pedidos/nuevo" className="btn-primary flex-shrink-0">
              <Plus className="w-4 h-4" />
              Nuevo pedido
            </Link>
          )}
        </div>

        <PedidosTable
          pedidos={pedidos}
          userRol={profile.rol}
          total={count ?? 0}
          page={page}
          pageSize={PAGE_SIZE}
        />
      </div>
    </div>
  )
}
