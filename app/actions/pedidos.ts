'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { EstadoPedido } from '@/types'

const itemSchema = z.object({
  material_id:     z.string().uuid(),
  cantidad:        z.number().positive(),
  precio_unitario: z.number().nullable(),
  observacion:     z.string().optional(),
})

const createPedidoSchema = z.object({
  obra_id:         z.string().uuid('Selecciona una obra'),
  maestro:         z.string().min(2, 'El nombre del maestro es obligatorio'),
  fecha_requerida: z.string().nullable().optional(),
  observaciones:   z.string().optional(),
  estado:          z.enum(['borrador', 'pendiente']),
  items:           z.array(itemSchema).min(1, 'Agrega al menos un material'),
})

export type CreatePedidoInput = z.infer<typeof createPedidoSchema>
export type CreatePedidoResult =
  | { id: string; numero: string; error?: never }
  | { error: string; id?: never; numero?: never }

export async function createPedido(input: CreatePedidoInput): Promise<CreatePedidoResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (!profile || !['supervisor', 'administrador'].includes(profile.rol)) {
    return { error: 'Solo los supervisores y administradores pueden crear pedidos' }
  }

  const parsed = createPedidoSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const { items, ...pedidoFields } = parsed.data

  const { data: pedido, error: pedidoErr } = await supabase
    .from('pedidos')
    .insert({
      ...pedidoFields,
      supervisor_id:   user.id,
      numero:          '',
      fecha_requerida: pedidoFields.fecha_requerida ?? null,
      observaciones:   pedidoFields.observaciones ?? null,
    })
    .select('id, numero')
    .single()

  if (pedidoErr || !pedido) {
    return { error: pedidoErr?.message ?? 'Error al crear el pedido' }
  }

  const { error: itemsErr } = await supabase
    .from('pedido_items')
    .insert(
      items.map((item) => ({
        pedido_id:       pedido.id,
        material_id:     item.material_id,
        cantidad:        item.cantidad,
        precio_unitario: item.precio_unitario,
        observacion:     item.observacion ?? null,
      }))
    )

  if (itemsErr) {
    await supabase.from('pedidos').delete().eq('id', pedido.id)
    return { error: itemsErr.message }
  }

  revalidatePath('/pedidos')
  revalidatePath('/dashboard')

  return { id: pedido.id, numero: pedido.numero }
}

export async function updateEstadoPedido(
  pedidoId: string,
  estado: EstadoPedido,
  observaciones?: string
): Promise<{ error?: string }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: profile } = await supabase
    .from('profiles').select('rol').eq('id', user.id).single()

  if (!profile || !['adquisiciones', 'administrador'].includes(profile.rol)) {
    return { error: 'Sin permisos para cambiar el estado' }
  }

  const update: Record<string, string> = { estado }
  if (observaciones?.trim()) update.observaciones_adquisiciones = observaciones.trim()

  const { error } = await supabase.from('pedidos').update(update).eq('id', pedidoId)
  if (error) return { error: error.message }

  revalidatePath('/pedidos')
  revalidatePath(`/pedidos/${pedidoId}`)
  revalidatePath('/dashboard')
  return {}
}
