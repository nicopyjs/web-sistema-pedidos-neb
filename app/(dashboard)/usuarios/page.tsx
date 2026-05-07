import { redirect } from 'next/navigation'
import { Users, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/header'
import { formatDate, ROL_LABELS, ROL_COLORS } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'

export default async function UsuariosPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single<Profile>()
  if (!profile || profile.rol !== 'administrador') redirect('/dashboard')

  const { data: usuariosData } = await supabase
    .from('profiles')
    .select('*')
    .order('nombre')
    .returns<Profile[]>()
  const usuarios = usuariosData ?? []

  return (
    <div>
      <Header title="Usuarios" subtitle={`${usuarios.length} usuarios registrados`} />
      <div className="p-6 space-y-4">
        <div className="flex justify-end">
          <button className="btn-primary">
            <UserPlus className="w-4 h-4" />
            Invitar usuario
          </button>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-header">Usuario</th>
                <th className="table-header">Email</th>
                <th className="table-header">Rol</th>
                <th className="table-header hidden md:table-cell">Registrado</th>
                <th className="table-header">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary-700">
                          {u.nombre.charAt(0)}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900 text-sm">
                        {u.nombre} {u.apellido}
                      </span>
                    </div>
                  </td>
                  <td className="table-cell text-gray-500 text-sm">{u.email}</td>
                  <td className="table-cell">
                    <span className={cn('badge', ROL_COLORS[u.rol])}>
                      {ROL_LABELS[u.rol]}
                    </span>
                  </td>
                  <td className="table-cell hidden md:table-cell text-gray-400 text-xs">
                    {formatDate(u.created_at)}
                  </td>
                  <td className="table-cell">
                    <span className={cn('badge', u.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {usuarios.length === 0 && (
            <div className="py-12 text-center text-gray-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No hay usuarios registrados.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
