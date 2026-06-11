'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Plus, Upload, Send, MessageSquare, Sparkles, Trash2, ExternalLink, AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { StatutLeadLinkedinBadge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'

interface Lead {
  id: string
  prenom: string
  nom: string
  email?: string | null
  telephone?: string | null
  societe?: string | null
  poste?: string | null
  linkedinUrl?: string | null
  linkedinProviderId?: string | null
  statutLinkedin: string
  messagePersonnalise?: string | null
  invitationId?: string | null
  notes?: string | null
  createdAt: string
  opportunite?: { id: string; stade: string } | null
}

interface Campagne {
  id: string
  nom: string
  produit: string
  messageTemplate: string
  statut: string
  leads: Lead[]
  _count: { leads: number }
}

type ImportMode = 'manuel' | 'csv'

const EMPTY_FORM = { prenom: '', nom: '', email: '', telephone: '', linkedinUrl: '', linkedinProviderId: '', societe: '', poste: '' }

export default function CampagneDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [campagne, setCampagne] = useState<Campagne | null>(null)
  const [loading, setLoading] = useState(true)
  const [importMode, setImportMode] = useState<ImportMode>('manuel')
  const [showImport, setShowImport] = useState(false)
  const [manualForm, setManualForm] = useState(EMPTY_FORM)
  const [savingImport, setSavingImport] = useState(false)
  const [csvContent, setCsvContent] = useState('')
  const [csvError, setCsvError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Actions
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Message modal
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageLead, setMessageLead] = useState<Lead | null>(null)
  const [messageTexte, setMessageTexte] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

  const load = useCallback(() => {
    fetch(`/api/leads/campagnes/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) router.push('/leads')
        else setCampagne(data)
      })
      .finally(() => setLoading(false))
  }, [id, router])

  useEffect(() => { load() }, [load])

  const handleManualImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualForm.prenom.trim() || !manualForm.nom.trim()) return
    setSavingImport(true)
    try {
      const res = await fetch(`/api/leads/campagnes/${id}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manualForm),
      })
      if (!res.ok) {
        const d = await res.json()
        alert(d.error || 'Erreur lors de l\'import.')
        return
      }
      setManualForm(EMPTY_FORM)
      setShowImport(false)
      load()
    } finally {
      setSavingImport(false)
    }
  }

  const parseCsv = (text: string): Record<string, string>[] => {
    const lines = text.trim().split('\n').filter(Boolean)
    if (lines.length < 2) return []
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
    return lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim())
      const obj: Record<string, string> = {}
      headers.forEach((h, i) => { obj[h] = values[i] ?? '' })
      return obj
    })
  }

  const handleCsvImport = async () => {
    setCsvError('')
    const rows = parseCsv(csvContent)
    const valid = rows.filter((r) => r.prenom?.trim() && r.nom?.trim())
    if (valid.length === 0) {
      setCsvError('Aucune ligne valide. Colonnes attendues: prenom,nom,email,telephone,linkedin_url,societe,poste')
      return
    }
    setSavingImport(true)
    try {
      const res = await fetch(`/api/leads/campagnes/${id}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(valid),
      })
      if (!res.ok) {
        const d = await res.json()
        setCsvError(d.error || 'Erreur lors de l\'import CSV.')
        return
      }
      setCsvContent('')
      setShowImport(false)
      load()
    } finally {
      setSavingImport(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setCsvContent(ev.target?.result as string)
    reader.readAsText(file)
  }

  const sendInvite = async (lead: Lead) => {
    if (!lead.linkedinProviderId) {
      setActionError(`Provider ID LinkedIn manquant pour ${lead.prenom} ${lead.nom}. Ajoutez-le en modifiant le lead.`)
      return
    }
    setActionLoading(lead.id)
    setActionError(null)
    try {
      const res = await fetch(`/api/leads/${lead.id}/invite`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setActionError(data.error || 'Erreur lors de l\'envoi.')
        return
      }
      load()
    } finally {
      setActionLoading(null)
    }
  }

  const openMessageModal = (lead: Lead) => {
    setMessageLead(lead)
    setMessageTexte(lead.messagePersonnalise ?? '')
    setShowMessageModal(true)
  }

  const sendMessage = async () => {
    if (!messageLead || !messageTexte.trim()) return
    setSendingMessage(true)
    try {
      const res = await fetch(`/api/leads/${messageLead.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texte: messageTexte }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Erreur lors de l\'envoi.')
        return
      }
      setShowMessageModal(false)
      load()
    } finally {
      setSendingMessage(false)
    }
  }

  const createOpportunite = async (lead: Lead) => {
    setActionLoading(lead.id)
    setActionError(null)
    try {
      const res = await fetch(`/api/leads/${lead.id}/opportunite`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setActionError(data.error || 'Erreur lors de la création.')
        return
      }
      load()
    } finally {
      setActionLoading(null)
    }
  }

  const deleteLead = async (lead: Lead) => {
    if (!confirm(`Supprimer ${lead.prenom} ${lead.nom} ?`)) return
    await fetch(`/api/leads/${lead.id}`, { method: 'DELETE' })
    load()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[#1A5FBF] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!campagne) return null

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-3">
          <Link href="/leads" className="text-slate-400 hover:text-slate-600 transition-colors mt-1">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#0F2A6B' }}>{campagne.nom}</h1>
            <p className="text-sm text-slate-500 mt-1 max-w-lg">{campagne.produit}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => { setShowImport(!showImport); setImportMode('manuel') }}>
            <Plus size={15} />
            Importer des leads
          </Button>
        </div>
      </div>

      {/* Message template info */}
      <div className="bg-[#EEF5FF] border border-[#d0dff5] rounded-xl p-4 mb-6">
        <p className="text-xs font-semibold text-[#1A5FBF] uppercase tracking-wider mb-1">Template message</p>
        <p className="text-sm text-slate-700 whitespace-pre-wrap">{campagne.messageTemplate}</p>
      </div>

      {/* Import panel */}
      {showImport && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <div className="flex gap-4 mb-5">
            <button
              onClick={() => setImportMode('manuel')}
              className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${importMode === 'manuel' ? 'bg-[#1A5FBF] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Import manuel
            </button>
            <button
              onClick={() => setImportMode('csv')}
              className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${importMode === 'csv' ? 'bg-[#1A5FBF] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Import CSV
            </button>
          </div>

          {importMode === 'manuel' && (
            <form onSubmit={handleManualImport} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Prénom *</label>
                  <input type="text" value={manualForm.prenom} onChange={(e) => setManualForm((f) => ({ ...f, prenom: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#d0dff5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5FBF]/30" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nom *</label>
                  <input type="text" value={manualForm.nom} onChange={(e) => setManualForm((f) => ({ ...f, nom: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#d0dff5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5FBF]/30" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                  <input type="email" value={manualForm.email} onChange={(e) => setManualForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#d0dff5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5FBF]/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Téléphone</label>
                  <input type="tel" value={manualForm.telephone} onChange={(e) => setManualForm((f) => ({ ...f, telephone: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#d0dff5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5FBF]/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">URL LinkedIn</label>
                  <input type="url" value={manualForm.linkedinUrl} onChange={(e) => setManualForm((f) => ({ ...f, linkedinUrl: e.target.value }))}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full px-3 py-2 text-sm border border-[#d0dff5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5FBF]/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Provider ID LinkedIn
                    <span className="ml-1 text-slate-400 font-normal">(pour envoi via Unipile)</span>
                  </label>
                  <input type="text" value={manualForm.linkedinProviderId} onChange={(e) => setManualForm((f) => ({ ...f, linkedinProviderId: e.target.value }))}
                    placeholder="ACo..."
                    className="w-full px-3 py-2 text-sm border border-[#d0dff5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5FBF]/30 font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Société</label>
                  <input type="text" value={manualForm.societe} onChange={(e) => setManualForm((f) => ({ ...f, societe: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#d0dff5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5FBF]/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Poste</label>
                  <input type="text" value={manualForm.poste} onChange={(e) => setManualForm((f) => ({ ...f, poste: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#d0dff5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5FBF]/30" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowImport(false)} className="px-3 py-2 text-sm text-slate-600 hover:text-slate-800">Annuler</button>
                <Button type="submit" disabled={savingImport} size="sm">
                  {savingImport ? 'Import...' : 'Ajouter le lead'}
                </Button>
              </div>
            </form>
          )}

          {importMode === 'csv' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Format CSV attendu (première ligne = en-têtes) :<br />
                <code className="bg-slate-100 px-2 py-0.5 rounded text-xs">prenom,nom,email,telephone,linkedin_url,linkedin_provider_id,societe,poste</code>
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 text-sm border border-[#d0dff5] rounded-lg hover:bg-slate-50"
                >
                  <Upload size={15} />
                  Choisir un fichier CSV
                </button>
                <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFileChange} className="hidden" />
                {csvContent && <span className="text-xs text-green-600 font-medium">{parseCsv(csvContent).length} lignes détectées</span>}
              </div>
              <textarea
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#d0dff5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5FBF]/30 font-mono resize-none"
                rows={6}
                placeholder="prenom,nom,email,telephone,linkedin_url,linkedin_provider_id,societe,poste&#10;Jean,Dupont,jean@test.com,0612345678,https://linkedin.com/in/jean,ACo123,Acme,CEO"
              />
              {csvError && <p className="text-sm text-red-600">{csvError}</p>}
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowImport(false)} className="px-3 py-2 text-sm text-slate-600 hover:text-slate-800">Annuler</button>
                <Button onClick={handleCsvImport} disabled={savingImport || !csvContent.trim()} size="sm">
                  {savingImport ? 'Import...' : `Importer ${parseCsv(csvContent).filter((r) => r.prenom && r.nom).length} leads`}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error banner */}
      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 flex items-start gap-2 text-sm text-red-700">
          <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Leads table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">{campagne._count.leads} lead{campagne._count.leads !== 1 ? 's' : ''}</h2>
        </div>

        {campagne.leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-400">
            <p className="text-sm">Aucun lead importé</p>
            <button onClick={() => setShowImport(true)} className="mt-2 text-sm text-[#1A5FBF] hover:underline">
              Importer le premier lead
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Lead</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Contact</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Statut</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campagne.leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0077B5, #00A0DC)' }}>
                          {lead.prenom[0]}{lead.nom[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-slate-900">{lead.prenom} {lead.nom}</p>
                            {lead.linkedinUrl && (
                              <a href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#0077B5]">
                                <ExternalLink size={12} />
                              </a>
                            )}
                          </div>
                          {lead.societe && <p className="text-xs text-slate-500">{lead.societe}{lead.poste ? ` — ${lead.poste}` : ''}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="space-y-0.5">
                        {lead.email && <p className="text-xs text-slate-500">{lead.email}</p>}
                        {lead.telephone && <p className="text-xs text-slate-500">{lead.telephone}</p>}
                        {!lead.linkedinProviderId && (
                          <p className="text-xs text-orange-500 font-medium">Provider ID manquant</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatutLeadLinkedinBadge statut={lead.statutLinkedin} />
                      {lead.opportunite && (
                        <Link href="/leads/opportunites" className="ml-2 text-xs text-[#1A5FBF] hover:underline">→ Opport.</Link>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 justify-end">
                        {lead.statutLinkedin === 'IMPORTE' && (
                          <button
                            onClick={() => sendInvite(lead)}
                            disabled={actionLoading === lead.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#EEF5FF] text-[#1A5FBF] hover:bg-[#1A5FBF] hover:text-white transition-colors disabled:opacity-50"
                            title="Envoyer l'invitation LinkedIn"
                          >
                            <Send size={12} />
                            {actionLoading === lead.id ? '...' : 'Inviter'}
                          </button>
                        )}
                        {lead.statutLinkedin === 'CONNECTE' && (
                          <button
                            onClick={() => openMessageModal(lead)}
                            disabled={actionLoading === lead.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-colors disabled:opacity-50"
                            title="Envoyer un message"
                          >
                            <MessageSquare size={12} />
                            Message
                          </button>
                        )}
                        {lead.statutLinkedin === 'REPOND' && !lead.opportunite && (
                          <button
                            onClick={() => createOpportunite(lead)}
                            disabled={actionLoading === lead.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-50 text-green-700 hover:bg-green-600 hover:text-white transition-colors disabled:opacity-50"
                            title="Créer une opportunité"
                          >
                            <Sparkles size={12} />
                            {actionLoading === lead.id ? '...' : 'Créer accroche'}
                          </button>
                        )}
                        <button
                          onClick={() => deleteLead(lead)}
                          className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Message modal */}
      <Modal open={showMessageModal} onClose={() => setShowMessageModal(false)} title={`Envoyer un message à ${messageLead?.prenom ?? ''}`} size="lg">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Ce message sera envoyé via votre compte LinkedIn connecté à Unipile.</p>
          <textarea
            value={messageTexte}
            onChange={(e) => setMessageTexte(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[#d0dff5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5FBF]/30 resize-none"
            rows={6}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowMessageModal(false)}>Annuler</Button>
            <Button onClick={sendMessage} disabled={sendingMessage || !messageTexte.trim()}>
              <Send size={14} />
              {sendingMessage ? 'Envoi...' : 'Envoyer'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
