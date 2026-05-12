export type Rol = 'supervisor' | 'adquisiciones' | 'administrador'

export type EstadoPedido =
  | 'borrador'
  | 'pendiente'
  | 'aprobado'
  | 'rechazado'
  | 'en_proceso'
  | 'completado'

export type CategoriaHVAC = string

export interface Profile {
  id: string
  nombre: string
  apellido: string
  email: string
  rol: Rol
  activo: boolean
  created_at: string
  updated_at: string
}

export interface Obra {
  id: string
  nombre: string
  codigo: string
  cliente: string | null
  direccion: string | null
  activa: boolean
  created_at: string
  updated_at: string
}

export interface Material {
  id: string
  codigo: string
  nombre: string
  descripcion: string | null
  categoria: CategoriaHVAC
  unidad: string
  precio_referencia: number | null
  activo: boolean
  created_at: string
}

export interface Pedido {
  id: string
  numero: string
  obra_id: string
  supervisor_id: string
  maestro: string
  estado: EstadoPedido
  observaciones: string | null
  observaciones_adquisiciones: string | null
  fecha_requerida: string | null
  created_at: string
  updated_at: string
  obra?: Obra
  supervisor?: Profile
  items?: PedidoItem[]
}

export interface PedidoItem {
  id: string
  pedido_id: string
  material_id: string | null
  cantidad: number
  precio_unitario: number | null
  observacion: string | null
  nombre_custom: string | null
  unidad_custom: string | null
  created_at: string
  material?: Material
}

export interface PedidoHistorial {
  id: string
  pedido_id: string
  estado_anterior: EstadoPedido | null
  estado_nuevo: EstadoPedido
  usuario_id: string | null
  comentario: string | null
  created_at: string
  usuario?: Profile
}

export interface DashboardStats {
  total_pedidos: number
  pedidos_pendientes: number
  pedidos_aprobados: number
  pedidos_rechazados: number
  pedidos_en_proceso: number
  pedidos_completados: number
}

export interface PedidosPorObra {
  obra_nombre: string
  obra_codigo: string
  total: number
  pendientes: number
  aprobados: number
  rechazados: number
}

export interface PedidosPorSupervisor {
  supervisor_nombre: string
  total: number
  aprobados: number
  rechazados: number
}
