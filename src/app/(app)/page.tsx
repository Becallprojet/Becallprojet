'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Users, FileText, ClipboardList, TrendingUp, Plus, GitBranch, Bell, Activity, Sparkles, X } from 'lucide-react'
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

interface PipelineRecommandation {
  priorite: number
  titre: string
  detail: string
  impact: 'FORT' | 'MOYEN' | 'FAIBLE'
}

interface PipelineAiResult {
  analyse: string
  recommandations: PipelineRecommandation[]
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPipelineAi, setShowPipelineAi] = useState(false)
  const [pipelineAiLoading, setPipelineAiLoading] = useState(false)
  const [pipelineAiResult, setPipelineAiResult] = useState<PipelineAiResult | null>(null)
  const [pipelineAiError, setPipelineAiError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  const handleAnalysePipeline = useCallback(async () => {
    setShowPipelineAi(true)
    setPipelineAiLoading(true)
    setPipelineAiError(null)
    setPipelineAiResult(null)
    try {
      const res = await fetch('/api/dashboard/ai-pipeline', { method: 'POST' })
      const resultData = await res.json()
      if (!res.ok) {
        setPipelineAiError(resultData.error || "Erreur lors de l'analyse IA.")
      } else {
        setPipelineAiResult(resultData)
      }
    } catch {
      setPipelineAiError('Erreur réseau. Vérifiez votre connexion.')
    } finally {
      setPipelineAiLoading(false)
    }
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
          <button
            onClick={handleAnalysePipeline}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-sm font-medium rounded-lg transition-colors hover:bg-purple-50 disabled:opacity-60"
            style={{ border: '1px solid #7C3AED', color: '#7C3AED' }}
            disabled={pipelineAiLoading}
          >
            <Sparkles size={16} />
            Analyser mon pipeline
          </button>
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

      {/* Panneau IA Pipeline */}
      {showPipelineAi && (
        <div className="mb-6 bg-white rounded-xl border border-purple-200 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-purple-100" style={{ background: '#F5F3FF' }}>
            <h2 className="font-semibold flex items-center gap-2" style={{ color: '#7C3AED' }}>
              <Sparkles size={16} style={{ color: '#7C3AED' }} />
              Analyse IA du pipeline
            </h2>
            <button
              onClick={() => setShowPipelineAi(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {pipelineAiLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="animate-spin w-10 h-10 border-4 border-t-transparent rounded-full" style={{ borderColor: '#7C3AED', borderTopColor: 'transparent' }} />
              <p className="text-sm text-slate-500">L&apos;IA analyse votre pipeline...</p>
            </div>
          )}

          {!pipelineAiLoading && pipelineAiError && (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-700">{pipelineAiError}</p>
              </div>
              <button
                onClick={handleAnalysePipeline}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors hover:bg-purple-50"
                style={{ border: '1px solid #7C3AED', color: '#7C3AED' }}
              >
                <Sparkles size={14} />
                Réessayer
              </button>
            </div>
          )}

          {!pipelineAiLoading && pipelineAiResult && (
            <div className="p-6 space-y-6">
              {/* Analyse */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-2">Analyse</h3>
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-lg p-4 border border-slate-200">
                  {pipelineAiResult.analyse}
                </p>
              </div>

              {/* Recommandations */}
              {pipelineAiResult.recommandations.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">Recommandations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pipelineAiResult.recommandations.map((rec) => (
                      <div key={rec.priorite} className="bg-white rounded-lg border border-slate-200 p-4 space-y-2 hover:border-purple-200 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                              style={{ background: '#7C3AED' }}
                            >
                              {rec.priorite}
                            </span>
                            <p className="text-sm font-semibold text-slate-800 leading-tight">{rec.titre}</p>
                          </div>
                          <span
                            className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
                              rec.impact === 'FORT'
                                ? 'bg-red-100 text-red-700'
                                : rec.impact === 'MOYEN'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {rec.impact}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{rec.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

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
