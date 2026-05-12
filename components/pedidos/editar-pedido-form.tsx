'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import {
  Plus, Save, Send, Loader2, AlertCircle,
  CalendarDays, Building2, HardHat, FileText, Wrench, X, Check,
} from 'lucide-react'
import { updatePedido } from '@/app/actions/pedidos'
import DraftItemsTable, { type DraftItem } from '@/components/pedidos/draft-items-table'
import MaterialSelector from '@/components/pedidos/material-selector'
import { cn } from '@/lib/utils'
import type { Material, PedidoItem, Obra } from '@/types'

const schema = z.object({
  maestro:         z.string().min(2, 'Nombre del maestro obligatorio'),
  fecha_requerida: z.string().optional(),
  observaciones:   z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface EditarPedidoFormProps {
  pedidoId:      string
  obra:          Obra
  defaultValues: { maestro: string; fecha_requerida: string | null; observaciones: string | null }
  existingItems: PedidoItem[]
  materiales:    Material[]
}

const emptyManual = { nombre: '', cantidad: '1', precio: '', unidad: 'UN', observacion: '' }

export default function EditarPedidoForm({
  pedidoId,
  obra,
  defaultValues,
  existingItems,
  materiales,
}: EditarPedidoFormProps) {
  const router = useRouter()

  const toDraft = (items: PedidoItem[]): DraftItem[] =>
    items.map(i => ({
      _key:            i.id,
      material:        i.material ?? null,
      nombre_custom:   i.nombre_custom ?? undefined,
      unidad_custom:   i.unidad_custom ?? undefined,
      cantidad:        Number(i.cantidad),
      observacion:     i.observacion ?? '',
      precio_unitario: i.precio_unitario ?? null,
    }))

  const [items,      setItems]      = useState<DraftItem[]>(toDraft(existingItems))
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [manualForm, setManualForm] = useState(emptyManual)
  const [manualError,setManualError]= useState('')
  const [submitting, setSubmitting] = useState<'borrador' | 'pendiente' | null>(null)
  const [itemsError, setItemsError] = useState<string | null>(null)
  const estadoRef = useRef<'borrador' | 'pendiente'>('borrador')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      maestro:         defaultValues.maestro,
      fecha_requerida: defaultValues.fecha_requerida ?? '',
      observaciones:   defaultValues.observaciones ?? '',
    },
  })

  const selectedIds = new Set(items.filter(i => i.material).map(i => i.material!.id))

  const handleAdd = useCallback((material: Material, cantidad: number, observacion: string) => {
    setItemsError(null)
    setItems(prev => {
      const existing = prev.find(i => i.material?.id === material.id)
      if (existing) {
        return prev.map(i => i.material?.id === material.id ? { ...i, cantidad: i.cantidad + cantidad } : i)
      }
      return [...prev, { _key: `${material.id}-${Date.now()}`, material, cantidad, observacion, precio_unitario: null }]
    })
  }, [])

  const handleAddManual = useCallback(() => {
    setManualError('')
    if (!manualForm.nombre.trim()) { setManualError('El nombre es obligatorio.'); return }
    const qty = parseFloat(manualForm.cantidad)
    if (isNaN(qty) || qty <= 0) { setManualError('Ingresa una cantidad válida.'); return }
    const precio = parseFloat(manualForm.precio)
    setItemsError(null)
    setItems(prev => [...prev, {
      _key:            `custom-${Date.now()}`,
      material:        null,
      nombre_custom:   manualForm.nombre.trim(),
      unidad_custom:   manualForm.unidad.trim() || 'UN',
      cantidad:        qty,
      observacion:     manualForm.observacion,
      precio_unitario: !isNaN(precio) && precio > 0 ? precio : null,
    }])
    setManualForm(emptyManual)
    setShowManual(false)
  }, [manualForm])

  const handleUpdate = useCallback((key: string, patch: Partial<Pick<DraftItem, 'cantidad' | 'observacion' | 'precio_unitario'>>) => {
    setItems(prev => prev.map(i => i._key === key ? { ...i, ...patch } : i))
  }, [])

  const handleRemove = useCallback((key: string) => {
    setItems(prev => prev.filter(i => i._key !== key))
  }, [])

  const onSubmit = async (data: FormData) => {
    if (items.length === 0) {
      setItemsError('Debes tener al menos un material en el pedido.')
      return
    }
    const estado = estadoRef.current
    setSubmitting(estado)

    const result = await updatePedido(pedidoId, {
      maestro:         data.maestro,
      fecha_requerida: data.fecha_requerida || null,
      observaciones:   data.observaciones || undefined,
      estado,
      items: items.map(i => ({
        material_id:     i.material?.id ?? null,
        nombre_custom:   i.material ? undefined : i.nombre_custom,
        unidad_custom:   i.material ? undefined : i.unidad_custom,
        cantidad:        i.cantidad,
        precio_unitario: i.precio_unitario,
        observacion:     i.observacion || undefined,
      })),
    })

    setSubmitting(null)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success(estado === 'borrador' ? 'Pedido guardado como borrador' : 'Pedido enviado a adquisiciones')
    router.push(`/pedidos/${pedidoId}`)
  }

  const isLoading = submitting !== null

  return (
    <div className="max-w-4xl space-y-6">
      <section className="card p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-400" />
          Información del pedido
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Obra — solo lectura */}
          <div>
            <label className="label">
              <Building2 className="w-3.5 h-3.5 inline mr-1.5 text-gray-400" />
              Obra
            </label>
            <div className="input bg-gray-50 text-gray-600 cursor-default">
              <span className="font-mono text-xs text-gray-400 mr-2">{obra.codigo}</span>
              {obra.nombre}
            </div>
          </div>

          {/* Maestro */}
          <div>
            <label htmlFor="maestro" className="label">
              <HardHat className="w-3.5 h-3.5 inline mr-1.5 text-gray-400" />
              Nombre del maestro <span className="text-red-500">*</span>
            </label>
            <input
              id="maestro"
              type="text"
              className={cn('input', errors.maestro && 'border-red-400 focus:ring-red-400')}
              {...register('maestro')}
            />
            {errors.maestro && <FieldError msg={errors.maestro.message} />}
          </div>

          {/* Fecha requerida */}
          <div>
            <label htmlFor="fecha_requerida" className="label">
              <CalendarDays className="w-3.5 h-3.5 inline mr-1.5 text-gray-400" />
              Fecha requerida
              <span className="text-gray-400 font-normal ml-1">(opcional)</span>
            </label>
            <input id="fecha_requerida" type="date" className="input" {...register('fecha_requerida')} />
          </div>

          {/* Observaciones */}
          <div>
            <label htmlFor="observaciones" className="label">
              Observaciones
              <span className="text-gray-400 font-normal ml-1">(opcional)</span>
            </label>
            <textarea
              id="observaciones"
              rows={1}
              className="input resize-none"
              {...register('observaciones')}
            />
          </div>
        </div>
      </section>

      {/* Materiales */}
      <section id="items-section" className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Plus className="w-4 h-4 text-gray-400" />
            Materiales del pedido
            {items.length > 0 && (
              <span className="badge bg-primary-100 text-primary-700">{items.length}</span>
            )}
          </h2>
          <div className="flex gap-2">
            <button type="button" onClick={() => { setShowManual(v => !v); setManualError('') }}
              className="btn-secondary text-sm" disabled={isLoading}>
              <Wrench className="w-4 h-4" /> Ítem manual
            </button>
            <button type="button" onClick={() => { setItemsError(null); setDrawerOpen(true) }}
              className="btn-secondary text-sm" disabled={isLoading}>
              <Plus className="w-4 h-4" /> Del catálogo
            </button>
          </div>
        </div>

        {showManual && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-semibold text-amber-700 mb-3 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5" /> Agregar ítem manual
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="label text-xs">Nombre <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Ej: Tornillo autoperforante 1/2&quot;"
                  value={manualForm.nombre}
                  onChange={e => setManualForm(f => ({ ...f, nombre: e.target.value }))}
                  className="input text-sm" />
              </div>
              <div>
                <label className="label text-xs">Cantidad <span className="text-red-500">*</span></label>
                <input type="number" min="0.001" step="any"
                  value={manualForm.cantidad}
                  onChange={e => setManualForm(f => ({ ...f, cantidad: e.target.value }))}
                  className="input text-sm" />
              </div>
              <div>
                <label className="label text-xs">Unidad</label>
                <input type="text" placeholder="UN"
                  value={manualForm.unidad}
                  onChange={e => setManualForm(f => ({ ...f, unidad: e.target.value }))}
                  className="input text-sm" />
              </div>
              <div>
                <label className="label text-xs">Precio unitario (opcional)</label>
                <input type="number" min="0" step="any" placeholder="0"
                  value={manualForm.precio}
                  onChange={e => setManualForm(f => ({ ...f, precio: e.target.value }))}
                  className="input text-sm" />
              </div>
              <div>
                <label className="label text-xs">Observación</label>
                <input type="text" placeholder="Opcional..."
                  value={manualForm.observacion}
                  onChange={e => setManualForm(f => ({ ...f, observacion: e.target.value }))}
                  className="input text-sm" />
              </div>
            </div>
            {manualError && <p className="text-xs text-red-600 mt-2">{manualError}</p>}
            <div className="flex gap-2 mt-3">
              <button type="button" onClick={handleAddManual} className="btn-primary text-sm">
                <Check className="w-4 h-4" /> Agregar
              </button>
              <button type="button" onClick={() => { setShowManual(false); setManualError('') }}
                className="btn-secondary text-sm">
                <X className="w-4 h-4" /> Cancelar
              </button>
            </div>
          </div>
        )}

        {itemsError && (
          <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {itemsError}
          </div>
        )}

        <DraftItemsTable items={items} onUpdate={handleUpdate} onRemove={handleRemove} />
      </section>

      {/* Acciones */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary sm:mr-auto"
          disabled={isLoading}
        >
          Cancelar
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => { estadoRef.current = 'borrador'; handleSubmit(onSubmit)() }}
          className="btn-secondary"
        >
          {submitting === 'borrador' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar borrador
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => { estadoRef.current = 'pendiente'; handleSubmit(onSubmit)() }}
          className="btn-primary"
        >
          {submitting === 'pendiente' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Enviar a adquisiciones
        </button>
      </div>

      <MaterialSelector
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        materiales={materiales}
        selectedIds={selectedIds}
        onAdd={handleAdd}
      />
    </div>
  )
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return (
    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
      {msg}
    </p>
  )
}
