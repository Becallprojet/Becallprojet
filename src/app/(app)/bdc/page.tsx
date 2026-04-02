'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Search, ExternalLink } from 'lucide-react'
import { StatutBdcBadge } from '@/components/ui/Badge'
import { formatMontant, formatDate } from '@/lib/utils'

interface Bdc {
  id: string
  numero: string
  statut: string
  totalTTC: number
  totalAbonnementHT: number
  createdAt: string
  contact: { id: string; prenom: string; nom: string; societe?: string }
  devis: { numero: string }
  _count: { lignes: number }
}

export default function BdcPage() {
  const [bdcs, setBdcs] = useState<Bdc[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statut, setStatut] = useState('')

  const loadBdcs = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statut) params.set('statut', statut)

    fetch(`/api/bdc?${params}`)
      .then((r) => r.json())
      .then(setBdcs)
      .finally(() => setLoading(false))
  }, [search, statut])

  useEffect(() => {
    const timer = setTimeout(loadBdcs, 300)
    return () => clearTimeout(timer)
  }, [loadBdcs])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bons de commande</h1>
          <p className="text-sm text-slate-500 mt-1">{bdcs.length} bon{bdcs.length > 1 ? 's' : ''}</p>
        </div>
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
          <option value="EN_COURS">En cours</option>
          <option value="LIVRE">Livré</option>
          <option value="ANNULE">Annulé</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-6 h-6 border-4 border-[#1A5FBF] border-t-transparent rounded-full" />
          </div>
        ) : bdcs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <p className="text-sm">Aucun bon de commande</p>
            <p className="text-xs mt-1">Acceptez un devis pour générer un bon de commande</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Numéro</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Client</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Devis origine</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Montant TTC</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Date</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bdcs.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/bdc/${b.id}`} className="text-sm font-mono font-medium text-[#1A5FBF] hover:underline">
                      {b.numero}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/contacts/${b.contact.id}`} className="text-sm text-slate-900 hover:text-[#1A5FBF]">
                      {b.contact.societe || `${b.contact.prenom} ${b.contact.nom}`}
                    </Link>
                    {b.contact.societe && (
                      <p className="text-xs text-slate-500">{b.contact.prenom} {b.contact.nom}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="text-sm text-slate-500 font-mono">{b.devis.numero}</span>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell text-right">
                    <p className="text-sm font-semibold text-slate-900">{formatMontant(b.totalTTC)}</p>
                    {b.totalAbonnementHT > 0 && (
                      <p className="text-xs text-slate-400">{formatMontant(b.totalAbonnementHT)}/mois</p>
                    )}
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <p className="text-sm text-slate-600">{formatDate(b.createdAt)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <StatutBdcBadge statut={b.statut} />
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/bdc/${b.id}`} className="text-slate-400 hover:text-[#1A5FBF] transition-colors">
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
