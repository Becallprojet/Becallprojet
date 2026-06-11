'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Eye, EyeOff } from 'lucide-react'
import Button from '@/components/ui/Button'

const EXAMPLE = { prenom: 'Sophie', nom: 'Martin', societe: 'Acme Corp', poste: 'Directrice Marketing' }

function applyTemplate(template: string, data: typeof EXAMPLE): string {
  return template
    .replace(/\{\{prenom\}\}/gi, data.prenom)
    .replace(/\{\{nom\}\}/gi, data.nom)
    .replace(/\{\{societe\}\}/gi, data.societe)
    .replace(/\{\{poste\}\}/gi, data.poste)
}

export default function NewCampagnePage() {
  const router = useRouter()
  const [form, setForm] = useState({ nom: '', produit: '', messageTemplate: '' })
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(false)
  const [error, setError] = useState('')

  const charCount = form.messageTemplate.length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.nom.trim() || !form.produit.trim() || !form.messageTemplate.trim()) {
      setError('Tous les champs sont obligatoires.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/leads/campagnes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'Erreur lors de la création.')
        return
      }
      const campagne = await res.json()
      router.push(`/leads/campagnes/${campagne.id}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/leads" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: '#0F2A6B' }}>Nouvelle campagne LinkedIn</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom de la campagne *</label>
            <input
              type="text"
              value={form.nom}
              onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-[#d0dff5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5FBF]/30"
              placeholder="Ex: Prospection PME Île-de-France"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Produit / Service à vendre *</label>
            <textarea
              value={form.produit}
              onChange={(e) => setForm((f) => ({ ...f, produit: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-[#d0dff5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5FBF]/30 resize-none"
              rows={3}
              placeholder="Décrivez votre offre (ex: Solution de téléphonie cloud pour les PME, avec installation incluse et support 24h/24)"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-slate-700">Message d'accroche *</label>
              <button
                type="button"
                onClick={() => setPreview(!preview)}
                className="flex items-center gap-1.5 text-xs text-[#1A5FBF] hover:underline"
              >
                {preview ? <EyeOff size={13} /> : <Eye size={13} />}
                {preview ? 'Masquer aperçu' : 'Aperçu exemple'}
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-2">
              Variables disponibles : <code className="bg-slate-100 px-1 rounded">{'{{prenom}}'}</code>{' '}
              <code className="bg-slate-100 px-1 rounded">{'{{nom}}'}</code>{' '}
              <code className="bg-slate-100 px-1 rounded">{'{{societe}}'}</code>{' '}
              <code className="bg-slate-100 px-1 rounded">{'{{poste}}'}</code>
            </p>
            <textarea
              value={form.messageTemplate}
              onChange={(e) => setForm((f) => ({ ...f, messageTemplate: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-[#d0dff5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5FBF]/30 resize-none font-mono"
              rows={5}
              placeholder={`Bonjour {{prenom}},\n\nJ'ai vu votre profil et votre rôle chez {{societe}}. Je serais ravi d'échanger sur...`}
              required
            />
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-xs text-slate-400">Max 300 caractères pour l'invitation LinkedIn</p>
              <span className={`text-xs font-medium ${charCount > 300 ? 'text-red-600' : charCount > 250 ? 'text-orange-500' : 'text-slate-400'}`}>
                {charCount} / 300
              </span>
            </div>

            {preview && form.messageTemplate && (
              <div className="mt-3 bg-[#EEF5FF] border border-[#d0dff5] rounded-lg p-4">
                <p className="text-xs font-semibold text-[#1A5FBF] mb-2 uppercase tracking-wider">Aperçu avec {EXAMPLE.prenom} {EXAMPLE.nom} ({EXAMPLE.societe})</p>
                <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                  {applyTemplate(form.messageTemplate, EXAMPLE)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="flex gap-3 justify-end">
          <Link href="/leads">
            <Button variant="secondary" type="button">Annuler</Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? 'Création...' : 'Créer la campagne'}
          </Button>
        </div>
      </form>
    </div>
  )
}
