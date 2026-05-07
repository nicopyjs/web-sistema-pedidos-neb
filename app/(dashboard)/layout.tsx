import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/sidebar'
import type { Profile } from '@/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  if (!profile || !profile.activo) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        userRol={profile.rol}
        userNombre={`${profile.nombre} ${profile.apellido}`}
        userEmail={profile.email}
      />
      <div className="pl-64">
        <main>{children}</main>
      </div>
    </div>
  )
}
