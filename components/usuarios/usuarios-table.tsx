'use client'

import { useState, useTransition } from 'react'
import { Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { updateProfile } from '@/app/actions/usuarios'
import { ROL_LABELS, ROL_COLORS, cn } from '@/lib/utils'
import type { Profile, Rol } from '@/types'

const ROLES: Rol[] = ['supervisor', 'adquisiciones', 'administrador']

export default function UsuariosTable({
  usuarios,
  currentUserId,
}: {
  usuarios:      Profile[]
  currentUserId: string
}) {
  if (usuarios.length === 0) {
    return (
      <div className="card py-12 text-center text-gray-400">
        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No hay usuarios registrados.</p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="table-header">Usuario</th>
            <th className="table-header">Email</th>
            <th className="table-header">Rol</th>
            <th className="table-header hidden md:table-cell">Registrado</th>
            <th className="table-header">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {usuarios.map(u => (
            <UsuarioRow key={u.id} user={u} isSelf={u.id === currentUserId} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function UsuarioRow({ user, isSelf }: { user: Profile; isSelf: boolean }) {
  const [isPending, startTransition] = useTransition()
  const [rol, setRol]       = useState<Rol>(user.rol)
  const [activo, setActivo] = useState(user.activo)

  function handleRol(newRol: Rol) {
    const prev = rol
    setRol(newRol)
    startTransition(async () => {
      const result = await updateProfile(user.id, { rol: newRol })
      if (result.error) { toast.error(result.error); setRol(prev) }
      else toast.success('Rol actualizado')
    })
  }

  function handleActivo() {
    const next = !activo
    setActivo(next)
    startTransition(async () => {
      const result = await updateProfile(user.id, { activo: next })
      if (result.error) { toast.error(result.error); setActivo(activo) }
      else toast.success(next ? 'Usuario activado' : 'Usuario desactivado')
    })
  }

  return (
    <tr className={cn('hover:bg-gray-50', isPending && 'opacity-60 pointer-events-none')}>
      <td className="table-cell">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary-700">
              {user.nombre.charAt(0)}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">{user.nombre} {user.apellido}</p>
            {isSelf && <p className="text-xs text-gray-400">Tú</p>}
          </div>
        </div>
      </td>
      <td className="table-cell text-gray-500 text-sm">{user.email}</td>
      <td className="table-cell">
        {isSelf ? (
          <span className={cn('badge', ROL_COLORS[rol])}>{ROL_LABELS[rol]}</span>
        ) : (
          <select
            value={rol}
            onChange={e => handleRol(e.target.value as Rol)}
            disabled={isPending}
            className="text-xs rounded-lg border border-gray-200 px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50 cursor-pointer"
          >
            {ROLES.map(r => (
              <option key={r} value={r}>{ROL_LABELS[r]}</option>
            ))}
          </select>
        )}
      </td>
      <td className="table-cell hidden md:table-cell text-gray-400 text-xs">
        {new Date(user.created_at).toLocaleDateString('es-CL')}
      </td>
      <td className="table-cell">
        {isSelf ? (
          <span className="badge bg-green-100 text-green-700">Activo</span>
        ) : (
          <button
            onClick={handleActivo}
            disabled={isPending}
            className={cn(
              'badge cursor-pointer hover:opacity-75 transition-opacity disabled:opacity-50',
              activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            )}
          >
            {activo ? 'Activo' : 'Inactivo'}
          </button>
        )}
      </td>
    </tr>
  )
}
