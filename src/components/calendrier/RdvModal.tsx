'use client'

import { useEffect, useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import { CalendrierEvent } from './types'
import { formatDateTimeLocal } from './utils'

interface Contact {
  id: string
  prenom: string
  nom: string
  societe?: string
}

interface RdvModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  dateInitiale?: Date
  prospectId?: string
  rdvExistant?: CalendrierEvent
}

const DUREES = [
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '1h' },
  { value: '90', label: '1h30' },
  { value: '120', label: '2h' },
]

export default function RdvModal({
  open,
  onClose,
  onSaved,
  dateInitiale,
  prospectId,
  rdvExistant,
}: RdvModalProps) {
  const isEdit = !!rdvExistant

  const getInitialDateTime = () => {
    if (rdvExistant) return formatDateTimeLocal(new Date(rdvExistant.date))
    if (dateInitiale) return formatDateTimeLocal(dateInitiale)
    return formatDateTimeLocal(new Date())
  }

  const [titre, setTitre] = useState(rdvExistant?.titre ?? '')
  const [dateTime, setDateTime] = useState(getInitialDateTime())
  const [duree, setDuree] = useState(rdvExistant?.duree?.toString() ?? '60')
  const [selectedProspectId, setSelectedProspectId] = useState(
    rdvExistant?.prospectId ?? prospectId ?? ''
  )
  const [notes, setNotes] = useState(rdvExistant?.notes ?? '')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (open) {
      fetch('/api/contacts?limit=200')
        .then((r) => r.json())
        .then((data) => {
          const list = Array.isArray(data) ? data : data.contacts ?? []
          setContacts(list)
        })
        .catch(() => setContacts([]))
    }
  }, [open])

  // Reset form when modal opens / rdvExistant changes
  useEffect(() => {
    if (open) {
      setTitre(rdvExistant?.titre ?? '')
      setDateTime(getInitialDateTime())
      setDuree(rdvExistant?.duree?.toString() ?? '60')
      setSelectedProspectId(rdvExistant?.prospectId ?? prospectId ?? '')
      setNotes(rdvExistant?.notes ?? '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, rdvExistant, dateInitiale, prospectId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        titre: titre || null,
        date: new Date(dateTime).toISOString(),
        duree: duree ? parseInt(duree) : null,
        prospectId: selectedProspectId || null,
        notes: notes || null,
      }

      const url = isEdit ? `/api/calendrier/${rdvExistant!.id}` : '/api/calendrier'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error()
      onSaved()
      onClose()
    } catch {
      alert("Erreur lors de l'enregistrement du rendez-vous.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!rdvExistant) return
    if (!confirm('Supprimer ce rendez-vous ?')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/calendrier/${rdvExistant.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      onSaved()
      onClose()
    } catch {
      alert('Erreur lors de la suppression.')
    } finally {
      setDeleting(false)
    }
  }

  const contactOptions = [
    { value: '', label: '— Aucun prospect —' },
    ...contacts.map((c) => ({
      value: c.id,
      label: `${c.prenom} ${c.nom}${c.societe ? ` (${c.societe})` : ''}`,
    })),
  ]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Titre"
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          placeholder="Ex: Présentation offre, Démo produit..."
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Date et heure
            </label>
            <input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm rounded-lg bg-white text-[#1C1C2E] border border-[#d0dff5] focus:outline-none focus:ring-2 focus:ring-[#1A5FBF]/30 focus:border-[#1A5FBF]"
            />
          </div>
        </div>

        <Select
          label="Durée"
          value={duree}
          onChange={(e) => setDuree(e.target.value)}
          options={DUREES}
        />

        <Select
          label="Prospect / Client"
          value={selectedProspectId}
          onChange={(e) => setSelectedProspectId(e.target.value)}
          options={contactOptions}
        />

        <Textarea
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes, informations complémentaires..."
          rows={3}
        />

        <div className="flex items-center justify-between pt-2">
          {isEdit ? (
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleDelete}
              loading={deleting}
            >
              Supprimer
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={saving}>
              {isEdit ? 'Enregistrer' : 'Créer le RDV'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
