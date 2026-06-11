'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import {
  DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, useDroppable, useDraggable,
} from '@dnd-kit/core'
import { ChevronLeft, ExternalLink, Euro } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { formatMontant, formatDate } from '@/lib/utils'

interface Opportunite {
  id: string
  stade: string
  notes?: string | null
  valeurEstimee?: number | null
  createdAt: string
  lead: {
    prenom: string
    nom: string
    societe?: string | null
    poste?: string | null
    linkedinUrl?: string | null
    email?: string | null
    telephone?: string | null
    campagne: { nom: string }
  }
}

const STADES = ['NOUVEAU_PROJET', 'EN_NEGOCIATION', 'GAGNE', 'PERDU'] as const
type Stade = typeof STADES[number]

const STADE_CONFIG: Record<Stade, { label: string; header: string; border: string; count: string }> = {
  NOUVEAU_PROJET:  { label: 'Nouveau projet',   header: '#EEF5FF', border: '#93c5fd', count: '#1A5FBF' },
  EN_NEGOCIATION:  { label: 'En négociation',   header: '#fff7ed', border: '#fdba74', count: '#C2410C' },
  GAGNE:           { label: 'Gagné',            header: '#ecfdf5', border: '#6ee7b7', count: '#065F46' },
  PERDU:           { label: 'Perdu',            header: '#fef2f2', border: '#fca5a5', count: '#B91C1C' },
}

