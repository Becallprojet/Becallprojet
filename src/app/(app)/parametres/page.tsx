'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Settings, Calendar, Zap, CheckCircle, XCircle, Copy, Check, FileText, Upload, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import { BDC_DOCUMENTS } from '@/lib/bdcDocuments'

export default function ParametresPage() {
  return (
    <Suspense fallback={null}>
      <ParametresPageInner />
    </Suspense>
  )
}

function ParametresPageInner() {
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const isAdmin = (session?.user as { role?: string })?.role === 'ADMIN'
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null)
  const [disconnecting, setDisconnecting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [docStatus, setDocStatus] = useState<Record<string, boolean>>({})
  const [docUploading, setDocUploading] = useState<Record<string, boolean>>({})
  const [docDeleting, setDocDeleting] = useState<Record<string, boolean>>({})

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const clayWebhookUrl = `${appUrl}/api/webhooks/clay`

  useEffect(() => {
    if (isAdmin) {
      BDC_DOCUMENTS.forEach(doc => {
        fetch(`/api/admin/documents/${doc.slug}`)
          .then(r => r.json())
          .then(data => setDocStatus(prev => ({ ...prev, [doc.slug]: data.exists ?? false })))
          .catch(() => setDocStatus(prev => ({ ...prev, [doc.slug]: false })))
      })
    }
  }, [isAdmin])

  useEffect(() => {
    fetch('/api/google/status')
      .then((r) => r.json())
      .then((data) => setGoogleConnected(data.connected ?? false))
      .catch(() => setGoogleConnected(false))
  }, [])

  useEffect(() => {
    if (searchParams.get('googleConnected') === 'true') {
      setGoogleConnected(true)
      setNotification({ type: 'success', message: 'Google Calendar et Gmail connectés avec succès !' })
    } else if (searchParams.get('googleError')) {
      setNotification({ type: 'error', message: 'Erreur lors de la connexion à Google Calendar.' })
    }
  }, [searchParams])

  const handleDisconnect = async () => {
    setDisconnecting(true)
    try {
      const res = await fetch('/api/google/disconnect', { method: 'POST' })
      if (res.ok) {
        setGoogleConnected(false)
        setNotification({ type: 'success', message: 'Google Calendar déconnecté.' })
      }
    } catch {
      setNotification({ type: 'error', message: 'Erreur lors de la déconnexion.' })
    } finally {
      setDisconnecting(false)
    }
  }

  const handleDocUpload = async (slug: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setDocUploading(prev => ({ ...prev, [slug]: true }))
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`/api/admin/documents/${slug}`, { method: 'POST', body: form })
      if (res.ok) {
        setDocStatus(prev => ({ ...prev, [slug]: true }))
        setNotification({ type: 'success', message: 'Document uploadé avec succès.' })
      } else {
        setNotification({ type: 'error', message: "Erreur lors de l'upload." })
      }
    } catch {
      setNotification({ type: 'error', message: "Erreur lors de l'upload." })
    } finally {
      setDocUploading(prev => ({ ...prev, [slug]: false }))
      e.target.value = ''
    }
  }

  const handleDocDelete = async (slug: string) => {
    setDocDeleting(prev => ({ ...prev, [slug]: true }))
    try {
      const res = await fetch(`/api/admin/documents/${slug}`, { method: 'DELETE' })
      if (res.ok) {
        setDocStatus(prev => ({ ...prev, [slug]: false }))
        setNotification({ type: 'success', message: 'Document supprimé.' })
      }
    } catch {
      setNotification({ type: 'error', message: 'Erreur lors de la suppression.' })
    } finally {
      setDocDeleting(prev => ({ ...prev, [slug]: false }))
    }
  }

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Settings size={22} className="text-slate-400" />
        <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>
      </div>

      {/* Notification banner */}
      {notification && (
        <div className={`mb-6 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
          notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {notification.type === 'success' ? <CheckCircle size={16} className="flex-shrink-0" /> : <XCircle size={16} className="flex-shrink-0" />}
          {notification.message}
          <button onClick={() => setNotification(null)} className="ml-auto text-current opacity-60 hover:opacity-100">×</button>
        </div>
      )}

      {/* Section Intégrations */}
      <div className="bg-white rounded-xl border border-slate-200 mb-6">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900 text-base">Intégrations</h2>
          <p className="text-sm text-slate-500 mt-0.5">Connectez vos outils externes au CRM.</p>
        </div>

        {/* Google Calendar + Gmail */}
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Calendar size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900 text-sm">Google Calendar &amp; Gmail</p>
                <p className="text-xs text-slate-500 mt-0.5">Synchronisez vos rendez-vous et envoyez vos devis/BDC via Gmail.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {googleConnected === null ? (
                    <span className="text-xs text-slate-400">Chargement...</span>
                  ) : googleConnected ? (
                    <>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                        <CheckCircle size={11} /> Google Calendar activé
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                        <CheckCircle size={11} /> Gmail activé
                      </span>
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      <XCircle size={11} /> Non connecté
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              {googleConnected ? (
                <Button variant="outline" size="sm" onClick={handleDisconnect} loading={disconnecting} className="text-red-600 border-red-200 hover:bg-red-50">
                  Déconnecter
                </Button>
              ) : (
                <a href="/api/google/connect">
                  <Button variant="secondary" size="sm">Connecter Google</Button>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Clay — admin uniquement */}
        {isAdmin && <div className="px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
              <Zap size={18} className="text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 text-sm">Clay</p>
              <p className="text-xs text-slate-500 mt-0.5">Recevez les enrichissements de prospects depuis Clay via webhook.</p>
              <div className="mt-3 space-y-3">
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-1">URL du webhook Clay</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-slate-100 text-slate-700 px-3 py-2 rounded-lg font-mono truncate border border-slate-200">{clayWebhookUrl}</code>
                    <button onClick={() => handleCopy(clayWebhookUrl)} className="flex-shrink-0 p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors" title="Copier">
                      {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-1">Secret à configurer dans Clay</p>
                  <code className="flex-1 text-xs bg-slate-100 text-slate-700 px-3 py-2 rounded-lg font-mono truncate border border-slate-200 block">
                    Header : <strong>x-clay-secret</strong> — Valeur : voir <strong>CLAY_WEBHOOK_SECRET</strong> dans .env
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>}
      </div>

      {/* Section Documents BDC — admin uniquement */}
      {isAdmin && <div className="bg-white rounded-xl border border-slate-200 mb-6">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900 text-base">Documents annexes du Bon de Commande</h2>
          <p className="text-sm text-slate-500 mt-0.5">Ces PDFs sont automatiquement joints à chaque bon de commande envoyé par email.</p>
        </div>
        <div className="divide-y divide-slate-50">
          {BDC_DOCUMENTS.map(doc => {
            const exists = docStatus[doc.slug] ?? null
            const uploading = docUploading[doc.slug] ?? false
            const deleting = docDeleting[doc.slug] ?? false
            return (
              <div key={doc.slug} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                    <FileText size={15} className="text-orange-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{doc.label}</p>
                    {exists === null ? (
                      <span className="text-xs text-slate-400">Chargement...</span>
                    ) : exists ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full mt-0.5">
                        <CheckCircle size={10} /> Configuré
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full mt-0.5">
                        <XCircle size={10} /> Non uploadé
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {exists && (
                    <Button variant="outline" size="sm" onClick={() => handleDocDelete(doc.slug)} loading={deleting} className="text-red-600 border-red-200 hover:bg-red-50">
                      <Trash2 size={13} />
                    </Button>
                  )}
                  <label className="cursor-pointer">
                    <input type="file" accept="application/pdf" className="hidden" onChange={e => handleDocUpload(doc.slug, e)} disabled={uploading} />
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${uploading ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400' : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 cursor-pointer'}`}>
                      <Upload size={12} />
                      {uploading ? '...' : exists ? 'Remplacer' : 'Uploader'}
                    </span>
                  </label>
                </div>
              </div>
            )
          })}
        </div>
      </div>}

      {/* Section Informations — admin uniquement */}
      {isAdmin && <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900 text-base">Informations</h2>
          <p className="text-sm text-slate-500 mt-0.5">Variables d&apos;environnement de l&apos;application.</p>
        </div>
        <div className="px-6 py-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-slate-50">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">URL de l&apos;application</span>
              <code className="text-sm text-slate-800 font-mono">{appUrl}</code>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Environnement</span>
              <span className="text-sm text-slate-800">{process.env.NODE_ENV === 'production' ? 'Production' : 'Développement'}</span>
            </div>
          </div>
        </div>
      </div>}
    </div>
  )
}
