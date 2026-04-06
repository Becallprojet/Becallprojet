'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import { STADE_LABELS } from '@/lib/utils'
import { StadeProspectBadge } from '@/components/ui/Badge'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Contact {
  id: string
  prenom: string
  nom: string
  societe?: string | null
  stade?: string | null
  commercial?: string | null
  statut: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const KANBAN_STADES = ['NOUVEAU', 'CONTACTE', 'QUALIFIE', 'PROPOSITION', 'NEGOCIE'] as const
const END_STADES = ['GAGNE', 'PERDU'] as const

const STADE_COLORS: Record<string, { header: string; border: string; count: string }> = {
  NOUVEAU:     { header: '#f1f5f9', border: '#cbd5e1', count: '#64748b' },
  CONTACTE:    { header: '#EEF5FF', border: '#93c5fd', count: '#1A5FBF' },
  QUALIFIE:    { header: '#f5f3ff', border: '#c4b5fd', count: '#7C3AED' },
  PROPOSITION: { header: '#fffbeb', border: '#fcd34d', count: '#B45309' },
  NEGOCIE:     { header: '#fff7ed', border: '#fdba74', count: '#C2410C' },
  GAGNE:       { header: '#ecfdf5', border: '#6ee7b7', count: '#065F46' },
  PERDU:       { header: '#fef2f2', border: '#fca5a5', count: '#B91C1C' },
}

// ─── KanbanCard ───────────────────────────────────────────────────────────────

function KanbanCard({ contact, isDragging = false }: { contact: Contact; isDragging?: boolean }) {
  const initials = `${contact.prenom[0] ?? ''}${contact.nom[0] ?? ''}`.toUpperCase()

  return (
    <div
      className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md transition-shadow"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <div className="flex items-start gap-2.5">
        {/* Avatar */}
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #1A5FBF, #00C2FF)' }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 truncate">
            {contact.prenom} {contact.nom}
          </p>
          {contact.societe && (
            <p className="text-xs text-slate-500 truncate">{contact.societe}</p>
          )}
          <div className="mt-1.5 flex items-center justify-between gap-1">
            <StadeProspectBadge stade={contact.stade ?? 'NOUVEAU'} />
            <Link
              href={`/contacts/${contact.id}`}
              className="text-xs font-medium hover:underline flex-shrink-0"
              style={{ color: '#1A5FBF' }}
              onClick={(e) => e.stopPropagation()}
            >
              Voir
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── DraggableCard ────────────────────────────────────────────────────────────

function DraggableCard({ contact }: { contact: Contact }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: contact.id,
    data: { contact },
  })

  const style: React.CSSProperties = {
    cursor: isDragging ? 'grabbing' : 'grab',
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    zIndex: isDragging ? 1000 : undefined,
    position: isDragging ? 'relative' : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <KanbanCard contact={contact} isDragging={isDragging} />
    </div>
  )
}

// ─── DroppableColumn ──────────────────────────────────────────────────────────

function DroppableColumn({
  stade,
  contacts,
  isOver,
}: {
  stade: string
  contacts: Contact[]
  isOver: boolean
}) {
  const { setNodeRef } = useDroppable({ id: stade })
  const colors = STADE_COLORS[stade] ?? { header: '#f1f5f9', border: '#cbd5e1', count: '#64748b' }

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col rounded-xl overflow-hidden"
      style={{
        minWidth: '220px',
        width: '220px',
        border: `1.5px solid ${isOver ? colors.border : '#e2e8f0'}`,
        background: isOver ? colors.header : '#fafafa',
        transition: 'border-color 0.15s, background 0.15s',
        boxShadow: isOver ? `0 0 0 2px ${colors.border}40` : undefined,
      }}
    >
      {/* Column header */}
      <div
        className="px-3 py-2.5 flex items-center justify-between"
        style={{ background: colors.header, borderBottom: `1px solid ${colors.border}` }}
      >
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.count }}>
          {STADE_LABELS[stade] ?? stade}
        </span>
        <span
          className="text-xs font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: 'white', color: colors.count, border: `1px solid ${colors.border}` }}
        >
          {contacts.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 p-2 space-y-2 min-h-[200px]">
        {contacts.map((c) => (
          <DraggableCard key={c.id} contact={c} />
        ))}
        {contacts.length === 0 && (
          <div className="flex items-center justify-center h-16 rounded-lg border-2 border-dashed border-slate-200">
            <span className="text-xs text-slate-400">Aucun prospect</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Pipeline Page ────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [activeContact, setActiveContact] = useState<Contact | null>(null)
  const [overStade, setOverStade] = useState<string | null>(null)
  const [commercialFilter, setCommercialFilter] = useState<string>('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  useEffect(() => {
    fetch('/api/contacts?statut=PROSPECT')
      .then((r) => r.json())
      .then((data: Contact[]) => setContacts(data))
      .finally(() => setLoading(false))
  }, [])

  // Unique commercials for filter
  const commerciaux = useMemo(() => {
    const set = new Set(contacts.map((c) => c.commercial).filter(Boolean) as string[])
    return Array.from(set).sort()
  }, [contacts])

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    if (!commercialFilter) return contacts
    return contacts.filter((c) => c.commercial === commercialFilter)
  }, [contacts, commercialFilter])

  // Group by stade
  const grouped = useMemo(() => {
    const map: Record<string, Contact[]> = {}
    for (const stade of [...KANBAN_STADES, ...END_STADES]) map[stade] = []
    for (const c of filteredContacts) {
      const stade = c.stade ?? 'NOUVEAU'
      if (map[stade]) map[stade].push(c)
      else map['NOUVEAU'].push(c)
    }
    return map
  }, [filteredContacts])

  function handleDragStart(event: DragStartEvent) {
    const c = event.active.data.current?.contact as Contact | undefined
    if (c) setActiveContact(c)
  }

  function handleDragOver(event: DragOverEvent) {
    setOverStade(event.over ? String(event.over.id) : null)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveContact(null)
    setOverStade(null)
    const { active, over } = event
    if (!over) return

    const contactId = String(active.id)
    const newStade = String(over.id)

    if (!KANBAN_STADES.includes(newStade as typeof KANBAN_STADES[number])) return

    const contact = contacts.find((c) => c.id === contactId)
    if (!contact || contact.stade === newStade) return

    // Optimistic update
    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, stade: newStade } : c))
    )

    try {
      const res = await fetch(`/api/contacts/${contactId}/stade`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stade: newStade }),
      })
      if (!res.ok) throw new Error('PATCH failed')
    } catch {
      // Revert on error
      setContacts((prev) =>
        prev.map((c) => (c.id === contactId ? { ...c, stade: contact.stade } : c))
      )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full"
          style={{ borderColor: '#1A5FBF', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0F2A6B' }}>
            Pipeline commercial
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {filteredContacts.length} prospect{filteredContacts.length !== 1 ? 's' : ''} en cours
          </p>
        </div>
        {/* Commercial filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-500 font-medium">Commercial :</label>
          <select
            value={commercialFilter}
            onChange={(e) => setCommercialFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2"
            style={{ color: '#0F2A6B' }}
          >
            <option value="">Tous</option>
            {commerciaux.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban board */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4 flex-1">
          {KANBAN_STADES.map((stade) => (
            <DroppableColumn
              key={stade}
              stade={stade}
              contacts={grouped[stade] ?? []}
              isOver={overStade === stade}
            />
          ))}
        </div>

        <DragOverlay>
          {activeContact && <KanbanCard contact={activeContact} />}
        </DragOverlay>
      </DndContext>

      {/* GAGNE / PERDU counters */}
      <div className="mt-4 flex gap-4">
        {END_STADES.map((stade) => {
          const colors = STADE_COLORS[stade]
          const count = grouped[stade]?.length ?? 0
          return (
            <div
              key={stade}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border"
              style={{ background: colors.header, borderColor: colors.border }}
            >
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.count }}>
                {STADE_LABELS[stade]}
              </span>
              <span
                className="text-sm font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'white', color: colors.count, border: `1px solid ${colors.border}` }}
              >
                {count}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
