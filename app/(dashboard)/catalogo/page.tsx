import { redirect } from 'next/navigation'
import { Package, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/header'
import { CATEGORIA_LABELS, formatCurrency } from '@/lib/utils'
import type { Profile, Material, CategoriaHVAC } from '@/types'

interface SearchParams { categoria?: string }

export default async function CatalogoPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single<Profile>()
  if (!profile) redirect('/login')

  let query = supabase.from('materiales').select('*').eq('activo', true).order('categoria').order('nombre')
  if (searchParams.categoria) query = query.eq('categoria', searchParams.categoria as CategoriaHVAC)

  const { data: materialesData } = await query.returns<Material[]>()
  const materiales = materialesData ?? []

  const categorias = Object.entries(CATEGORIA_LABELS) as [CategoriaHVAC, string][]

  return (
    <div>
      <Header title="Catálogo de materiales" subtitle={`${materiales.length} materiales disponibles`} />
      <div className="p-6 space-y-4">
        {/* Filtro categorías */}
        <div className="flex flex-wrap gap-2">
          <a
            href="/catalogo"
            className={`badge px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
              !searchParams.categoria ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos
          </a>
          {categorias.map(([key, label]) => (
            <a
              key={key}
              href={`/catalogo?categoria=${key}`}
              className={`badge px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
                searchParams.categoria === key ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </a>
          ))}
        </div>

        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-header">Código</th>
                <th className="table-header">Nombre</th>
                <th className="table-header hidden md:table-cell">Categoría</th>
                <th className="table-header hidden sm:table-cell">Unidad</th>
                <th className="table-header hidden lg:table-cell">Precio ref.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {materiales.map((mat) => (
                <tr key={mat.id} className="hover:bg-gray-50">
                  <td className="table-cell font-mono text-xs text-gray-500">{mat.codigo}</td>
                  <td className="table-cell">
                    <p className="font-medium text-gray-900 text-sm">{mat.nombre}</p>
                    {mat.descripcion && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{mat.descripcion}</p>
                    )}
                  </td>
                  <td className="table-cell hidden md:table-cell">
                    <span className="badge bg-blue-50 text-blue-700 text-xs">
                      {CATEGORIA_LABELS[mat.categoria]}
                    </span>
                  </td>
                  <td className="table-cell hidden sm:table-cell text-gray-500 text-sm">{mat.unidad}</td>
                  <td className="table-cell hidden lg:table-cell text-gray-600 text-sm">
                    {formatCurrency(mat.precio_referencia)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {materiales.length === 0 && (
            <div className="py-12 text-center text-gray-400">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No hay materiales en esta categoría.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
