'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { EstadoPedido } from '@/types'

const itemSchema = z.object({
  material_id:     z.string().uuid().nullable(),
  nombre_custom:   z.string().optional(),
  unidad_custom:   z.string().optional(),
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
        material_id:     item.material_id ?? null,
        nombre_custom:   item.nombre_custom ?? null,
        unidad_custom:   item.unidad_custom ?? null,
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

const updatePedidoSchema = z.object({
  maestro:         z.string().min(2, 'El nombre del maestro es obligatorio'),
  fecha_requerida: z.string().nullable().optional(),
  observaciones:   z.string().optional(),
  estado:          z.enum(['borrador', 'pendiente']),
  items:           z.array(itemSchema).min(1, 'Agrega al menos un material'),
})

export type UpdatePedidoInput = z.infer<typeof updatePedidoSchema>
export type UpdatePedidoResult =
  | { error?: never }
  | { error: string }

export async function updatePedido(
  pedidoId: string,
  input: UpdatePedidoInput
): Promise<UpdatePedidoResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: profile } = await supabase
    .from('profiles').select('rol').eq('id', user.id).single()

  if (!profile) return { error: 'Perfil no encontrado' }

  const { data: pedido } = await supabase
    .from('pedidos').select('supervisor_id, estado').eq('id', pedidoId).single()

  if (!pedido) return { error: 'Pedido no encontrado' }

  const canEdit =
    (['supervisor', 'administrador'].includes(profile.rol) &&
      pedido.supervisor_id === user.id &&
      ['borrador', 'pendiente'].includes(pedido.estado)) ||
    profile.rol === 'administrador'

  if (!canEdit) return { error: 'Sin permisos para editar este pedido' }

  const parsed = updatePedidoSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  const { items, ...fields } = parsed.data

  const { error: pedidoErr } = await supabase
    .from('pedidos')
    .update({
      ...fields,
      fecha_requerida: fields.fecha_requerida ?? null,
      observaciones:   fields.observaciones ?? null,
    })
    .eq('id', pedidoId)

  if (pedidoErr) return { error: pedidoErr.message }

  await supabase.from('pedido_items').delete().eq('pedido_id', pedidoId)

  const { error: itemsErr } = await supabase.from('pedido_items').insert(
    items.map(item => ({
      pedido_id:       pedidoId,
      material_id:     item.material_id ?? null,
      nombre_custom:   item.nombre_custom ?? null,
      unidad_custom:   item.unidad_custom ?? null,
      cantidad:        item.cantidad,
      precio_unitario: item.precio_unitario,
      observacion:     item.observacion ?? null,
    }))
  )

  if (itemsErr) return { error: itemsErr.message }

  revalidatePath('/pedidos')
  revalidatePath(`/pedidos/${pedidoId}`)
  revalidatePath('/dashboard')
  return {}
}

export async function updatePrecioItem(
  itemId: string,
  pedidoId: string,
  precio: number | null
): Promise<{ error?: string }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: profile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
  if (!profile || !['adquisiciones', 'administrador'].includes(profile.rol)) {
    return { error: 'Sin permisos para editar precios' }
  }

  const { error } = await supabase
    .from('pedido_items')
    .update({ precio_unitario: precio })
    .eq('id', itemId)

  if (error) return { error: error.message }

  revalidatePath(`/pedidos/${pedidoId}`)
  return {}
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
