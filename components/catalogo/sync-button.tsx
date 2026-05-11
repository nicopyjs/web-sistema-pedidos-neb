'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SyncButton() {
  const [loading, setLoading] = useState(false)

  async function handleSync() {
    if (!confirm('¿Sincronizar materiales desde Defontana? Esto reemplazará todos los materiales actuales.')) return
    setLoading(true)
    const toastId = toast.loading('Sincronizando con Defontana...')
    try {
      const res = await fetch('/api/sync-materiales', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error desconocido')
      toast.success(`✓ ${data.total} materiales sincronizados`, { id: toastId })
      window.location.reload()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al sincronizar', { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={loading}
      className="btn-secondary flex items-center gap-2 text-sm"
    >
      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Sincronizando...' : 'Sync Defontana'}
    </button>
  )
}
