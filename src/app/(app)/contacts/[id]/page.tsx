'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Edit, Plus, Phone, Mail, MapPin, Building2, FileText, ClipboardList, Trash2, Bell, Clock, CheckCircle2, CalendarPlus, Sparkles, Copy, Check } from 'lucide-react'
import { StatutContactBadge, StatutDevisBadge, StatutBdcBadge, StadeProspectBadge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { formatMontant, formatDate, formatDateInput, TYPE_ACTIVITE_LABELS } from '@/lib/utils'

interface AiAction {
  type: string
  suggestion: string
  urgence: 'HAUTE' | 'MOYENNE' | 'FAIBLE'
}

interface AiResult {
  email: string
  action: AiAction
}

interface Contact {
  id: string
  statut: string
  stade?: string
  numeroClient?: string
  civilite?: string
  prenom: string
  nom: string
  societe?: string
  poste?: string
  email: string
  telephoneFixe?: string
  telephoneMobile?: string
  adresseFacturation?: string
  adresseInstallation?: string
  codePostal?: string
  ville?: string
  sourceLead?: string
  commercial?: string
  notes?: string
  createdAt: string
  devis: Array<{ id: string; numero: string; objet: string; statut: string; totalTTC: number; createdAt: string }>
  bonsDeCommande: Array<{ id: string; numero: string; statut: string; totalTTC: number; createdAt: string }>
}

interface Activite {
  id: string
  type: string
  date: string
  duree?: number
  notes?: string
  user: { prenom: string; nom: string }
}

interface Rappel {
  id: string
  date: string
  titre: string
  notes?: string
  fait: boolean
  user: { prenom: string; nom: string }
}

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [activites, setActivites] = useState<Activite[]>([])
  const [rappels, setRappels] = useState<Rappel[]>([])
  const [activiteForm, setActiviteForm] = useState({ type: 'APPEL', date: formatDateInput(new Date()), duree: '', notes: '' })
  const [rappelForm, setRappelForm] = useState({ titre: '', date: formatDateInput(new Date()), notes: '' })
  const [savingActivite, setSavingActivite] = useState(false)
  const [savingRappel, setSavingRappel] = useState(false)
  const [showActiviteForm, setShowActiviteForm] = useState(false)
  const [showRappelForm, setShowRappelForm] = useState(false)
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState<AiResult | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [emailCopied, setEmailCopied] = useState(false)

  useEffect(() => {
    fetch(`/api/contacts/${id}`)
      .then((r) => r.json())
      .then(setContact)
      .finally(() => setLoading(false))
    fetch(`/api/contacts/${id}/activites`)
      .then((r) => r.json())
      .then(setActivites)
    fetch(`/api/contacts/${id}/rappels`)
      .then((r) => r.json())
      .then(setRappels)
  }, [id])

  const handleAddActivite = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingActivite(true)
    try {
      const res = await fetch(`/api/contacts/${id}/activites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activiteForm),
      })
      if (!res.ok) throw new Error()
      const newActivite = await res.json()
      setActivites((prev) => [newActivite, ...prev])
      setActiviteForm({ type: 'APPEL', date: formatDateInput(new Date()), duree: '', notes: '' })
      setShowActiviteForm(false)
    } catch {
      alert("Erreur lors de l'ajout de l'activité.")
    } finally {
      setSavingActivite(false)
    }
  }

  const handleAddRappel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rappelForm.titre) return
    setSavingRappel(true)
    try {
      const res = await fetch(`/api/contacts/${id}/rappels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rappelForm),
      })
      if (!res.ok) throw new Error()
      const newRappel = await res.json()
      setRappels((prev) => [...prev, newRappel])
      setRappelForm({ titre: '', date: formatDateInput(new Date()), notes: '' })
      setShowRappelForm(false)
    } catch {
      alert("Erreur lors de l'ajout du rappel.")
    } finally {
      setSavingRappel(false)
    }
  }

  const handleRappelFait = async (rappelId: string) => {
    try {
      const res = await fetch(`/api/contacts/${id}/rappels/${rappelId}`, { method: 'PATCH' })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setRappels((prev) => prev.map((r) => (r.id === rappelId ? updated : r)))
    } catch {
      alert('Erreur lors de la mise à jour du rappel.')
    }
  }

  const handleAiSuggest = useCallback(async () => {
    setShowAiModal(true)
    setAiLoading(true)
    setAiError(null)
    setAiResult(null)
    setEmailCopied(false)
    try {
      const res = await fetch(`/api/contacts/${id}/ai-suggest`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setAiError(data.error || 'Erreur lors de la génération de la suggestion.')
      } else {
        setAiResult(data)
      }
    } catch {
      setAiError('Erreur réseau. Vérifiez votre connexion.')
    } finally {
      setAiLoading(false)
    }
  }, [id])

  const handleCopyEmail = async () => {
    if (!aiResult?.email) return
    await navigator.clipboard.writeText(aiResult.email)
    setEmailCopied(true)
    setTimeout(() => setEmailCopied(false), 2000)
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer ce prospect ? Cette action est irréversible.')) return
    const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' })
    if (res.ok) router.push('/contacts')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[#1A5FBF] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!contact) return <p className="text-slate-500">Prospect introuvable.</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/contacts" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">
                {contact.civilite} {contact.prenom} {contact.nom}
              </h1>
              <StatutContactBadge statut={contact.statut} />
              {contact.stade && <StadeProspectBadge stade={contact.stade} />}
            </div>
            {contact.numeroClient && (
              <p className="text-xs text-slate-400 mt-1 font-mono">N° client : {contact.numeroClient}</p>
            )}
            {contact.societe && (
              <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                <Building2 size={14} />
                {contact.societe}
                {contact.poste && ` — ${contact.poste}`}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleAiSuggest}>
            <Sparkles size={15} />
            Suggérer une relance
          </Button>
          <Link href={`/devis/new?contactId=${id}`}>
            <Button variant="secondary" size="sm">
              <Plus size={15} />
              Nouveau devis
            </Button>
          </Link>
          <Link href={`/calendrier?prospectId=${id}`}>
            <Button variant="outline" size="sm">
              <CalendarPlus size={15} />
              Planifier un RDV
            </Button>
          </Link>
          <Link href={`/contacts/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit size={15} />
              Modifier
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleDelete} className="text-red-600 hover:bg-red-50">
            <Trash2 size={15} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Infos */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider">Coordonnées</h3>
            <div className="space-y-3">
              <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-sm text-slate-700 hover:text-[#1A5FBF]">
                <Mail size={15} className="text-slate-400 flex-shrink-0" />
                {contact.email}
              </a>
              {contact.telephoneMobile && (
                <a href={`tel:${contact.telephoneMobile}`} className="flex items-center gap-2 text-sm text-slate-700 hover:text-[#1A5FBF]">
                  <Phone size={15} className="text-slate-400 flex-shrink-0" />
                  {contact.telephoneMobile} (mobile)
                </a>
              )}
              {contact.telephoneFixe && (
                <a href={`tel:${contact.telephoneFixe}`} className="flex items-center gap-2 text-sm text-slate-700 hover:text-[#1A5FBF]">
                  <Phone size={15} className="text-slate-400 flex-shrink-0" />
                  {contact.telephoneFixe} (fixe)
                </a>
              )}
              {(contact.adresseFacturation || contact.ville) && (
                <div className="flex items-start gap-2 text-sm text-slate-700">
                  <MapPin size={15} className="text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    {contact.adresseFacturation && <p>{contact.adresseFacturation}</p>}
                    {(contact.codePostal || contact.ville) && (
                      <p>{contact.codePostal} {contact.ville}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider">Commercial</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Assigné à</span>
                <span className="text-sm text-slate-900">{contact.commercial || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Source</span>
                <span className="text-sm text-slate-900">{contact.sourceLead || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Créé le</span>
                <span className="text-sm text-slate-900">{formatDate(contact.createdAt)}</span>
              </div>
            </div>
          </div>

          {contact.notes && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Notes</h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{contact.notes}</p>
            </div>
          )}
        </div>

        {/* Historique */}
        <div className="lg:col-span-2 space-y-6">
          {/* Devis */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <FileText size={16} className="text-slate-400" />
                Devis ({contact.devis.length})
              </h2>
              <Link href={`/devis/new?contactId=${id}`} className="text-sm text-[#1A5FBF] hover:underline flex items-center gap-1">
                <Plus size={14} />
                Nouveau devis
              </Link>
            </div>
            {contact.devis.length === 0 ? (
              <p className="px-6 py-4 text-sm text-slate-400">Aucun devis</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {contact.devis.map((d) => (
                  <Link
                    key={d.id}
                    href={`/devis/${d.id}`}
                    className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{d.numero}</p>
                      <p className="text-xs text-slate-500">{d.objet} — {formatDate(d.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-slate-900">{formatMontant(d.totalTTC)}</span>
                      <StatutDevisBadge statut={d.statut} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* BDC */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <ClipboardList size={16} className="text-slate-400" />
                Bons de commande ({contact.bonsDeCommande.length})
              </h2>
            </div>
            {contact.bonsDeCommande.length === 0 ? (
              <p className="px-6 py-4 text-sm text-slate-400">Aucun bon de commande</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {contact.bonsDeCommande.map((b) => (
                  <Link
                    key={b.id}
                    href={`/bdc/${b.id}`}
                    className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{b.numero}</p>
                      <p className="text-xs text-slate-500">{formatDate(b.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-slate-900">{formatMontant(b.totalTTC)}</span>
                      <StatutBdcBadge statut={b.statut} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Historique des activités */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <Clock size={16} className="text-slate-400" />
                Historique des activités ({activites.length})
              </h2>
              <button
                onClick={() => setShowActiviteForm(!showActiviteForm)}
                className="text-sm text-[#1A5FBF] hover:underline flex items-center gap-1"
              >
                <Plus size={14} />
                Ajouter
              </button>
            </div>

            {showActiviteForm && (
              <form onSubmit={handleAddActivite} className="px-6 py-4 border-b border-slate-100 bg-slate-50 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
                    <select
                      value={activiteForm.type}
                      onChange={(e) => setActiviteForm((f) => ({ ...f, type: e.target.value }))}
                      className="w-full px-3 py-1.5 text-sm border border-[#d0dff5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5FBF]/30 bg-white"
                    >
                      <option value="APPEL">Appel</option>
                      <option value="RDV">Rendez-vous</option>
                      <option value="EMAIL">Email</option>
                      <option value="NOTE">Note</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
                    <input
                      type="date"
                      value={activiteForm.date}
                      onChange={(e) => setActiviteForm((f) => ({ ...f, date: e.target.value }))}
                      className="w-full px-3 py-1.5 text-sm border border-[#d0dff5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5FBF]/30"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Durée (min)</label>
                    <input
                      type="number"
                      value={activiteForm.duree}
                      onChange={(e) => setActiviteForm((f) => ({ ...f, duree: e.target.value }))}
                      className="w-full px-3 py-1.5 text-sm border border-[#d0dff5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5FBF]/30"
                      placeholder="Optionnel"
                      min="0"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                    <textarea
                      value={activiteForm.notes}
                      onChange={(e) => setActiviteForm((f) => ({ ...f, notes: e.target.value }))}
                      className="w-full px-3 py-1.5 text-sm border border-[#d0dff5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5FBF]/30 resize-none"
                      rows={2}
                      placeholder="Notes..."
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowActiviteForm(false)}
                    className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={savingActivite}
                    className="px-3 py-1.5 text-sm bg-[#1A5FBF] text-white rounded-lg hover:bg-[#0F2A6B] disabled:opacity-50"
                  >
                    {savingActivite ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            )}

            {activites.length === 0 ? (
              <p className="px-6 py-4 text-sm text-slate-400">Aucune activité enregistrée</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {activites.map((a) => (
                  <div key={a.id} className="px-6 py-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {TYPE_ACTIVITE_LABELS[a.type] ?? a.type}
                          {a.duree ? <span className="ml-2 text-xs text-slate-400">{a.duree} min</span> : null}
                        </p>
                        {a.notes && <p className="text-xs text-slate-500 mt-0.5">{a.notes}</p>}
                        <p className="text-xs text-slate-400 mt-0.5">{a.user.prenom} {a.user.nom}</p>
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap ml-3">{formatDate(a.date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rappels */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <Bell size={16} className="text-slate-400" />
                Rappels ({rappels.length})
              </h2>
              <button
                onClick={() => setShowRappelForm(!showRappelForm)}
                className="text-sm text-[#1A5FBF] hover:underline flex items-center gap-1"
              >
                <Plus size={14} />
                Ajouter
              </button>
            </div>

            {showRappelForm && (
              <form onSubmit={handleAddRappel} className="px-6 py-4 border-b border-slate-100 bg-slate-50 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Titre *</label>
                    <input
                      type="text"
                      value={rappelForm.titre}
                      onChange={(e) => setRappelForm((f) => ({ ...f, titre: e.target.value }))}
                      className="w-full px-3 py-1.5 text-sm border border-[#d0dff5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5FBF]/30"
                      placeholder="Rappeler pour..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
                    <input
                      type="date"
                      value={rappelForm.date}
                      onChange={(e) => setRappelForm((f) => ({ ...f, date: e.target.value }))}
                      className="w-full px-3 py-1.5 text-sm border border-[#d0dff5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5FBF]/30"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                    <input
                      type="text"
                      value={rappelForm.notes}
                      onChange={(e) => setRappelForm((f) => ({ ...f, notes: e.target.value }))}
                      className="w-full px-3 py-1.5 text-sm border border-[#d0dff5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5FBF]/30"
                      placeholder="Optionnel"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowRappelForm(false)}
                    className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={savingRappel}
                    className="px-3 py-1.5 text-sm bg-[#1A5FBF] text-white rounded-lg hover:bg-[#0F2A6B] disabled:opacity-50"
                  >
                    {savingRappel ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            )}

            {rappels.length === 0 ? (
              <p className="px-6 py-4 text-sm text-slate-400">Aucun rappel</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {rappels.map((r) => (
                  <div key={r.id} className={`px-6 py-3 flex items-start justify-between ${r.fait ? 'opacity-50' : ''}`}>
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => !r.fait && handleRappelFait(r.id)}
                        className={`mt-0.5 flex-shrink-0 ${r.fait ? 'text-green-500 cursor-default' : 'text-slate-300 hover:text-green-500'}`}
                        title={r.fait ? 'Fait' : 'Marquer comme fait'}
                        disabled={r.fait}
                      >
                        <CheckCircle2 size={16} />
                      </button>
                      <div>
                        <p className={`text-sm font-medium ${r.fait ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {r.titre}
                        </p>
                        {r.notes && <p className="text-xs text-slate-500 mt-0.5">{r.notes}</p>}
                        <p className="text-xs text-slate-400 mt-0.5">{r.user.prenom} {r.user.nom}</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap ml-3">{formatDate(r.date)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal IA */}
      <Modal
        open={showAiModal}
        onClose={() => setShowAiModal(false)}
        title="Suggestion de relance IA"
        size="xl"
      >
        {aiLoading && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="animate-spin w-10 h-10 border-4 border-[#1A5FBF] border-t-transparent rounded-full" />
            <p className="text-sm text-slate-500">L&apos;IA analyse le dossier...</p>
          </div>
        )}

        {!aiLoading && aiError && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 w-full">
              <p className="text-sm text-red-700">{aiError}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleAiSuggest}>
              <Sparkles size={14} />
              Réessayer
            </Button>
          </div>
        )}

        {!aiLoading && aiResult && (
          <div className="space-y-5">
            {/* Email de relance */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Email de relance</h4>
                <button
                  onClick={handleCopyEmail}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  {emailCopied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                  {emailCopied ? 'Copié !' : 'Copier'}
                </button>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{aiResult.email}</pre>
              </div>
            </div>

            {/* Action recommandée */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-2">Action recommandée</h4>
              <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-semibold text-slate-800">{aiResult.action.type}</span>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      aiResult.action.urgence === 'HAUTE'
                        ? 'bg-red-100 text-red-700'
                        : aiResult.action.urgence === 'MOYENNE'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    Urgence {aiResult.action.urgence}
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{aiResult.action.suggestion}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