function OppCard({ opp, onClick, isDragging = false }: { opp: Opportunite; onClick: () => void; isDragging?: boolean }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <div className="flex items-start gap-2">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0077B5, #00A0DC)' }}>
          {opp.lead.prenom[0]}{opp.lead.nom[0]}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 truncate">{opp.lead.prenom} {opp.lead.nom}</p>
          {opp.lead.societe && <p className="text-xs text-slate-500 truncate">{opp.lead.societe}</p>}
          <p className="text-xs text-slate-400 truncate">{opp.lead.campagne.nom}</p>
          {opp.valeurEstimee != null && (
            <p className="text-xs font-semibold mt-1" style={{ color: '#065F46' }}>{formatMontant(opp.valeurEstimee)}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function DraggableCard({ opp, onClick }: { opp: Opportunite; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: opp.id, data: { opp } })
  return (
    <div
      ref={setNodeRef}
      style={{
        cursor: isDragging ? 'grabbing' : 'grab',
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
        zIndex: isDragging ? 1000 : undefined,
        position: isDragging ? 'relative' : undefined,
      }}
      {...listeners} {...attributes}
    >
      <OppCard opp={opp} onClick={onClick} isDragging={isDragging} />
    </div>
  )
}

function DroppableColumn({ stade, opps, isOver, onCardClick }: { stade: Stade; opps: Opportunite[]; isOver: boolean; onCardClick: (o: Opportunite) => void }) {
  const { setNodeRef } = useDroppable({ id: stade })
  const cfg = STADE_CONFIG[stade]
  return (
    <div
      ref={setNodeRef}
      className="flex flex-col rounded-xl overflow-hidden"
      style={{
        minWidth: '240px', width: '240px',
        border: `1.5px solid ${isOver ? cfg.border : '#e2e8f0'}`,
        background: isOver ? cfg.header : '#fafafa',
        transition: 'border-color 0.15s, background 0.15s',
        boxShadow: isOver ? `0 0 0 2px ${cfg.border}40` : undefined,
      }}
    >
      <div className="px-3 py-2.5 flex items-center justify-between" style={{ background: cfg.header, borderBottom: `1px solid ${cfg.border}` }}>
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: cfg.count }}>{cfg.label}</span>
        <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'white', color: cfg.count, border: `1px solid ${cfg.border}` }}>
          {opps.length}
        </span>
      </div>
      <div className="flex-1 p-2 space-y-2 min-h-[200px]">
        {opps.map((o) => (
          <DraggableCard key={o.id} opp={o} onClick={() => onCardClick(o)} />
        ))}
        {opps.length === 0 && (
          <div className="flex items-center justify-center h-16 rounded-lg border-2 border-dashed border-slate-200">
            <span className="text-xs text-slate-400">Aucune opportunité</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function OpportunitesPage() {
  const [opps, setOpps] = useState<Opportunite[]>([])
  const [loading, setLoading] = useState(true)
  const [activeOpp, setActiveOpp] = useState<Opportunite | null>(null)
  const [overStade, setOverStade] = useState<string | null>(null)
  const [selected, setSelected] = useState<Opportunite | null>(null)
  const [editNotes, setEditNotes] = useState('')
  const [editValeur, setEditValeur] = useState('')
  const [savingDetail, setSavingDetail] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => {
    fetch('/api/opportunites')
      .then((r) => r.json())
      .then((d) => setOpps(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }, [])

  const grouped = useMemo(() => {
    const map: Record<string, Opportunite[]> = {}
    for (const s of STADES) map[s] = []
    for (const o of opps) {
      if (map[o.stade as Stade]) map[o.stade].push(o)
    }
    return map
  }, [opps])

  function handleDragStart(e: DragStartEvent) {
    const o = e.active.data.current?.opp as Opportunite | undefined
    if (o) setActiveOpp(o)
  }
  function handleDragOver(e: DragOverEvent) {
    setOverStade(e.over ? String(e.over.id) : null)
  }
  async function handleDragEnd(e: DragEndEvent) {
    setActiveOpp(null); setOverStade(null)
    const { active, over } = e
    if (!over) return
    const oppId = String(active.id)
    const newStade = String(over.id)
    if (!STADES.includes(newStade as Stade)) return
    const opp = opps.find((o) => o.id === oppId)
    if (!opp || opp.stade === newStade) return
    setOpps((prev) => prev.map((o) => o.id === oppId ? { ...o, stade: newStade } : o))
    try {
      const res = await fetch(`/api/opportunites/${oppId}/stade`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stade: newStade }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setOpps((prev) => prev.map((o) => o.id === oppId ? { ...o, stade: opp.stade } : o))
    }
  }

  const openDetail = (o: Opportunite) => {
    setSelected(o)
    setEditNotes(o.notes ?? '')
    setEditValeur(o.valeurEstimee != null ? String(o.valeurEstimee) : '')
  }

  const saveDetail = async () => {
    if (!selected) return
    setSavingDetail(true)
    try {
      const res = await fetch(`/api/opportunites/${selected.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: editNotes, valeurEstimee: editValeur || null }),
      })
      if (!res.ok) return
      const updated = await res.json()
      setOpps((prev) => prev.map((o) => o.id === selected.id ? { ...o, notes: updated.notes, valeurEstimee: updated.valeurEstimee } : o))
      setSelected(null)
    } finally {
      setSavingDetail(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[#1A5FBF] border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Link href="/leads" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#0F2A6B' }}>Opportunités LinkedIn</h1>
            <p className="text-sm text-slate-500 mt-1">{opps.length} opportunité{opps.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4 flex-1">
          {STADES.map((stade) => (
            <DroppableColumn
              key={stade} stade={stade}
              opps={grouped[stade] ?? []}
              isOver={overStade === stade}
              onCardClick={openDetail}
            />
          ))}
        </div>
        <DragOverlay>
          {activeOpp && <OppCard opp={activeOpp} onClick={() => {}} />}
        </DragOverlay>
      </DndContext>

      {/* Detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `${selected.lead.prenom} ${selected.lead.nom}` : ''} size="lg">
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Société</p>
                <p className="text-sm font-medium text-slate-900">{selected.lead.societe || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Poste</p>
                <p className="text-sm text-slate-900">{selected.lead.poste || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Email</p>
                <p className="text-sm text-slate-900">{selected.lead.email || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Téléphone</p>
                <p className="text-sm text-slate-900">{selected.lead.telephone || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Campagne</p>
                <p className="text-sm text-slate-900">{selected.lead.campagne.nom}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Créée le</p>
                <p className="text-sm text-slate-900">{formatDate(selected.createdAt)}</p>
              </div>
            </div>

            {selected.lead.linkedinUrl && (
              <a href={selected.lead.linkedinUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-[#0077B5] hover:underline">
                <ExternalLink size={13} />
                Voir profil LinkedIn
              </a>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                <Euro size={13} className="inline mr-1" />Valeur estimée (€ HT)
              </label>
              <input
                type="number"
                value={editValeur}
                onChange={(e) => setEditValeur(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#d0dff5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5FBF]/30"
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Notes</label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#d0dff5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5FBF]/30 resize-none"
                rows={4}
                placeholder="Notes sur l'opportunité..."
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="secondary" onClick={() => setSelected(null)}>Annuler</Button>
              <Button onClick={saveDetail} disabled={savingDetail}>
                {savingDetail ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
