'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Printer, Mail, CheckCircle, XCircle, Download } from 'lucide-react'
import { StatutBdcBadge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import { formatMontant, formatDate } from '@/lib/utils'

interface LigneBdc {
  id: string
  type: string
  ordre: number
  designation: string
  description?: string
  quantite: number
  prixUnitaireHT: number
  totalHT: number
}

interface Bdc {
  id: string
  numero: string
  statut: string
  notes?: string
  dateLivraison?: string
  totalAbonnementHT: number
  totalPrestationsHT: number
  totalHT: number
  tva: number
  totalTTC: number
  createdAt: string
  contact: {
    id: string; prenom: string; nom: string; societe?: string; email: string
    telephoneFixe?: string; telephoneMobile?: string; adresseFacturation?: string; codePostal?: string; ville?: string
  }
  devis: { id: string; numero: string; objet: string; dureeEngagement?: number }
  lignes: LigneBdc[]
}

export default function BdcDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [bdc, setBdc] = useState<Bdc | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailForm, setEmailForm] = useState({ to: '', subject: '', message: '' })
  const [emailLoading, setEmailLoading] = useState(false)

  const loadBdc = () => {
    fetch(`/api/bdc/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setBdc(data)
        if (data?.contact?.email) {
          setEmailForm({
            to: data.contact.email,
            subject: `Bon de Commande ${data.numero}`,
            message: `Bonjour ${data.contact.prenom},\n\nVeuillez trouver ci-joint votre bon de commande ${data.numero}.\n\nCordialement`,
          })
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadBdc() }, [id]) // eslint-disable-line

  const updateStatut = async (statut: string) => {
    if (!bdc) return
    setActionLoading(true)
    try {
      await fetch(`/api/bdc/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut, notes: bdc.notes, dateLivraison: bdc.dateLivraison }),
      })
      loadBdc()
    } finally {
      setActionLoading(false)
    }
  }

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailLoading(true)
    try {
      const res = await fetch(`/api/bdc/${id}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailForm),
      })
      if (!res.ok) throw new Error()
      setShowEmailModal(false)
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

  if (!bdc) return <p className="text-slate-500">Bon de commande introuvable.</p>

  const abonnementLignes = bdc.lignes.filter((l) => l.type === 'ABONNEMENT')
  const locationLignes = bdc.lignes.filter((l) => l.type === 'LOCATION')
  const prestationLignes = bdc.lignes.filter((l) => l.type === 'PRESTATION')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/bdc" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 font-mono">{bdc.numero}</h1>
              <StatutBdcBadge statut={bdc.statut} />
            </div>
            <Link href={`/devis/${bdc.devis.id}`} className="text-sm text-slate-500 hover:text-[#0F2A6B] mt-1 inline-flex items-center gap-1">
              Devis origine : {bdc.devis.numero} — {bdc.devis.objet}
            </Link>
          </div>
        </div>

        <div className="flex gap-2">
          {bdc.statut === 'EN_COURS' && (
            <>
              <Button size="sm" onClick={() => updateStatut('LIVRE')} loading={actionLoading} className="bg-green-600 hover:bg-green-700">
                <CheckCircle size={15} />
                Marquer livré
              </Button>
              <Button variant="ghost" size="sm" onClick={() => updateStatut('ANNULE')} loading={actionLoading} className="text-red-600 hover:bg-red-50">
                <XCircle size={15} />
                Annuler
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowEmailModal(true)}>
            <Mail size={15} />
            Envoyer
          </Button>
          <Link href={`/print/bdc/${id}`} target="_blank">
            <Button variant="outline" size="sm">
              <Printer size={15} />
              Imprimer
            </Button>
          </Link>

          <a href={`/api/pdf/bdc/${id}`} download>
            <Button variant="outline" size="sm">
              <Download size={15} />
              Télécharger PDF
            </Button>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Client</p>
                <Link href={`/contacts/${bdc.contact.id}`} className="text-sm font-medium text-[#0F2A6B] hover:underline mt-1 block">
                  {bdc.contact.societe || `${bdc.contact.prenom} ${bdc.contact.nom}`}
                </Link>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Créé le</p>
                <p className="text-sm font-medium text-slate-900 mt-1">{formatDate(bdc.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Engagement</p>
                <p className="text-sm font-medium text-slate-900 mt-1">
                  {bdc.devis.dureeEngagement ? `${bdc.devis.dureeEngagement} mois` : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Livraison</p>
                <p className="text-sm font-medium text-slate-900 mt-1">{formatDate(bdc.dateLivraison)}</p>
              </div>
            </div>
          </div>

          {abonnementLignes.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-[#0F2A6B]/5 border-b border-[#0F2A6B]/10">
                <h3 className="text-sm font-semibold text-[#0F2A6B]">Abonnements services</h3>
              </div>
              <LignesTable lignes={abonnementLignes} unite="/mois" />
            </div>
          )}

          {locationLignes.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-[#0F2A6B]/5 border-b border-[#0F2A6B]/10">
                <h3 className="text-sm font-semibold text-[#0F2A6B]">Location de matériel</h3>
              </div>
              <LignesTable lignes={locationLignes} unite="/mois" hidePrice />
            </div>
          )}

          {prestationLignes.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-[#1C1C2E]/5 border-b border-[#1C1C2E]/10">
                <h3 className="text-sm font-semibold text-[#1C1C2E]">Prestations ponctuelles</h3>
              </div>
              <LignesTable lignes={prestationLignes} />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Récapitulatif</h3>
            <div className="space-y-2">
              {bdc.totalAbonnementHT > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Abonnements HT</span>
                  <span className="font-medium">{formatMontant(bdc.totalAbonnementHT)}/mois</span>
                </div>
              )}
              {bdc.totalPrestationsHT > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Prestations HT</span>
                  <span className="font-medium">{formatMontant(bdc.totalPrestationsHT)}</span>
                </div>
              )}
              <div className="border-t border-slate-100 pt-2 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Total HT</span>
                  <span className="font-medium">{formatMontant(bdc.totalHT)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">TVA 20%</span>
                  <span className="font-medium">{formatMontant(bdc.tva)}</span>
                </div>
                <div className="flex justify-between text-base font-bold border-t border-slate-200 pt-2">
                  <span>Total TTC</span>
                  <span className="text-[#0F2A6B]">{formatMontant(bdc.totalTTC)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Client</h3>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-900">{bdc.contact.prenom} {bdc.contact.nom}</p>
              {bdc.contact.societe && <p className="text-sm text-slate-600">{bdc.contact.societe}</p>}
              <p className="text-sm text-slate-500">{bdc.contact.email}</p>
              {bdc.contact.telephoneMobile && <p className="text-sm text-slate-500">{bdc.contact.telephoneMobile}</p>}
              {bdc.contact.adresseFacturation && (
                <p className="text-sm text-slate-500 mt-1">{bdc.contact.adresseFacturation}</p>
              )}
              {(bdc.contact.codePostal || bdc.contact.ville) && (
                <p className="text-sm text-slate-500">{bdc.contact.codePostal} {bdc.contact.ville}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal open={showEmailModal} onClose={() => setShowEmailModal(false)} title="Envoyer par email" size="md">
        <form onSubmit={handleSendEmail} className="space-y-4">
          <Input label="Destinataire *" type="email" value={emailForm.to} onChange={(e) => setEmailForm((p) => ({ ...p, to: e.target.value }))} required />
          <Input label="Objet *" value={emailForm.subject} onChange={(e) => setEmailForm((p) => ({ ...p, subject: e.target.value }))} required />
          <Textarea label="Message" value={emailForm.message} onChange={(e) => setEmailForm((p) => ({ ...p, message: e.target.value }))} rows={5} />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowEmailModal(false)}>Annuler</Button>
            <Button type="submit" loading={emailLoading}><Mail size={15} />Envoyer</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function LignesTable({ lignes, unite, hidePrice }: { lignes: LigneBdc[]; unite?: string; hidePrice?: boolean }) {
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
