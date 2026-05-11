import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import * as XLSX from 'xlsx'

export const maxDuration = 60

const BATCH_SIZE = 500

export async function POST() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
  if (profile?.rol !== 'administrador') {
    return NextResponse.json({ error: 'Solo administradores pueden sincronizar materiales' }, { status: 403 })
  }

  const token = process.env.DEFONTANA_TOKEN
  if (!token) return NextResponse.json({ error: 'DEFONTANA_TOKEN no configurado' }, { status: 500 })

  // 1. Solicitar exportación a Defontana
  const exportRes = await fetch('https://maestro.defontana.com/api/bulk/ExportArticles', {
    method: 'POST',
    headers: {
      'authorization': `bearer ${token}`,
      'content-type': 'application/json',
      'origin': 'https://maestro-ux.defontana.com',
    },
    body: JSON.stringify({
      idCategoria: [...Array.from({ length: 71 }, (_, i) => i - 1), null],
      pageIndex: 0,
      pageSize: 9999,
      text: '',
      withStock: true,
      active: true,
      availableSale: true,
      supply: false,
    }),
  })

  if (!exportRes.ok) {
    return NextResponse.json({ error: `Defontana export error: ${exportRes.status}` }, { status: 500 })
  }

  const exportData = await exportRes.json()
  const url: string = exportData.url || exportData.message
  if (!url?.startsWith('http')) {
    return NextResponse.json({ error: 'No se obtuvo URL de descarga de Defontana' }, { status: 500 })
  }

  // 2. Descargar Excel desde S3 (sin header de autorización — la URL ya es pre-firmada)
  const fileRes = await fetch(url)
  if (!fileRes.ok) {
    return NextResponse.json({ error: `Error descargando archivo: ${fileRes.status}` }, { status: 500 })
  }

  // 3. Parsear Excel
  const buffer = await fileRes.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)

  const materiales = rows
    .map((row) => {
      const codigo = String(row['Código'] ?? row['Codigo'] ?? '').trim()
      const nombre = String(row['Nombre'] ?? '').trim()
      if (!codigo || !nombre) return null

      const precioRaw = row['Precio']
      const precio = typeof precioRaw === 'number' && precioRaw > 0 ? precioRaw : null

      return {
        codigo,
        nombre,
        categoria: String(row['Categoría'] ?? row['Categoria'] ?? 'SIN CATEGORÍA').trim(),
        unidad: 'UN',
        precio_referencia: precio,
        activo: true,
      }
    })
    .filter(Boolean)

  // 4. Upsert en lotes (no borra → no rompe FK de pedido_items)
  const admin = createAdminClient()
  const codigosDefontana = new Set(materiales.map(m => m!.codigo))

  for (let i = 0; i < materiales.length; i += BATCH_SIZE) {
    const { error } = await admin.from('materiales').upsert(
      materiales.slice(i, i + BATCH_SIZE),
      { onConflict: 'codigo' }
    )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Marcar inactivos los que ya no están en Defontana
  const { data: todos } = await admin.from('materiales').select('id, codigo')
  const idsInactivos = (todos ?? [])
    .filter(r => !codigosDefontana.has(r.codigo))
    .map(r => r.id)
  if (idsInactivos.length > 0) {
    await admin.from('materiales').update({ activo: false }).in('id', idsInactivos)
  }

  return NextResponse.json({ ok: true, total: materiales.length, inactivos: idsInactivos.length })
}
