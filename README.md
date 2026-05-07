# Sistema de Pedidos HVAC — NEB Chile

Aplicación web para gestionar solicitudes de materiales HVAC en obras de construcción. Los supervisores crean pedidos desde un catálogo de materiales, y el equipo de adquisiciones los revisa, aprueba o rechaza.

## Stack

- **Frontend/Backend:** Next.js 14 (App Router, Server Actions, SSR)
- **Base de datos y auth:** Supabase (PostgreSQL + Row Level Security)
- **UI:** Tailwind CSS + Lucide Icons
- **Forms:** React Hook Form + Zod
- **Exportación:** jsPDF (PDF) + xlsx (Excel)
- **Charts:** Recharts

---

## Funcionalidades

### Roles de usuario

| Rol | Permisos |
|-----|----------|
| `supervisor` | Crea y gestiona sus propios pedidos (borrador → pendiente) |
| `adquisiciones` | Ve todos los pedidos, los aprueba, rechaza o marca en proceso/completado |
| `administrador` | Acceso total: gestiona obras, materiales, usuarios y pedidos |

### Módulos

**Dashboard**
- KPIs: total de pedidos por estado (borrador, pendiente, aprobado, rechazado, en proceso, completado)
- Alerta de pedidos pendientes para adquisiciones
- Listado de pedidos recientes
- Resumen por obra

**Pedidos**
- Listado con filtros por estado, obra y búsqueda de texto
- Creación de pedido: seleccionar obra, maestro a cargo, fecha requerida, materiales con cantidad y observación
- Guardado como borrador o envío directo como pendiente
- Vista detalle: metadata del pedido, tabla de materiales con precios y subtotal estimado, historial de cambios de estado

**Catálogo de materiales (HVAC)**
Categorías disponibles:
- Ductos (galvanizados rectangulares, circulares, flexibles)
- Fan coils (cassette, piso-techo, para ductos)
- Chillers (aire-agua, tornillo, torres de enfriamiento)
- VRF (unidades exteriores e interiores, accesorios)
- Ventilación (industriales, extractores, rejillas, difusores, UMAs)
- Accesorios (codos, tees, reducciones, compuertas, silenciadores)
- Aislación (lana de vidrio, elastomérico, Armaflex)
- Control (termostatos, válvulas motorizadas, sensores, gateways BMS)

**Obras**
- Listado de proyectos activos con código, cliente y dirección

**Usuarios** *(admin)*
- Gestión de perfiles y roles

### Numeración automática
Los pedidos se numeran automáticamente con el formato `P-YYYY-NNNNN` (ej. `P-2025-00042`) mediante un trigger en PostgreSQL.

### Historial de estados
Cada cambio de estado queda registrado automáticamente con usuario y timestamp via trigger en la tabla `pedido_historial`.

---

## Estructura del proyecto

```
app/
  (auth)/login/          — Página de login
  (dashboard)/
    dashboard/           — Dashboard principal
    pedidos/             — Listado, detalle y nuevo pedido
    obras/               — Listado de obras
    catalogo/            — Catálogo de materiales
    usuarios/            — Gestión de usuarios (admin)
  actions/pedidos.ts     — Server Actions (crear pedido)
  auth/callback/         — Callback OAuth de Supabase

components/
  layout/                — Header y sidebar
  dashboard/             — StatsCard, RecentOrders, ObrasSummary
  pedidos/               — Tabla, filtros, formulario, selector de materiales

lib/supabase/            — Clientes Supabase (server y client-side)
supabase/
  migrations/001_schema.sql  — Schema completo con RLS y triggers
  seed.sql                   — Catálogo HVAC de ejemplo + obras de prueba
types/index.ts               — Tipos TypeScript compartidos
```

---

## Desarrollo local

### 1. Pre-requisitos

- Node.js 18+
- Cuenta en [Supabase](https://supabase.com) (gratis)

### 2. Clonar e instalar dependencias

```bash
npm install
```

### 3. Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) → New project
2. En el SQL Editor, ejecutar `supabase/migrations/001_schema.sql`
3. (Opcional) Ejecutar `supabase/seed.sql` para cargar el catálogo HVAC y obras de ejemplo

### 4. Variables de entorno

Copiar `.env.local.example` a `.env.local` y completar:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Las credenciales están en Supabase → Project Settings → API.

### 5. Correr en desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

---

## Deploy a producción

### Opción A — Vercel + Supabase (recomendado)

Vercel es la plataforma oficial de Next.js y la opción más simple.

**Paso 1: Preparar Supabase**
1. En tu proyecto Supabase, ir a **Authentication → URL Configuration**
2. Agregar tu dominio de Vercel en **Site URL** (ej. `https://mi-app.vercel.app`)
3. Agregar también en **Redirect URLs**: `https://mi-app.vercel.app/auth/callback`

**Paso 2: Deploy en Vercel**
1. Ir a [vercel.com](https://vercel.com) → Add New Project
2. Importar este repositorio desde GitHub
3. En **Environment Variables**, agregar:
   ```
   NEXT_PUBLIC_SUPABASE_URL      = https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = tu-anon-key
   NEXT_PUBLIC_APP_URL           = https://mi-app.vercel.app
   ```
4. Click en **Deploy**

Vercel detecta Next.js automáticamente. No requiere configuración adicional.

---

### Opción B — Netlify + Supabase

**Paso 1: Preparar Supabase** (igual que Opción A, usando tu dominio de Netlify)

**Paso 2: Deploy en Netlify**
1. Ir a [netlify.com](https://netlify.com) → Add new site → Import from Git
2. En **Build settings**:
   - Build command: `npm run build`
   - Publish directory: `.next`
3. Instalar el plugin oficial: **Netlify Next.js Runtime** (se instala automáticamente al detectar Next.js)
4. En **Site configuration → Environment variables**, agregar las mismas variables que en Vercel
5. Click en **Deploy site**

> **Nota:** Netlify requiere el plugin `@netlify/plugin-nextjs` para soportar Server Actions y SSR. Generalmente se configura solo, pero si hay errores verificar que esté en la lista de plugins del proyecto.

---

### Crear el primer usuario administrador

Después del deploy, el primer usuario se debe crear directamente desde Supabase:

1. Ir a **Supabase → Authentication → Users → Add user**
2. Crear el usuario con email y contraseña
3. En **Table Editor → profiles**, buscar el usuario recién creado y cambiar `rol` a `administrador`

Los usuarios siguientes pueden ser invitados o registrados desde la propia app (con rol `supervisor` por defecto).
