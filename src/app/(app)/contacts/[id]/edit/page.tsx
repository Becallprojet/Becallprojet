'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import { SOURCES_LEAD } from '@/lib/utils'

const STADE_OPTIONS = [
  { value: 'NOUVEAU', label: 'Nouveau' },
  { value: 'CONTACTE', label: 'Contacté' },
  { value: 'QUALIFIE', label: 'Qualifié' },
  { value: 'PROPOSITION', label: 'Proposition' },
  { value: 'NEGOCIE', label: 'Négocié' },
  { value: 'GAGNE', label: 'Gagné' },
  { value: 'PERDU', label: 'Perdu' },
]

export default function EditContactPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    statut: 'PROSPECT',
    stade: 'NOUVEAU',
    civilite: '',
    prenom: '',
    nom: '',
    societe: '',
    poste: '',
    email: '',
    telephoneFixe: '',
    telephoneMobile: '',
    linkedinUrl: '',
    adresseFacturation: '',
    adresseInstallation: '',
    codePostal: '',
    ville: '',
    sourceLead: '',
    commercial: '',
    notes: '',
  })

  useEffect(() => {
    fetch(`/api/contacts/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          statut: data.statut || 'PROSPECT',
          stade: data.stade || 'NOUVEAU',
          civilite: data.civilite || '',
          prenom: data.prenom || '',
          nom: data.nom || '',
          societe: data.societe || '',
          poste: data.poste || '',
          email: data.email || '',
          telephoneFixe: data.telephoneFixe || '',
          telephoneMobile: data.telephoneMobile || '',
          linkedinUrl: data.linkedinUrl || '',
          adresseFacturation: data.adresseFacturation || '',
          adresseInstallation: data.adresseInstallation || '',
          codePostal: data.codePostal || '',
          ville: data.ville || '',
          sourceLead: data.sourceLead || '',
          commercial: data.commercial || '',
          notes: data.notes || '',
        })
      })
  }, [id])

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/contacts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      router.push(`/contacts/${id}`)
    } catch {
      alert('Erreur lors de la mise à jour du contact.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/contacts/${id}`} className="text-slate-400 hover:text-slate-600 transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Modifier le contact</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h2 className="form-section-title">Identité</h2>
          <div className="form-grid">
            <Select
              label="Statut"
              value={form.statut}
              onChange={(e) => set('statut', e.target.value)}
              options={[
                { value: 'PROSPECT', label: 'Prospect' },
                { value: 'CLIENT', label: 'Client' },
              ]}
            />
            <Select
              label="Stade"
              value={form.stade}
              onChange={(e) => set('stade', e.target.value)}
              options={STADE_OPTIONS}
            />
            <Select
              label="Civilité"
              value={form.civilite}
              onChange={(e) => set('civilite', e.target.value)}
              options={[{ value: 'M.', label: 'M.' }, { value: 'Mme', label: 'Mme' }]}
              placeholder="— Choisir —"
            />
            <Input label="Prénom *" value={form.prenom} onChange={(e) => set('prenom', e.target.value)} required />
            <Input label="Nom *" value={form.nom} onChange={(e) => set('nom', e.target.value)} required />
            <Input label="Société" value={form.societe} onChange={(e) => set('societe', e.target.value)} />
            <Input label="Poste" value={form.poste} onChange={(e) => set('poste', e.target.value)} />
          </div>
        </div>

        <div className="form-section">
          <h2 className="form-section-title">Coordonnées</h2>
          <div className="form-grid">
            <Input label="Email *" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
            <Input label="Téléphone fixe" value={form.telephoneFixe} onChange={(e) => set('telephoneFixe', e.target.value)} />
            <Input label="Téléphone mobile" value={form.telephoneMobile} onChange={(e) => set('telephoneMobile', e.target.value)} />
            <Input label="LinkedIn URL" type="url" value={form.linkedinUrl} onChange={(e) => set('linkedinUrl', e.target.value)} placeholder="https://linkedin.com/in/prenom-nom" />
          </div>
        </div>

        <div className="form-section">
          <h2 className="form-section-title">Adresses</h2>
          <div className="grid grid-cols-1 gap-4">
            <Textarea label="Adresse de facturation" value={form.adresseFacturation} onChange={(e) => set('adresseFacturation', e.target.value)} rows={2} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Code postal" value={form.codePostal} onChange={(e) => set('codePostal', e.target.value)} />
              <Input label="Ville" value={form.ville} onChange={(e) => set('ville', e.target.value)} />
            </div>
            <Textarea label="Adresse d'installation (si différente)" value={form.adresseInstallation} onChange={(e) => set('adresseInstallation', e.target.value)} rows={2} />
          </div>
        </div>

        <div className="form-section">
          <h2 className="form-section-title">Informations commerciales</h2>
          <div className="form-grid">
            <Select
              label="Source du lead"
              value={form.sourceLead}
              onChange={(e) => set('sourceLead', e.target.value)}
              options={SOURCES_LEAD.map((s) => ({ value: s, label: s }))}
              placeholder="— Choisir —"
            />
            <Input label="Commercial assigné" value={form.commercial} onChange={(e) => set('commercial', e.target.value)} />
          </div>
          <div className="mt-4">
            <Textarea label="Notes" value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3} />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link href={`/contacts/${id}`}>
            <Button variant="outline" type="button">Annuler</Button>
          </Link>
          <Button type="submit" loading={loading}>Enregistrer</Button>
        </div>
      </form>
    </div>
  )
}
