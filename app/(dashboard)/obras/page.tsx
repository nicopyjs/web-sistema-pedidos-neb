import { redirect } from 'next/navigation'
import { Building2, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/header'
import type { Profile, Obra } from '@/types'

export default async function ObrasPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single<Profile>()
  if (!profile || !['adquisiciones', 'administrador'].includes(profile.rol)) redirect('/dashboard')

  const { data: obrasData } = await supabase
    .from('obras')
    .select('*')
    .order('nombre')
    .returns<Obra[]>()
  const obras = obrasData ?? []

  return (
    <div>
      <Header title="Obras" subtitle={`${obras.length} obras registradas`} />
      <div className="p-6 space-y-4">
        <div className="flex justify-end">
          {profile.rol === 'administrador' && (
            <button className="btn-primary">
              <Plus className="w-4 h-4" />
              Nueva obra
            </button>
          )}
        </div>

        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-header">Código</th>
                <th className="table-header">Nombre</th>
                <th className="table-header hidden md:table-cell">Cliente</th>
                <th className="table-header hidden lg:table-cell">Dirección</th>
                <th className="table-header">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {obras.map((obra) => (
                <tr key={obra.id} className="hover:bg-gray-50">
                  <td className="table-cell font-mono text-xs font-semibold text-gray-600">{obra.codigo}</td>
                  <td className="table-cell font-medium text-gray-900">{obra.nombre}</td>
                  <td className="table-cell hidden md:table-cell text-gray-500 text-sm">{obra.cliente ?? '—'}</td>
                  <td className="table-cell hidden lg:table-cell text-gray-500 text-sm">{obra.direccion ?? '—'}</td>
                  <td className="table-cell">
                    <span className={`badge ${obra.activa ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {obra.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {obras.length === 0 && (
            <div className="py-12 text-center text-gray-400">
              <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No hay obras registradas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
