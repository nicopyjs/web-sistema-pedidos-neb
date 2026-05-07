import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { EstadoPedido, CategoriaHVAC, Rol } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd MMM yyyy', { locale: es })
}

export function formatDateTime(date: string | Date | null): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, "dd MMM yyyy HH:mm", { locale: es })
}

export function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return '—'
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount)
}

export const ESTADO_LABELS: Record<EstadoPedido, string> = {
  borrador:    'Borrador',
  pendiente:   'Pendiente',
  aprobado:    'Aprobado',
  rechazado:   'Rechazado',
  en_proceso:  'En Proceso',
  completado:  'Completado',
}

export const ESTADO_COLORS: Record<EstadoPedido, string> = {
  borrador:   'bg-gray-100 text-gray-700',
  pendiente:  'bg-yellow-100 text-yellow-700',
  aprobado:   'bg-green-100 text-green-700',
  rechazado:  'bg-red-100 text-red-700',
  en_proceso: 'bg-blue-100 text-blue-700',
  completado: 'bg-purple-100 text-purple-700',
}

export const CATEGORIA_LABELS: Record<CategoriaHVAC, string> = {
  ductos:      'Ductos Galvanizados',
  fancoils:    'Fan Coils',
  chillers:    'Chillers',
  vrf:         'Sistemas VRF',
  ventilacion: 'Ventilación',
  accesorios:  'Accesorios',
  aislacion:   'Aislación',
  control:     'Control y Automatización',
  otros:       'Otros',
}

export const ROL_LABELS: Record<Rol, string> = {
  supervisor:    'Supervisor',
  adquisiciones: 'Adquisiciones',
  administrador: 'Administrador',
}

export const ROL_COLORS: Record<Rol, string> = {
  supervisor:    'bg-sky-100 text-sky-700',
  adquisiciones: 'bg-amber-100 text-amber-700',
  administrador: 'bg-violet-100 text-violet-700',
}
