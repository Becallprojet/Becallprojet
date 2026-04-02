import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: boolean
}

export default function Card({ children, className, padding = true }: CardProps) {
  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 shadow-sm', padding && 'p-6', className)}>
      {children}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
}

const colorClasses = {
  blue:   'text-white',
  green:  'text-white',
  yellow: 'text-white',
  red:    'text-white',
  purple: 'text-white',
}

const bgClasses = {
  blue:   '#1A3AEE',
  green:  '#00A878',
  yellow: '#F59E0B',
  red:    '#EF4444',
  purple: '#7C3AED',
}

export function StatCard({ title, value, subtitle, icon, color = 'blue' }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold mt-1" style={{ color: '#081A3D' }}>{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        {icon && (
          <div
            className={cn('p-2.5 rounded-lg', colorClasses[color])}
            style={{ background: bgClasses[color] }}
          >
            {icon}
          </div>
        )}
      </div>
      {/* Barre décorative BECALL en bas */}
      <div className="mt-4 h-0.5 rounded-full" style={{ background: 'linear-gradient(90deg, #081A3D, #1A3AEE, #00C2FF)' }}></div>
    </div>
  )
}
