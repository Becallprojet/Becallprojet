'use client'

import { CalendrierEvent } from './types'
import { getDaysInWeek, formatHeure } from './utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const JOURS_COURTS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7) // 7h to 21h

interface CalendrierHebdoProps {
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

function formatDayLabel(date: Date): string {
  return date.getDate().toString()
}

const MOIS_COURTS = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
]

export default function CalendrierHebdo({
  events,
  moisCourant,
  onDateClick,
  onEventClick,
  onNavigate,
}: CalendrierHebdoProps) {
  const today = new Date()
  const days = getDaysInWeek(moisCourant)

  const goToPrev = () => {
    const d = new Date(moisCourant)
    d.setDate(d.getDate() - 7)
    onNavigate(d)
  }

  const goToNext = () => {
    const d = new Date(moisCourant)
    d.setDate(d.getDate() + 7)
    onNavigate(d)
  }

  const weekLabel = () => {
    const first = days[0]
    const last = days[6]
    if (first.getMonth() === last.getMonth()) {
      return `${first.getDate()} – ${last.getDate()} ${MOIS_COURTS[first.getMonth()]} ${first.getFullYear()}`
    }
    return `${first.getDate()} ${MOIS_COURTS[first.getMonth()]} – ${last.getDate()} ${MOIS_COURTS[last.getMonth()]} ${last.getFullYear()}`
  }

  const getEventsForDayHour = (day: Date, hour: number) =>
    events.filter((ev) => {
      const d = new Date(ev.date)
      return isSameDay(d, day) && d.getHours() === hour
    })

  const HOUR_HEIGHT = 56 // px per hour slot

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
        <h2 className="text-base font-semibold text-slate-900">{weekLabel()}</h2>
        <button
          onClick={goToNext}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid border-b border-slate-100" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
        <div /> {/* empty corner */}
        {days.map((day, i) => {
          const isToday = isSameDay(day, today)
          return (
            <div key={i} className="py-2 text-center border-l border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase">{JOURS_COURTS[i]}</p>
              <p
                className={[
                  'text-sm font-bold mx-auto mt-0.5 w-7 h-7 flex items-center justify-center rounded-full',
                  isToday ? 'bg-[#1A5FBF] text-white' : 'text-slate-700',
                ].join(' ')}
              >
                {formatDayLabel(day)}
              </p>
            </div>
          )
        })}
      </div>

      {/* Time grid */}
      <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
        <div className="relative">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="grid border-b border-slate-100"
              style={{ gridTemplateColumns: '56px repeat(7, 1fr)', height: `${HOUR_HEIGHT}px` }}
            >
              {/* Hour label */}
              <div className="flex items-start justify-end pr-2 pt-1">
                <span className="text-xs text-slate-400 font-medium">{hour}:00</span>
              </div>

              {/* Day columns */}
              {days.map((day, di) => {
                const dayEvents = getEventsForDayHour(day, hour)
                return (
                  <div
                    key={di}
                    className="relative border-l border-slate-100 hover:bg-[#EEF5FF] cursor-pointer transition-colors"
                    style={{ height: `${HOUR_HEIGHT}px` }}
                    onClick={() => {
                      const d = new Date(day)
                      d.setHours(hour, 0, 0, 0)
                      onDateClick(d)
                    }}
                  >
                    {dayEvents.map((ev) => {
                      const evDate = new Date(ev.date)
                      const minuteOffset = evDate.getMinutes()
                      const topOffset = (minuteOffset / 60) * HOUR_HEIGHT
                      const durationHeight = ev.duree
                        ? Math.max((ev.duree / 60) * HOUR_HEIGHT, 20)
                        : 40

                      return (
                        <button
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            onEventClick(ev)
                          }}
                          className={[
                            'absolute left-0.5 right-0.5 rounded px-1 py-0.5 text-xs font-medium text-left overflow-hidden hover:opacity-80 transition-opacity',
                            ev.type === 'RDV'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200',
                          ].join(' ')}
                          style={{
                            top: `${topOffset}px`,
                            height: `${durationHeight}px`,
                            zIndex: 1,
                          }}
                          title={ev.titre}
                        >
                          <span className="block font-semibold">{formatHeure(ev.date)}</span>
                          <span className="block truncate">{ev.titre || (ev.type === 'RDV' ? 'RDV' : 'Rappel')}</span>
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
