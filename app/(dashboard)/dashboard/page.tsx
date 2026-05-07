import { redirect } from 'next/navigation'
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  Wrench,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/header'
import StatsCard from '@/components/dashboard/stats-card'
import RecentOrders from '@/components/dashboard/recent-orders'
import ObrasSummary from '@/components/dashboard/obras-summary'
import type { Profile, Pedido } from '@/types'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  if (!profile) redirect('/login')

  // Construir query base según rol
  let query = supabase
    .from('pedidos')
    .select(`
      *,
      obra:obras(id, nombre, codigo),
      supervisor:profiles(id, nombre, apellido)
    `)
    .order('created_at', { ascending: false })

  if (profile.rol === 'supervisor') {
    query = query.eq('supervisor_id', user.id)
  }

  const { data: pedidosData } = await query.returns<Pedido[]>()
  const pedidos = pedidosData ?? []

  // Estadísticas
  const stats = {
    total:      pedidos.length,
    borrador:   pedidos.filter((p) => p.estado === 'borrador').length,
    pendiente:  pedidos.filter((p) => p.estado === 'pendiente').length,
    aprobado:   pedidos.filter((p) => p.estado === 'aprobado').length,
    rechazado:  pedidos.filter((p) => p.estado === 'rechazado').length,
    en_proceso: pedidos.filter((p) => p.estado === 'en_proceso').length,
    completado: pedidos.filter((p) => p.estado === 'completado').length,
  }

  // Agrupado por obra
  const obraMap = new Map<string, { nombre: string; codigo: string; total: number; pendientes: number; aprobados: number }>()
  for (const p of pedidos) {
    if (!p.obra) continue
    const key = p.obra.id
    const entry = obraMap.get(key) ?? { nombre: p.obra.nombre, codigo: p.obra.codigo, total: 0, pendientes: 0, aprobados: 0 }
    entry.total++
    if (p.estado === 'pendiente') entry.pendientes++
    if (p.estado === 'aprobado' || p.estado === 'completado') entry.aprobados++
    obraMap.set(key, entry)
  }
  const obrasSummary = Array.from(obraMap.values()).slice(0, 5)

  const recent = pedidos.slice(0, 8)

  const isSupervisor = profile.rol === 'supervisor'
  const subtitle = isSupervisor
    ? `Bienvenido, ${profile.nombre}. Aquí están tus pedidos.`
    : `Vista general del sistema — ${stats.total} pedidos registrados`

  return (
    <div>
      <Header
        title="Dashboard"
        subtitle={subtitle}
      />

      <div className="p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatsCard title="Total pedidos"   value={stats.total}      icon={ClipboardList}  color="blue"   />
          <StatsCard title="Pendientes"      value={stats.pendiente}  icon={Clock}          color="yellow" />
          <StatsCard title="Aprobados"       value={stats.aprobado}   icon={CheckCircle2}   color="green"  />
          <StatsCard title="Rechazados"      value={stats.rechazado}  icon={XCircle}        color="red"    />
          <StatsCard title="En proceso"      value={stats.en_proceso} icon={Wrench}         color="purple" />
          <StatsCard title="Completados"     value={stats.completado} icon={TrendingUp}     color="gray"   />
        </div>

        {/* Alerta para Adquisiciones */}
        {profile.rol !== 'supervisor' && stats.pendiente > 0 && (
          <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <p className="text-sm text-yellow-800">
              Tienes <strong>{stats.pendiente}</strong> {stats.pendiente === 1 ? 'pedido pendiente' : 'pedidos pendientes'} por revisar.
            </p>
            <a href="/pedidos?estado=pendiente" className="ml-auto text-sm font-medium text-yellow-700 hover:text-yellow-900 underline underline-offset-2">
              Revisar ahora →
            </a>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Pedidos recientes */}
          <div className="xl:col-span-2">
            <RecentOrders pedidos={recent} userRol={profile.rol} />
          </div>

          {/* Resumen por obra */}
          <div>
            <ObrasSummary obras={obrasSummary} />
          </div>
        </div>
      </div>
    </div>
  )
}
