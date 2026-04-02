'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Printer, Mail, CheckCircle, XCircle, ClipboardList, Trash2, Ban, Download } from 'lucide-react'
import { StatutDevisBadge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import { formatMontant, formatDate } from '@/lib/utils'

interface LigneDevis {
  id: string
  type: string
  ordre: number
  designation: string
  description?: string
  quantite: number
  prixUnitaireHT: number
  totalHT: number
}

interface Devis {
  id: string
  numero: string
  objet: string
  statut: string
  dureeEngagement?: number
  validite: number
  conditions?: string
  notes?: string
  totalAbonnementHT: number
  totalPrestationsHT: number
  totalHT: number
  tva: number
  totalTTC: number
  dateEnvoi?: string
  dateAcceptation?: string
  createdAt: string
  contact: {
    id: string; prenom: string; nom: string; societe?: string; email: string
    telephoneFixe?: string; telephoneMobile?: string
    adresseFacturation?: string; codePostal?: string; ville?: string
  }
  lignes: LigneDevis[]
  bonDeCommande?: { id: string; numero: string; statut: string }
}

export default function DevisDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [devis, setDevis] = useState<Devis | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailForm, setEmailForm] = useState({ to: '', subject: '', message: '' })
  const [emailLoading, setEmailLoading] = useState(false)

  const loadDevis = () => {
    fetch(`/api/devis/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setDevis(data)
        if (data?.contact?.email) {
          setEmailForm((prev) => ({
            ...prev,
            to: data.contact.email,
            subject: `Devis ${data.numero} — ${data.objet}`,
            message: `Bonjour ${data.contact.prenom},\n\nVeuillez trouver ci-joint notre devis ${data.numero} pour "${data.objet}".\n\nN'hésitez pas à nous contacter pour toute question.\n\nCordialement`,
          }))
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadDevis() }, [id]) // eslint-disable-line

  const updateStatut = async (statut: string) => {
    setActionLoading(true)
    try {
      await fetch(`/api/devis/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...devis, statut, lignes: devis?.lignes }),
      })
      loadDevis()
    } finally {
      setActionLoading(false)
    }
  }

  const handleAccept = async () => {
    if (!confirm('Accepter ce devis et générer un bon de commande ?')) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/devis/${id}/accept`, { method: 'POST' })
      const data = await res.json()
      if (res.status === 409 && data.bdcId) {
        router.push(`/bdc/${data.bdcId}`)
        return
      }
      if (!res.ok) throw new Error()
      router.push(`/bdc/${data.id}`)
    } catch {
      alert('Erreur lors de la conversion en bon de commande.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAbandon = async () => {
    if (!confirm('Abandonner ce devis ? Il sera retiré du CA signé et le BDC associé sera annulé.')) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/devis/${id}/abandon`, { method: 'POST' })
      if (!res.ok) throw new Error()
      loadDevis()
    } catch {
      alert('Erreur lors de l\'abandon du devis.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer ce devis ?')) return
    const res = await fetch(`/api/devis/${id}`, { method: 'DELETE' })
    if (res.ok) router.push('/devis')
    else alert('Impossible de supprimer ce devis.')
  }

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailLoading(true)
    try {
      const res = await fetch(`/api/devis/${id}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailForm),
      })
      if (!res.ok) throw new Error()
      setShowEmailModal(false)
      loadDevis()
      alert('Email envoyé avec succès !')
    } catch {
      alert('Erreur lors de l\'envoi de l\'email.')
    } finally {
      setEmailLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[#1A5FBF] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!devis) return <p className="text-slate-500">Devis introuvable.</p>

  const canEdit = devis.statut !== 'ACCEPTE' && devis.statut !== 'ABANDONNE'
  const abonnementLignes = devis.lignes.filter((l) => l.type === 'ABONNEMENT')
  const locationLignes = devis.lignes.filter((l) => l.type === 'LOCATION')
  const prestationLignes = devis.lignes.filter((l) => l.type === 'PRESTATION')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/devis" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 font-mono">{devis.numero}</h1>
              <StatutDevisBadge statut={devis.statut} />
            </div>
            <p className="text-sm text-slate-500 mt-1">{devis.objet}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {devis.bonDeCommande ? (
            <Link href={`/bdc/${devis.bonDeCommande.id}`}>
              <Button variant="secondary" size="sm">
                <ClipboardList size={15} />
                Voir le BDC {devis.bonDeCommande.numero}
              </Button>
            </Link>
          ) : (
            devis.statut !== 'REFUSE' && devis.statut !== 'ACCEPTE' && (
              <Button variant="secondary" size="sm" onClick={() => updateStatut(devis.statut === 'ENVOYE' ? 'BROUILLON' : 'ENVOYE')} loading={actionLoading}>
                {devis.statut === 'ENVOYE' ? 'Remettre en brouillon' : 'Marquer envoyé'}
              </Button>
            )
          )}

          {devis.statut === 'ACCEPTE' && (
            <Button variant="ghost" size="sm" onClick={handleAbandon} loading={actionLoading} className="text-orange-600 hover:bg-orange-50">
              <Ban size={15} />
              Abandonner
            </Button>
          )}

          {!devis.bonDeCommande && devis.statut !== 'ACCEPTE' && devis.statut !== 'REFUSE' && devis.statut !== 'ABANDONNE' && (
            <>
              <Button variant="ghost" size="sm" onClick={() => updateStatut('REFUSE')} loading={actionLoading} className="text-red-600 hover:bg-red-50">
                <XCircle size={15} />
                Refuser
              </Button>
              <Button size="sm" onClick={handleAccept} loading={actionLoading} className="bg-green-600 hover:bg-green-700">
                <CheckCircle size={15} />
                Accepter → BDC
              </Button>
            </>
          )}

          <Button variant="outline" size="sm" onClick={() => setShowEmailModal(true)}>
            <Mail size={15} />
            Envoyer
          </Button>

          <Link href={`/print/devis/${id}`} target="_blank">
            <Button variant="outline" size="sm">
              <Printer size={15} />
              Imprimer
            </Button>
          </Link>

          <a href={`/api/pdf/devis/${id}`} download>
            <Button variant="outline" size="sm">
              <Download size={15} />
              Télécharger PDF
            </Button>
          </a>

          {canEdit && (
            <Button variant="ghost" size="sm" onClick={handleDelete} className="text-red-600 hover:bg-red-50">
              <Trash2 size={15} />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Infos */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Client</p>
                <Link href={`/contacts/${devis.contact.id}`} className="text-sm font-medium text-[#0F2A6B] hover:underline mt-1 block">
                  {devis.contact.societe || `${devis.contact.prenom} ${devis.contact.nom}`}
                </Link>
                {devis.contact.societe && (
                  <p className="text-xs text-slate-500">{devis.contact.prenom} {devis.contact.nom}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Date</p>
                <p className="text-sm font-medium text-slate-900 mt-1">{formatDate(devis.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Engagement</p>
                <p className="text-sm font-medium text-slate-900 mt-1">
                  {devis.dureeEngagement ? `${devis.dureeEngagement} mois` : 'Sans engagement'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Validité</p>
                <p className="text-sm font-medium text-slate-900 mt-1">{devis.validite} jours</p>
              </div>
            </div>
            {devis.dateEnvoi && (
              <p className="text-xs text-slate-400 mt-4">Envoyé le {formatDate(devis.dateEnvoi)}</p>
            )}
            {devis.dateAcceptation && (
              <p className="text-xs text-green-600 mt-1">Accepté le {formatDate(devis.dateAcceptation)}</p>
            )}
          </div>

          {/* Abonnements services */}
          {abonnementLignes.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-[#0F2A6B]/5 border-b border-[#0F2A6B]/10">
                <h3 className="text-sm font-semibold text-[#0F2A6B]">Abonnements services</h3>
              </div>
              <LignesTable lignes={abonnementLignes} unite="/mois" />
            </div>
          )}

          {/* Location de matériel */}
          {locationLignes.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-[#0F2A6B]/5 border-b border-[#0F2A6B]/10">
                <h3 className="text-sm font-semibold text-[#0F2A6B]">Location de matériel</h3>
              </div>
              <LignesTable lignes={locationLignes} unite="/mois" hidePrice />
            </div>
          )}

          {/* Prestations ponctuelles */}
          {prestationLignes.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-[#1C1C2E]/5 border-b border-[#1C1C2E]/10">
                <h3 className="text-sm font-semibold text-[#1C1C2E]">Prestations ponctuelles</h3>
              </div>
              <LignesTable lignes={prestationLignes} />
            </div>
          )}

          {devis.conditions && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Conditions</h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{devis.conditions}</p>
            </div>
          )}
        </div>

        {/* Récap */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Récapitulatif</h3>
            <div className="space-y-3">
              {devis.totalAbonnementHT > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Abonnements HT</span>
                  <span className="font-medium">{formatMontant(devis.totalAbonnementHT)}/mois</span>
                </div>
              )}
              {devis.totalPrestationsHT > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Prestations HT</span>
                  <span className="font-medium">{formatMontant(devis.totalPrestationsHT)}</span>
                </div>
              )}
              <div className="border-t border-slate-100 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Total HT</span>
                  <span className="font-medium">{formatMontant(devis.totalHT)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">TVA 20%</span>
                  <span className="font-medium">{formatMontant(devis.tva)}</span>
                </div>
                <div className="flex justify-between text-base font-bold border-t border-slate-200 pt-2">
                  <span>Total TTC</span>
                  <span className="text-[#0F2A6B]">{formatMontant(devis.totalTTC)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact infos */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Contact</h3>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-900">{devis.contact.prenom} {devis.contact.nom}</p>
              {devis.contact.societe && <p className="text-sm text-slate-600">{devis.contact.societe}</p>}
              <p className="text-sm text-slate-500">{devis.contact.email}</p>
              {devis.contact.telephoneMobile && <p className="text-sm text-slate-500">{devis.contact.telephoneMobile}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Email Modal */}
      <Modal open={showEmailModal} onClose={() => setShowEmailModal(false)} title="Envoyer par email" size="md">
        <form onSubmit={handleSendEmail} className="space-y-4">
          <Input
            label="Destinataire *"
            type="email"
            value={emailForm.to}
            onChange={(e) => setEmailForm((p) => ({ ...p, to: e.target.value }))}
            required
          />
          <Input
            label="Objet *"
            value={emailForm.subject}
            onChange={(e) => setEmailForm((p) => ({ ...p, subject: e.target.value }))}
            required
          />
          <Textarea
            label="Message"
            value={emailForm.message}
            onChange={(e) => setEmailForm((p) => ({ ...p, message: e.target.value }))}
            rows={6}
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowEmailModal(false)}>Annuler</Button>
            <Button type="submit" loading={emailLoading}>
              <Mail size={15} />
              Envoyer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function LignesTable({ lignes, unite, hidePrice }: { lignes: LigneDevis[]; unite?: string; hidePrice?: boolean }) {
  const sous_total = lignes.reduce((sum, l) => sum + l.totalHT, 0)
  return (
    <table className="w-full">
      <thead>
        <tr className="bg-slate-50 border-b border-slate-100">
          <th className="text-left px-6 py-2.5 text-xs font-medium text-slate-500 uppercase">Désignation</th>
          <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500 uppercase">Qté</th>
          {!hidePrice && <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500 uppercase">PU HT{unite}</th>}
          <th className="text-right px-6 py-2.5 text-xs font-medium text-slate-500 uppercase">Total HT{unite}</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {lignes.map((l) => (
          <tr key={l.id}>
            <td className="px-6 py-3">
              <p className="text-sm font-medium text-slate-900">{l.designation}</p>
              {l.description && <p className="text-xs text-slate-400 mt-0.5">{l.description}</p>}
            </td>
            <td className="px-4 py-3 text-center text-sm text-slate-700">{l.quantite}</td>
            {!hidePrice && <td className="px-4 py-3 text-right text-sm text-slate-700">{formatMontant(l.prixUnitaireHT)}</td>}
            <td className="px-6 py-3 text-right text-sm text-slate-400">{hidePrice ? '—' : <span className="font-semibold text-slate-900">{formatMontant(l.totalHT)}</span>}</td>
          </tr>
        ))}
        <tr className="border-t-2 border-[#0F2A6B]/20 bg-[#0F2A6B]/5">
          <td colSpan={hidePrice ? 2 : 3} className="px-6 py-2.5 text-right text-xs text-slate-500 italic">
            Sous-total{unite}
          </td>
          <td className="px-6 py-2.5 text-right text-sm font-bold text-[#0F2A6B]">{formatMontant(sous_total)}</td>
        </tr>
      </tbody>
    </table>
  )
}
