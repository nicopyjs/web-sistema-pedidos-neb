import { redirect } from 'next/navigation'
import { UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/header'
import UsuariosTable from '@/components/usuarios/usuarios-table'
import type { Profile } from '@/types'

export default async function UsuariosPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single<Profile>()
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
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Cambia el rol desde el selector de cada fila. Click en el estado para activar/desactivar.
          </p>
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-sm"
          >
            <UserPlus className="w-4 h-4" />
            Agregar usuario en Supabase
          </a>
        </div>

        <UsuariosTable usuarios={usuarios} currentUserId={user.id} />
      </div>
    </div>
  )
}
