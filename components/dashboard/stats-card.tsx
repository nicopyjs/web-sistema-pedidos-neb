import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title:     string
  value:     number | string
  icon:      LucideIcon
  color:     'blue' | 'yellow' | 'green' | 'red' | 'purple' | 'gray'
  change?:   { value: number; label: string }
  className?: string
}

const COLOR_CLASSES = {
  blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-600',   text: 'text-blue-600' },
  yellow: { bg: 'bg-yellow-50', icon: 'bg-yellow-100 text-yellow-600', text: 'text-yellow-600' },
  green:  { bg: 'bg-green-50',  icon: 'bg-green-100 text-green-600',  text: 'text-green-600' },
  red:    { bg: 'bg-red-50',    icon: 'bg-red-100 text-red-600',      text: 'text-red-600' },
  purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600', text: 'text-purple-600' },
  gray:   { bg: 'bg-gray-50',   icon: 'bg-gray-100 text-gray-600',    text: 'text-gray-600' },
}

export default function StatsCard({ title, value, icon: Icon, color, change, className }: StatsCardProps) {
  const colors = COLOR_CLASSES[color]

  return (
    <div className={cn('card p-5', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={cn('mt-1 text-xs font-medium', change.value >= 0 ? 'text-green-600' : 'text-red-600')}>
              {change.value >= 0 ? '↑' : '↓'} {Math.abs(change.value)}% {change.label}
            </p>
          )}
        </div>
        <div className={cn('p-3 rounded-xl', colors.icon)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}
