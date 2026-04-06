'use client'

import { CalendrierEvent } from './types'
import { getDaysInMonth, formatHeure } from './utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

interface CalendrierMensuelProps {
  events: CalendrierEvent[]
  moisCourant: Date
  onDateClick: (date: Date) => void
  onEventClick: (event: CalendrierEvent) => void
  onNavigate: (date: Date) => void
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export default function CalendrierMensuel({
  events,
  moisCourant,
  onDateClick,
  onEventClick,
  onNavigate,
}: CalendrierMensuelProps) {
  const today = new Date()
  const days = getDaysInMonth(moisCourant.getFullYear(), moisCourant.getMonth())

  const goToPrev = () => {
    const d = new Date(moisCourant)
    d.setMonth(d.getMonth() - 1)
    d.setDate(1)
    onNavigate(d)
  }

  const goToNext = () => {
    const d = new Date(moisCourant)
    d.setMonth(d.getMonth() + 1)
    d.setDate(1)
    onNavigate(d)
  }

  const getEventsForDay = (day: Date) =>
    events.filter((ev) => isSameDay(new Date(ev.date), day))

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header navigation */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <button
          onClick={goToPrev}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-base font-semibold text-slate-900">
          {MOIS[moisCourant.getMonth()]} {moisCourant.getFullYear()}
        </h2>
        <button
          onClick={goToNext}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-slate-100">
        {JOURS.map((j) => (
          <div
            key={j}
            className="py-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider"
          >
            {j}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const isCurrentMonth = day.getMonth() === moisCourant.getMonth()
          const isToday = isSameDay(day, today)
          const dayEvents = getEventsForDay(day)
          const visibleEvents = dayEvents.slice(0, 2)
          const overflowCount = dayEvents.length - visibleEvents.length

          return (
            <div
              key={idx}
              onClick={() => onDateClick(day)}
              className={[
                'min-h-[90px] p-1.5 border-b border-r border-slate-100 cursor-pointer transition-colors',
                isCurrentMonth ? 'bg-white hover:bg-[#EEF5FF]' : 'bg-slate-50',
                isToday ? 'ring-2 ring-inset ring-[#1A5FBF]' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {/* Day number */}
              <div className="flex items-center justify-end mb-1">
                <span
                  className={[
                    'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                    isToday
                      ? 'bg-[#1A5FBF] text-white font-bold'
                      : isCurrentMonth
                      ? 'text-slate-700'
                      : 'text-slate-300',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {day.getDate()}
                </span>
              </div>

              {/* Events */}
              <div className="space-y-0.5">
                {visibleEvents.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onEventClick(ev)
                    }}
                    className={[
                      'w-full text-left px-1.5 py-0.5 rounded text-xs font-medium truncate transition-opacity hover:opacity-80',
                      ev.type === 'RDV'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800',
                    ].join(' ')}
                    title={ev.titre}
                  >
                    <span className="mr-1 opacity-70">{formatHeure(ev.date)}</span>
                    {ev.titre || (ev.type === 'RDV' ? 'RDV' : 'Rappel')}
                  </button>
                ))}
                {overflowCount > 0 && (
                  <p className="text-xs text-slate-400 px-1">+{overflowCount} autre{overflowCount > 1 ? 's' : ''}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
