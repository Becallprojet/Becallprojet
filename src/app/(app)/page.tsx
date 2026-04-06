'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, FileText, ClipboardList, TrendingUp, Plus, GitBranch, Bell, Activity } from 'lucide-react'
import { StatCard } from '@/components/ui/Card'
import { StatutDevisBadge } from '@/components/ui/Badge'
import PipelineChart from '@/components/ui/PipelineChart'
import { formatMontant, formatDate, TYPE_ACTIVITE_LABELS } from '@/lib/utils'

interface DashboardData {
  contacts: { prospects: number; clients: number }
  devis: { brouillon: number; envoye: number; accepte: number; refuse: number }
  bdc: { enCours: number; livre: number }
  ca: number
  caBdc: number
  tauxConversion: number
  pipelineParStade: Array<{ stade: string; count: number }>
  activitesRecentes: Array<{
    id: string
    type: string
    date: string
    notes?: string | null
    prospect: { id: string; prenom: string; nom: string; societe?: string | null }
    user: { prenom: string; nom: string }
  }>
  rappelsDuJour: Array<{
    id: string
    titre: string
    date: string
    notes?: string | null
    prospect: { id: string; prenom: string; nom: string; societe?: string | null }
  }>
  dernierDevis: Array<{
    id: string
    numero: string
    objet: string
    statut: string
    totalTTC: number
    createdAt: string
    contact: { prenom: string; nom: string; societe?: string }
  }>
  derniersContacts: Array<{
    id: string
    prenom: string
    nom: string
    societe?: string
    statut: string
    createdAt: string
  }>
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full"
          style={{ borderColor: '#1A5FBF', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!data) return null

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0F2A6B' }}>Tableau de bord</h1>
          <p className="text-sm text-slate-500 mt-1">Vue d&apos;ensemble de votre activité commerciale</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/pipeline"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-sm font-medium rounded-lg transition-colors hover:bg-slate-50"
            style={{ border: '1px solid #7C3AED', color: '#7C3AED' }}
          >
            <GitBranch size={16} />
            Pipeline
          </Link>
          <Link
            href="/contacts/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-sm font-medium rounded-lg transition-colors hover:bg-slate-50"
            style={{ border: '1px solid #1A5FBF', color: '#1A5FBF' }}
          >
            <Plus size={16} />
            Nouveau prospect
          </Link>
          <Link
            href="/devis/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors"
            style={{ background: '#1A5FBF' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#0F2A6B'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#1A5FBF'}
          >
            <Plus size={16} />
            Nouveau devis
          </Link>
        </div>
      </div>

      {/* Stats row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard title="Prospects" value={data.contacts.prospects} icon={<Users size={20} />} color="blue" />
        <StatCard title="Clients" value={data.contacts.clients} icon={<Users size={20} />} color="green" />
        <StatCard title="Devis envoyés" value={data.devis.envoye} subtitle={`${data.devis.brouillon} en brouillon`} icon={<FileText size={20} />} color="yellow" />
        <StatCard title="CA signé (TTC)" value={formatMontant(data.ca)} subtitle={`${data.devis.accepte} devis acceptés`} icon={<TrendingUp size={20} />} color="purple" />
      </div>

      {/* Stats row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="BDC en cours" value={data.bdc.enCours} icon={<ClipboardList size={20} />} color="blue" />
        <StatCard title="BDC livrés" value={data.bdc.livre} icon={<ClipboardList size={20} />} color="green" />
        <StatCard title="CA BDC réel (TTC)" value={formatMontant(data.caBdc)} subtitle="En cours + livrés" icon={<TrendingUp size={20} />} color="purple" />
        <StatCard title="Taux de conversion" value={`${data.tauxConversion}%`} subtitle="Prospects gagnés" icon={<TrendingUp size={20} />} color="green" />
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Derniers devis */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold" style={{ color: '#0F2A6B' }}>Derniers devis</h2>
            <Link href="/devis" className="text-sm font-medium hover:underline" style={{ color: '#0F2A6B' }}>
              Voir tout
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {data.dernierDevis.length === 0 && (
              <p className="px-6 py-4 text-sm text-slate-400">Aucun devis</p>
            )}
            {data.dernierDevis.map((d) => (
              <Link key={d.id} href={`/devis/${d.id}`}
                className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: '#0F2A6B' }}>{d.numero}</p>
                  <p className="text-xs text-slate-500">
                    {d.contact.societe || `${d.contact.prenom} ${d.contact.nom}`} — {formatDate(d.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">{formatMontant(d.totalTTC)}</p>
                  <StatutDevisBadge statut={d.statut} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Derniers prospects */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold" style={{ color: '#0F2A6B' }}>Derniers prospects</h2>
            <Link href="/contacts" className="text-sm font-medium hover:underline" style={{ color: '#0F2A6B' }}>
              Voir tout
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {data.derniersContacts.length === 0 && (
              <p className="px-6 py-4 text-sm text-slate-400">Aucun prospect</p>
            )}
            {data.derniersContacts.map((c) => (
              <Link key={c.id} href={`/contacts/${c.id}`}
                className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{c.prenom} {c.nom}</p>
                  {c.societe && <p className="text-xs text-slate-500">{c.societe}</p>}
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  c.statut === 'CLIENT' ? 'bg-green-100 text-green-800' : 'text-white'
                }`}
                  style={c.statut !== 'CLIENT' ? { background: '#0F2A6B' } : {}}
                >
                  {c.statut === 'CLIENT' ? 'Client' : 'Prospect'}
                </span>
              </Link>
            ))}
          </div>
        </div>

      </div>

      {/* Vue Pipeline */}
      <div className="mt-6 bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold flex items-center gap-2" style={{ color: '#0F2A6B' }}>
            <GitBranch size={16} style={{ color: '#7C3AED' }} />
            Vue Pipeline
          </h2>
          <Link href="/pipeline" className="text-sm font-medium hover:underline" style={{ color: '#7C3AED' }}>
            Ouvrir le Kanban
          </Link>
        </div>
        <div className="p-6">
          {data.pipelineParStade.length === 0 ? (
            <p className="text-sm text-slate-400">Aucun prospect dans le pipeline</p>
          ) : (
            <PipelineChart data={data.pipelineParStade} />
          )}
        </div>
      </div>

      {/* Rappels du jour + Activités récentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

        {/* Rappels du jour */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold flex items-center gap-2" style={{ color: '#0F2A6B' }}>
              <Bell size={16} style={{ color: '#F59E0B' }} />
              Rappels du jour
              {data.rappelsDuJour.length > 0 && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  {data.rappelsDuJour.length}
                </span>
              )}
            </h2>
          </div>
          <div className="divide-y divide-slate-50">
            {data.rappelsDuJour.length === 0 && (
              <p className="px-6 py-4 text-sm text-slate-400">Aucun rappel pour aujourd&apos;hui</p>
            )}
            {data.rappelsDuJour.map((r) => (
              <Link key={r.id} href={`/contacts/${r.prospect.id}`}
                className="flex items-start justify-between px-6 py-3 hover:bg-slate-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{r.titre}</p>
                  <p className="text-xs text-slate-500">
                    {r.prospect.societe || `${r.prospect.prenom} ${r.prospect.nom}`} — {formatDate(r.date)}
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium flex-shrink-0">
                  À faire
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Activités récentes */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold flex items-center gap-2" style={{ color: '#0F2A6B' }}>
              <Activity size={16} style={{ color: '#1A5FBF' }} />
              Activités récentes
            </h2>
          </div>
          <div className="divide-y divide-slate-50">
            {data.activitesRecentes.length === 0 && (
              <p className="px-6 py-4 text-sm text-slate-400">Aucune activité récente</p>
            )}
            {data.activitesRecentes.map((a) => (
              <Link key={a.id} href={`/contacts/${a.prospect.id}`}
                className="flex items-start justify-between px-6 py-3 hover:bg-slate-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {TYPE_ACTIVITE_LABELS[a.type] ?? a.type}
                    {' — '}
                    {a.prospect.societe || `${a.prospect.prenom} ${a.prospect.nom}`}
                  </p>
                  <p className="text-xs text-slate-500">
                    {a.user.prenom} {a.user.nom} · {formatDate(a.date)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
