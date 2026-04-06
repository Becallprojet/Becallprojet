'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Search, Phone, Mail, Building2 } from 'lucide-react'
import { StatutContactBadge, StadeProspectBadge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'

interface Client {
  id: string
  statut: string
  stade?: string
  numeroClient?: string
  prenom: string
  nom: string
  societe?: string
  email: string
  telephoneFixe?: string
  telephoneMobile?: string
  commercial?: string
  createdAt: string
  _count: { devis: number; bonsDeCommande: number }
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const loadClients = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('statut', 'CLIENT')
    if (search) params.set('search', search)

    fetch(`/api/contacts?${params}`)
      .then((r) => r.json())
      .then(setClients)
      .finally(() => setLoading(false))
  }, [search])

  useEffect(() => {
    const timer = setTimeout(loadClients, 300)
    return () => clearTimeout(timer)
  }, [loadClients])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="text-sm text-slate-500 mt-1">{clients.length} client{clients.length > 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Filtres */}
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
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-6 h-6 border-4 border-[#1A5FBF] border-t-transparent rounded-full" />
          </div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <p className="text-sm">Aucun client trouvé</p>
            <p className="text-xs mt-1">Un client est un prospect dont le devis a été accepté</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Client</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Email / Tél</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">N° Client</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">Commercial</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">Devis / BDC</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Créé le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/contacts/${c.id}`} className="block">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#e6fdf4] text-[#00875a] rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                          {c.prenom[0]}{c.nom[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 hover:text-[#1A5FBF]">
                            {c.prenom} {c.nom}
                          </p>
                          {c.societe && (
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Building2 size={11} />
                              {c.societe}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="space-y-0.5">
                      <a href={`mailto:${c.email}`} className="text-xs text-slate-600 hover:text-[#1A5FBF] flex items-center gap-1">
                        <Mail size={11} />
                        {c.email}
                      </a>
                      {(c.telephoneMobile || c.telephoneFixe) && (
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Phone size={11} />
                          {c.telephoneMobile || c.telephoneFixe}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    {c.numeroClient ? (
                      <span className="text-xs font-mono text-slate-600">{c.numeroClient}</span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <p className="text-sm text-slate-600">{c.commercial || '—'}</p>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell text-right">
                    <p className="text-sm text-slate-600">
                      {c._count.devis} devis · {c._count.bonsDeCommande} BDC
                    </p>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell text-right">
                    <p className="text-xs text-slate-400">{formatDate(c.createdAt)}</p>
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
