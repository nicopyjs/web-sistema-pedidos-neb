'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Rol } from '@/types'

export async function updateProfile(
  profileId: string,
  data: { rol?: Rol; activo?: boolean }
): Promise<{ error?: string }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: profile } = await supabase
    .from('profiles').select('rol').eq('id', user.id).single()

  if (!profile || profile.rol !== 'administrador') {
    return { error: 'Sin permisos' }
  }

  const { error } = await supabase.from('profiles').update(data).eq('id', profileId)
  if (error) return { error: error.message }

  revalidatePath('/usuarios')
  return {}
}
