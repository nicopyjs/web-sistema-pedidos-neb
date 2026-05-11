'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Search, X, Plus, Check, ChevronRight, Loader2 } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import type { Material } from '@/types'

interface MaterialSelectorProps {
  open:        boolean
  onClose:     () => void
  materiales:  Material[]
  selectedIds: Set<string>
  onAdd:       (material: Material, cantidad: number, observacion: string) => void
}

interface AddState {
  material:    Material
  cantidad:    string
  observacion: string
  error:       string
}

export default function MaterialSelector({
  open,
  onClose,
  materiales,
  selectedIds,
  onAdd,
}: MaterialSelectorProps) {
  const categorias = useMemo(() => Array.from(new Set(materiales.map(m => m.categoria))).sort(), [materiales])

  const [search,    setSearch]    = useState('')
  const [categoria, setCategoria] = useState<string>('todos')
  const [adding,    setAdding]    = useState<AddState | null>(null)
  const searchRef  = useRef<HTMLInputElement>(null)
  const cantidadRef = useRef<HTMLInputElement>(null)

  // Focus search when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50)
      setSearch('')
      setCategoria('todos')
      setAdding(null)
    }
  }, [open])

  // Focus cantidad field when adding form opens
  useEffect(() => {
    if (adding) setTimeout(() => cantidadRef.current?.focus(), 50)
  }, [adding?.material.id])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (adding) setAdding(null)
        else onClose()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [adding, onClose])

  const filtered = materiales.filter((m) => {
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      m.nombre.toLowerCase().includes(q) ||
      m.codigo.toLowerCase().includes(q) ||
      (m.descripcion?.toLowerCase().includes(q) ?? false)
    const matchCat = categoria === 'todos' || m.categoria === categoria
    return matchSearch && matchCat
  })

  function handleStartAdd(material: Material) {
    if (selectedIds.has(material.id)) return
    setAdding({ material, cantidad: '', observacion: '', error: '' })
  }

  function handleConfirmAdd() {
    if (!adding) return
    const qty = parseFloat(adding.cantidad)
    if (isNaN(qty) || qty <= 0) {
      setAdding({ ...adding, error: 'Ingresa una cantidad válida mayor a 0' })
      return
    }
    onAdd(adding.material, qty, adding.observacion)
    setAdding(null)
  }

  function handleCantidadKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleConfirmAdd()
    }
  }

  // Count selected in current filter
  const selectedInFilter = filtered.filter((m) => selectedIds.has(m.id)).length

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-200',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-white shadow-2xl',
          'transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <h2 className="font-semibold text-gray-900">Catálogo de materiales</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {selectedIds.size > 0 ? `${selectedIds.size} material${selectedIds.size !== 1 ? 'es' : ''} en el pedido` : 'Busca y agrega materiales'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Buscar por nombre o código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 text-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 px-4 py-2 border-b border-gray-100 overflow-x-auto scrollbar-thin flex-shrink-0">
          <button
            type="button"
            onClick={() => setCategoria('todos')}
            className={cn(
              'flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors',
              categoria === 'todos'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            Todos ({materiales.length})
          </button>
          {categorias.map((cat) => {
            const count = materiales.filter((m) => m.categoria === cat).length
            if (count === 0) return null
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoria(cat)}
                className={cn(
                  'flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors',
                  categoria === cat
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {cat} ({count})
              </button>
            )
          })}
        </div>

        {/* Add form — shown inline when a material is selected */}
        {adding && (
          <div className="mx-4 mt-3 rounded-xl bg-primary-50 border border-primary-200 p-4 flex-shrink-0">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <p className="text-sm font-semibold text-primary-900">{adding.material.nombre}</p>
                <p className="text-xs text-primary-600 font-mono">{adding.material.codigo}</p>
              </div>
              <button
                type="button"
                onClick={() => setAdding(null)}
                className="text-primary-400 hover:text-primary-700 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-28">
                <label className="label text-xs text-primary-700">
                  Cantidad <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-1">
                  <input
                    ref={cantidadRef}
                    type="number"
                    min="0.001"
                    step="any"
                    placeholder="0"
                    value={adding.cantidad}
                    onChange={(e) => setAdding({ ...adding, cantidad: e.target.value, error: '' })}
                    onKeyDown={handleCantidadKey}
                    className={cn(
                      'input text-center text-sm',
                      adding.error && 'border-red-400 focus:ring-red-400'
                    )}
                  />
                  <span className="text-xs text-primary-700 font-medium flex-shrink-0">
                    {adding.material.unidad}
                  </span>
                </div>
                {adding.error && (
                  <p className="text-xs text-red-600 mt-1">{adding.error}</p>
                )}
              </div>

              <div className="flex-1">
                <label className="label text-xs text-primary-700">Observación</label>
                <input
                  type="text"
                  placeholder="Opcional..."
                  value={adding.observacion}
                  onChange={(e) => setAdding({ ...adding, observacion: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirmAdd()}
                  className="input text-sm"
                />
              </div>

              <div className="flex-shrink-0 pt-6">
                <button
                  type="button"
                  onClick={handleConfirmAdd}
                  className="btn-primary px-4 py-2"
                >
                  <Check className="w-4 h-4" />
                  Agregar
                </button>
              </div>
            </div>

            {adding.material.precio_referencia && (
              <p className="mt-2 text-xs text-primary-600">
                Precio referencial: {formatCurrency(adding.material.precio_referencia)} / {adding.material.unidad}
                {adding.cantidad && !isNaN(parseFloat(adding.cantidad)) && parseFloat(adding.cantidad) > 0 && (
                  <> — Total: <strong>{formatCurrency(parseFloat(adding.cantidad) * adding.material.precio_referencia)}</strong></>
                )}
              </p>
            )}
          </div>
        )}

        {/* Materials list */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sin resultados para &quot;{search}&quot;</p>
            </div>
          ) : (
            <div className="space-y-1">
              {/* Group by category when showing all */}
              {categoria === 'todos' && !search
                ? categorias.map((catKey) => {
                    const group = filtered.filter((m) => m.categoria === catKey)
                    if (group.length === 0) return null
                    return (
                      <div key={catKey}>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-3 pb-1 px-1">
                          {catKey}
                        </p>
                        {group.map((material) => (
                          <MaterialRow
                            key={material.id}
                            material={material}
                            isSelected={selectedIds.has(material.id)}
                            isAdding={adding?.material.id === material.id}
                            onSelect={handleStartAdd}
                          />
                        ))}
                      </div>
                    )
                  })
                : filtered.map((material) => (
                    <MaterialRow
                      key={material.id}
                      material={material}
                      isSelected={selectedIds.has(material.id)}
                      isAdding={adding?.material.id === material.id}
                      onSelect={handleStartAdd}
                    />
                  ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {filtered.length} material{filtered.length !== 1 ? 'es' : ''} mostrados
            {selectedInFilter > 0 && (
              <> · <span className="text-green-600 font-medium">{selectedInFilter} ya en pedido</span></>
            )}
          </p>
          <button type="button" onClick={onClose} className="btn-secondary text-sm">
            Cerrar
          </button>
        </div>
      </div>
    </>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Row component for each material in the list
// ────────────────────────────────────────────────────────────────────────────
function MaterialRow({
  material,
  isSelected,
  isAdding,
  onSelect,
}: {
  material:   Material
  isSelected: boolean
  isAdding:   boolean
  onSelect:   (m: Material) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(material)}
      disabled={isSelected}
      className={cn(
        'w-full text-left rounded-lg px-3 py-2.5 flex items-center gap-3 transition-colors',
        isSelected
          ? 'bg-green-50 cursor-default opacity-70'
          : isAdding
          ? 'bg-primary-50 ring-1 ring-primary-300'
          : 'hover:bg-gray-50 active:bg-gray-100'
      )}
    >
      {/* Icon col */}
      <div className={cn(
        'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs',
        isSelected ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
      )}>
        {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium truncate', isSelected ? 'text-gray-500' : 'text-gray-900')}>
          {material.nombre}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs font-mono text-gray-400">{material.codigo}</span>
          <span className="text-gray-200">·</span>
          <span className="text-xs text-gray-400">{material.unidad}</span>
          {material.precio_referencia && (
            <>
              <span className="text-gray-200">·</span>
              <span className="text-xs text-gray-400">{formatCurrency(material.precio_referencia)}</span>
            </>
          )}
        </div>
      </div>

      {/* Status */}
      {isSelected ? (
        <span className="flex-shrink-0 badge bg-green-100 text-green-700 text-xs">En pedido</span>
      ) : (
        <ChevronRight className="flex-shrink-0 w-4 h-4 text-gray-300" />
      )}
    </button>
  )
}
