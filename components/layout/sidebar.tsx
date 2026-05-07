'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Wind,
  LayoutDashboard,
  ClipboardList,
  Building2,
  Package,
  Users,
  ChevronRight,
} from 'lucide-react'
import { cn, ROL_LABELS } from '@/lib/utils'
import type { Rol } from '@/types'

interface NavItem {
  label: string
  href:  string
  icon:  React.ElementType
  roles: Rol[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',   href: '/dashboard',  icon: LayoutDashboard, roles: ['supervisor', 'adquisiciones', 'administrador'] },
  { label: 'Pedidos',     href: '/pedidos',    icon: ClipboardList,   roles: ['supervisor', 'adquisiciones', 'administrador'] },
  { label: 'Obras',       href: '/obras',      icon: Building2,       roles: ['adquisiciones', 'administrador'] },
  { label: 'Catálogo',    href: '/catalogo',   icon: Package,         roles: ['supervisor', 'adquisiciones', 'administrador'] },
  { label: 'Usuarios',    href: '/usuarios',   icon: Users,           roles: ['administrador'] },
]

interface SidebarProps {
  userRol:    Rol
  userNombre: string
  userEmail:  string
}

export default function Sidebar({ userRol, userNombre, userEmail }: SidebarProps) {
  const pathname = usePathname()

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(userRol))

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-gray-200">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-700">
          <Wind className="w-5 h-5 text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold text-gray-900">Pedidos HVAC</p>
          <p className="text-[11px] text-gray-400">Sistema de gestión</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(isActive ? 'sidebar-link-active' : 'sidebar-link')}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-xs font-bold text-primary-700">
              {userNombre.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{userNombre}</p>
            <p className="text-xs text-gray-400 truncate">{ROL_LABELS[userRol]}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
