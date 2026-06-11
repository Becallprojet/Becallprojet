'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Linkedin, Search, ExternalLink } from 'lucide-react'
import Button from '@/components/ui/Button'
import { StatutLeadLinkedinBadge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'

interface Campagne {
  id: string
  nom: string
  produit: string
  statut: string
  _count: { leads: number }
  createdAt: string
}

interface Lead {
  id: string
  prenom: string
  nom: string
  societe?: string | null
  statutLinkedin: string
  linkedinUrl?: string | null
  createdAt: string
  campagne: { id: string; nom: string }
}

type Tab = 'campagnes' | 'leads'

export default function LeadsPage() {
  const [tab, setTab] = useState<Tab>('campagnes')
  const [campagnes, setCampagnes] = useState<Campagne[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loadingC, setLoadingC] = useState(true)
  const [loadingL, setLoadingL] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [filterCampagne, setFilterCampagne] = useState('')

  useEffect(() => {
    fetch('/api/leads/campagnes')
      .then((r) => r.json())
      .then(setCampagnes)
      .finally(() => setLoadingC(false))
  }, [])

  const loadLeads = useCallback(() => {
    setLoadingL(true)
    const params = new URLSearchParams()
    if (filterCampagne) params.set('campagneId', filterCampagne)
    if (filterStatut) params.set('statut', filterStatut)
    fetch(`/api/leads?${params}`)
      .then((r) => r.json())
      .then((data) => setLeads(Array.isArray(data) ? data : []))
      .finally(() => setLoadingL(false))
  }, [filterCampagne, filterStatut])

  useEffect(() => {
    if (tab === 'leads') loadLeads()
  }, [tab, loadLeads])

  const filteredLeads = leads.filter((l) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      l.prenom.toLowerCase().includes(q) ||
      l.nom.toLowerCase().includes(q) ||
      (l.societe ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#0F2A6B' }}>
            <Linkedin size={22} style={{ color: '#0077B5' }} />
            Leads LinkedIn
          </h1>
          <p className="text-sm text-slate-500 mt-1">Gérez vos campagnes et opportunités LinkedIn</p>
        </div>
        <div className="flex gap-2">
          <Link href="/leads/opportunites">
            <Button variant="secondary" size="sm">
              Voir les opportunités
            </Button>
          </Link>
          <Link href="/leads/campagnes/new">
            <Button size="sm">
              <Plus size={15} />
              Nouvelle campagne
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {(['campagnes', 'leads'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px"
            style={tab === t ? { borderColor: '#1A5FBF', color: '#1A5FBF' } : { borderColor: 'transparent', color: '#64748b' }}
          >
            {t === 'campagnes' ? `Campagnes (${campagnes.length})` : 'Leads'}
          </button>
        ))}
      </div>

      {/* Campagnes tab */}
      {tab === 'campagnes' && (
        <div>
          {loadingC ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin w-6 h-6 border-4 border-[#1A5FBF] border-t-transparent rounded-full" />
            </div>
          ) : campagnes.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center h-48 text-slate-400">
              <Linkedin size={32} className="mb-2 opacity-30" />
              <p className="text-sm">Aucune campagne LinkedIn</p>
              <Link href="/leads/campagnes/new" className="mt-2 text-sm text-[#1A5FBF] hover:underline">
                Créer la première campagne
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campagnes.map((c) => (
                <Link key={c.id} href={`/leads/campagnes/${c.id}`}>
                  <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-[#1A5FBF]/40 transition-all cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#E8F0FD' }}>
                        <Linkedin size={18} style={{ color: '#0077B5' }} />
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.statut === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {c.statut === 'ACTIVE' ? 'Active' : 'Archivée'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">{c.nom}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">{c.produit}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">{c._count.leads}</span> lead{c._count.leads !== 1 ? 's' : ''}
                      </span>
                      <span className="text-xs text-slate-400">{formatDate(c.createdAt)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Leads tab */}
      {tab === 'leads' && (
        <div>
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-[#d0dff5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5FBF]/30"
              />
            </div>
            <select
              value={filterCampagne}
              onChange={(e) => setFilterCampagne(e.target.value)}
              className="px-3 py-2 text-sm border border-[#d0dff5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5FBF]/30 bg-white"
            >
              <option value="">Toutes les campagnes</option>
              {campagnes.map((c) => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="px-3 py-2 text-sm border border-[#d0dff5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5FBF]/30 bg-white"
            >
              <option value="">Tous les statuts</option>
              <option value="IMPORTE">Importé</option>
              <option value="INVITATION_ENVOYEE">Invitation envoyée</option>
              <option value="CONNECTE">Connecté</option>
              <option value="REPOND">A répondu</option>
              <option value="SANS_REPONSE">Sans réponse</option>
              <option value="CONVERTI">Converti</option>
            </select>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {loadingL ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin w-6 h-6 border-4 border-[#1A5FBF] border-t-transparent rounded-full" />
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                <p className="text-sm">Aucun lead trouvé</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Lead</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Campagne</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Statut</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Ajouté le</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeads.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/leads/campagnes/${l.campagne.id}`} className="block">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0077B5, #00A0DC)' }}>
                              {l.prenom[0]}{l.nom[0]}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">{l.prenom} {l.nom}</p>
                              {l.societe && <p className="text-xs text-slate-500">{l.societe}</p>}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="text-sm text-slate-600">{l.campagne.nom}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <StatutLeadLinkedinBadge statut={l.statutLinkedin} />
                          {l.linkedinUrl && (
                            <a href={l.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#0077B5]">
                              <ExternalLink size={13} />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell text-right">
                        <span className="text-xs text-slate-400">{formatDate(l.createdAt)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
