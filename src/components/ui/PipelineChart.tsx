'use client'

import { STADE_LABELS } from '@/lib/utils'

interface PipelineChartProps {
  data: { stade: string; count: number }[]
}

const STADE_ORDER = ['NOUVEAU', 'CONTACTE', 'QUALIFIE', 'PROPOSITION', 'NEGOCIE', 'GAGNE', 'PERDU']

const STADE_COLORS: Record<string, { bar: string; text: string; bg: string }> = {
  NOUVEAU:     { bar: '#64748b', text: '#475569', bg: '#f1f5f9' },
  CONTACTE:    { bar: '#1A5FBF', text: '#1A5FBF', bg: '#EEF5FF' },
  QUALIFIE:    { bar: '#7C3AED', text: '#7C3AED', bg: '#f5f3ff' },
  PROPOSITION: { bar: '#F59E0B', text: '#B45309', bg: '#fffbeb' },
  NEGOCIE:     { bar: '#F97316', text: '#C2410C', bg: '#fff7ed' },
  GAGNE:       { bar: '#00A878', text: '#065F46', bg: '#ecfdf5' },
  PERDU:       { bar: '#EF4444', text: '#B91C1C', bg: '#fef2f2' },
}

export default function PipelineChart({ data }: PipelineChartProps) {
  // Build a map for fast lookup, then sort by STADE_ORDER
  const dataMap = Object.fromEntries(data.map((d) => [d.stade, d.count]))
  const rows = STADE_ORDER.map((stade) => ({ stade, count: dataMap[stade] ?? 0 }))
  const max = Math.max(...rows.map((r) => r.count), 1)

  return (
    <div className="space-y-2">
      {rows.map(({ stade, count }) => {
        const colors = STADE_COLORS[stade] ?? { bar: '#64748b', text: '#475569', bg: '#f1f5f9' }
        const pct = Math.round((count / max) * 100)
        const label = STADE_LABELS[stade] ?? stade

        return (
          <div key={stade} className="flex items-center gap-3">
            {/* Label */}
            <div className="w-24 flex-shrink-0 text-right">
              <span className="text-xs font-medium" style={{ color: colors.text }}>
                {label}
              </span>
            </div>

            {/* Bar track */}
            <div className="flex-1 h-6 rounded-md overflow-hidden" style={{ background: '#f8fafc' }}>
              <div
                className="h-full rounded-md flex items-center justify-start px-2 transition-all duration-500"
                style={{
                  width: count === 0 ? '4px' : `${Math.max(pct, 6)}%`,
                  background: colors.bar,
                  opacity: count === 0 ? 0.2 : 1,
                }}
              />
            </div>

            {/* Count */}
            <div className="w-8 flex-shrink-0 text-right">
              <span
                className="text-xs font-bold px-1.5 py-0.5 rounded"
                style={{ background: colors.bg, color: colors.text }}
              >
                {count}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
