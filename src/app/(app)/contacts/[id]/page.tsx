'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Edit, Plus, Phone, Mail, MapPin, Building2, FileText, ClipboardList, Trash2 } from 'lucide-react'
import { StatutContactBadge, StatutDevisBadge, StatutBdcBadge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { formatMontant, formatDate } from '@/lib/utils'

interface Contact {
  id: string
  statut: string
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

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/contacts/${id}`)
      .then((r) => r.json())
      .then(setContact)
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    if (!confirm('Supprimer ce contact ? Cette action est irréversible.')) return
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

  if (!contact) return <p className="text-slate-500">Contact introuvable.</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/contacts" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                {contact.civilite} {contact.prenom} {contact.nom}
              </h1>
              <StatutContactBadge statut={contact.statut} />
            </div>
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
          <Link href={`/devis/new?contactId=${id}`}>
            <Button variant="secondary" size="sm">
              <Plus size={15} />
              Nouveau devis
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
        </div>
      </div>
    </div>
  )
}
