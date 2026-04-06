'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CalendarPlus, Calendar } from 'lucide-react'
import Button from '@/components/ui/Button'
import { CalendrierEvent } from '@/components/calendrier/types'
import { getPeriode } from '@/components/calendrier/utils'
import CalendrierMensuel from '@/components/calendrier/CalendrierMensuel'
import CalendrierHebdo from '@/components/calendrier/CalendrierHebdo'
import RdvModal from '@/components/calendrier/RdvModal'
import RdvDetailPanel from '@/components/calendrier/RdvDetailPanel'

type Vue = 'mois' | 'semaine'

function normaliseEvent(raw: {
  id: string
  type: string
  titre?: string | null
  date: string
  duree?: number | null
  notes?: string | null
  userId: string
  fait?: boolean
  prospectId?: string | null
  prospect?: { id: string; prenom: string; nom: string; societe?: string | null } | null
}): CalendrierEvent {
  return {
    id: raw.id,
    titre: raw.titre ?? (raw.type === 'RDV' ? 'Rendez-vous' : 'Rappel'),
    date: raw.date,
    type: raw.type === 'RDV' ? 'RDV' : 'RAPPEL',
    prospectId: raw.prospect?.id ?? raw.prospectId ?? undefined,
    prospectNom: raw.prospect
      ? `${raw.prospect.prenom} ${raw.prospect.nom}${raw.prospect.societe ? ` (${raw.prospect.societe})` : ''}`
      : undefined,
    duree: raw.duree ?? undefined,
    notes: raw.notes ?? undefined,
    userId: raw.userId,
    fait: raw.fait,
  }
}

function CalendrierContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [vue, setVue] = useState<Vue>('mois')
  const [dateCourante, setDateCourante] = useState<Date>(() => {
    const ds = searchParams.get('date')
    return ds ? new Date(ds) : new Date()
  })
  const [events, setEvents] = useState<CalendrierEvent[]>([])
  const [loading, setLoading] = useState(false)

  // RdvModal state
  const [rdvModalOpen, setRdvModalOpen] = useState(false)
  const [rdvDateInitiale, setRdvDateInitiale] = useState<Date | undefined>()
  const [rdvProspectId, setRdvProspectId] = useState<string | undefined>()
  const [rdvExistant, setRdvExistant] = useState<CalendrierEvent | undefined>()

  // Detail panel state
  const [detailEvent, setDetailEvent] = useState<CalendrierEvent | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // Auto-open modal if prospectId is in URL
  const urlProspectId = searchParams.get('prospectId') ?? undefined
  useEffect(() => {
    if (urlProspectId) {
      setRdvProspectId(urlProspectId)
      setRdvDateInitiale(new Date())
      setRdvExistant(undefined)
      setRdvModalOpen(true)
      // Clean URL param after opening
      router.replace('/calendrier', { scroll: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlProspectId])

  const chargerEvents = useCallback(async () => {
    setLoading(true)
    try {
      const { from, to } = getPeriode(vue, dateCourante)
      const params = new URLSearchParams({ from, to })
      const res = await fetch(`/api/calendrier?${params}`)
      if (!res.ok) return
      const data = await res.json()
      const rdvs: CalendrierEvent[] = (data.rdvs ?? []).map(normaliseEvent)
      const rappels: CalendrierEvent[] = (data.rappels ?? []).map(normaliseEvent)
      setEvents([...rdvs, ...rappels])
    } finally {
      setLoading(false)
    }
  }, [vue, dateCourante])

  useEffect(() => {
    chargerEvents()
  }, [chargerEvents])

  const handleDateClick = (date: Date) => {
    // Set time to 9:00 if no specific hour
    const d = new Date(date)
    if (d.getHours() === 0) d.setHours(9, 0, 0, 0)
    setRdvDateInitiale(d)
    setRdvProspectId(undefined)
    setRdvExistant(undefined)
    setRdvModalOpen(true)
  }

  const handleEventClick = (event: CalendrierEvent) => {
    setDetailEvent(event)
    setDetailOpen(true)
  }

  const handleEditFromDetail = (event: CalendrierEvent) => {
    setRdvExistant(event)
    setRdvDateInitiale(undefined)
    setRdvProspectId(undefined)
    setRdvModalOpen(true)
  }

  const handleDeleteFromDetail = async (event: CalendrierEvent) => {
    if (!confirm('Supprimer ce rendez-vous ?')) return
    try {
      const res = await fetch(`/api/calendrier/${event.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      chargerEvents()
    } catch {
      alert('Erreur lors de la suppression.')
    }
  }

  const handleNewRdv = () => {
    setRdvDateInitiale(new Date())
    setRdvProspectId(undefined)
    setRdvExistant(undefined)
    setRdvModalOpen(true)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar size={22} className="text-[#1A5FBF]" />
          <h1 className="text-2xl font-bold text-slate-900">Calendrier</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Vue toggle */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setVue('mois')}
              className={[
                'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
                vue === 'mois'
                  ? 'bg-white text-[#1A5FBF] shadow-sm'
                  : 'text-slate-500 hover:text-slate-700',
              ].join(' ')}
            >
              Mois
            </button>
            <button
              onClick={() => setVue('semaine')}
              className={[
                'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
                vue === 'semaine'
                  ? 'bg-white text-[#1A5FBF] shadow-sm'
                  : 'text-slate-500 hover:text-slate-700',
              ].join(' ')}
            >
              Semaine
            </button>
          </div>

          <Button variant="primary" size="sm" onClick={handleNewRdv}>
            <CalendarPlus size={15} />
            Ajouter un RDV
          </Button>
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin w-6 h-6 border-4 border-[#1A5FBF] border-t-transparent rounded-full" />
        </div>
      )}

      {/* Calendar view */}
      {vue === 'mois' ? (
        <CalendrierMensuel
          events={events}
          moisCourant={dateCourante}
          onDateClick={handleDateClick}
          onEventClick={handleEventClick}
          onNavigate={setDateCourante}
        />
      ) : (
        <CalendrierHebdo
          events={events}
          moisCourant={dateCourante}
          onDateClick={handleDateClick}
          onEventClick={handleEventClick}
          onNavigate={setDateCourante}
        />
      )}

      {/* RDV Modal */}
      <RdvModal
        open={rdvModalOpen}
        onClose={() => setRdvModalOpen(false)}
        onSaved={chargerEvents}
        dateInitiale={rdvDateInitiale}
        prospectId={rdvProspectId}
        rdvExistant={rdvExistant}
      />

      {/* Detail Panel */}
      <RdvDetailPanel
        event={detailEvent}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onEdit={handleEditFromDetail}
        onDelete={handleDeleteFromDetail}
      />
    </div>
  )
}

export default function CalendrierPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-[#1A5FBF] border-t-transparent rounded-full" />
        </div>
      }
    >
      <CalendrierContent />
    </Suspense>
  )
}
