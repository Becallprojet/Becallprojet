'use client'

import Link from 'next/link'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { CalendrierEvent } from './types'
import { formatHeure } from './utils'
import { formatDate } from '@/lib/utils'
import { Calendar, Clock, User, FileText, MapPin } from 'lucide-react'

interface RdvDetailPanelProps {
  event: CalendrierEvent | null
  open: boolean
  onClose: () => void
  onEdit: (event: CalendrierEvent) => void
  onDelete: (event: CalendrierEvent) => void
}

function formatDuree(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`
}

export default function RdvDetailPanel({
  event,
  open,
  onClose,
  onEdit,
  onDelete,
}: RdvDetailPanelProps) {
  if (!event) return null

  const date = new Date(event.date)
  const typeLabel = event.type === 'RDV' ? 'Rendez-vous' : 'Rappel'
  const typeColor = event.type === 'RDV' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={event.titre || typeLabel}
      size="md"
    >
      <div className="space-y-4">
        {/* Type badge */}
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${typeColor}`}>
          <Calendar size={12} />
          {typeLabel}
        </span>

        {/* Date and time */}
        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
          <Calendar size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {formatDate(date)} à {formatHeure(date)}
            </p>
            {event.duree && (
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <Clock size={12} />
                Durée : {formatDuree(event.duree)}
              </p>
            )}
          </div>
        </div>

        {/* Prospect */}
        {event.prospectId && event.prospectNom && (
          <div className="flex items-start gap-3">
            <MapPin size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Prospect / Client</p>
              <Link
                href={`/contacts/${event.prospectId}`}
                className="text-sm font-medium text-[#1A5FBF] hover:underline"
                onClick={onClose}
              >
                {event.prospectNom}
              </Link>
            </div>
          </div>
        )}

        {/* Notes */}
        {event.notes && (
          <div className="flex items-start gap-3">
            <FileText size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Notes</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{event.notes}</p>
            </div>
          </div>
        )}

        {/* User */}
        <div className="flex items-start gap-3 pt-2 border-t border-slate-100">
          <User size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Créé par</p>
            <p className="text-sm text-slate-700">{event.userId}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              onClose()
              onDelete(event)
            }}
          >
            Supprimer
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onClose()
              onEdit(event)
            }}
          >
            Modifier
          </Button>
        </div>
      </div>
    </Modal>
  )
}
