'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Search, ExternalLink } from 'lucide-react'
import { StatutDevisBadge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { formatMontant, formatDate } from '@/lib/utils'

interface Devis {
  id: string
  numero: string
  objet?: string
  statut: string
  totalTTC: number
  totalAbonnementHT: number
  totalPrestationsHT: number
  dureeEngagement?: number
  createdAt: string
  contact: { id: string; prenom: string; nom: string; societe?: string }
  _count: { lignes: number }
}

export default function DevisPage() {
  const [devis, setDevis] = useState<Devis[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statut, setStatut] = useState('')

  const loadDevis = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statut) params.set('statut', statut)

    fetch(`/api/devis?${params}`)
      .then((r) => r.json())
      .then(setDevis)
      .finally(() => setLoading(false))
  }, [search, statut])

  useEffect(() => {
    const timer = setTimeout(loadDevis, 300)
    return () => clearTimeout(timer)
  }, [loadDevis])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Devis</h1>
          <p className="text-sm text-slate-500 mt-1">{devis.length} devis</p>
        </div>
        <Link href="/devis/new">
          <Button>
            <Plus size={16} />
            Nouveau devis
          </Button>
        </Link>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-[#d0dff5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5FBF]/30"
          />
        </div>
        <select
          value={statut}
          onChange={(e) => setStatut(e.target.value)}
          className="px-3 py-2 text-sm border border-[#d0dff5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5FBF]/30 bg-white"
        >
          <option value="">Tous les statuts</option>
          <option value="BROUILLON">Brouillon</option>
          <option value="ENVOYE">Envoyé</option>
          <option value="ACCEPTE">Accepté</option>
          <option value="REFUSE">Refusé</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-6 h-6 border-4 border-[#1A5FBF] border-t-transparent rounded-full" />
          </div>
        ) : devis.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <p className="text-sm">Aucun devis trouvé</p>
            <Link href="/devis/new" className="mt-2 text-sm text-[#1A5FBF] hover:underline">
              Créer le premier devis
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Numéro</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">Objet</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Montant TTC</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Date</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {devis.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/devis/${d.id}`} className="text-sm font-mono font-medium text-[#1A5FBF] hover:underline">
                      {d.numero}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/contacts/${d.contact.id}`} className="text-sm text-slate-900 hover:text-[#1A5FBF]">
                      {d.contact.societe || `${d.contact.prenom} ${d.contact.nom}`}
                    </Link>
                    {d.contact.societe && (
                      <p className="text-xs text-slate-500">{d.contact.prenom} {d.contact.nom}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    {d.dureeEngagement && (
                      <p className="text-xs text-slate-400">{d.dureeEngagement} mois</p>
                    )}
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell text-right">
                    <p className="text-sm font-semibold text-slate-900">{formatMontant(d.totalTTC)}</p>
                    {d.totalAbonnementHT > 0 && (
                      <p className="text-xs text-slate-400">{formatMontant(d.totalAbonnementHT)}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <p className="text-sm text-slate-600">{formatDate(d.createdAt)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <StatutDevisBadge statut={d.statut} />
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/devis/${d.id}`} className="text-slate-400 hover:text-[#1A5FBF] transition-colors">
                      <ExternalLink size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
