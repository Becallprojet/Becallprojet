'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import { SOURCES_LEAD } from '@/lib/utils'

const CIVILITE_OPTIONS = [
  { value: 'M.', label: 'M.' },
  { value: 'Mme', label: 'Mme' },
]

const STADE_OPTIONS = [
  { value: 'NOUVEAU', label: 'Nouveau' },
  { value: 'CONTACTE', label: 'Contacté' },
  { value: 'QUALIFIE', label: 'Qualifié' },
  { value: 'PROPOSITION', label: 'Proposition' },
  { value: 'NEGOCIE', label: 'Négocié' },
  { value: 'GAGNE', label: 'Gagné' },
  { value: 'PERDU', label: 'Perdu' },
]

export default function NewContactPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
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
    stade: 'NOUVEAU',
  })

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.prenom || !form.nom || !form.email) return

    setLoading(true)
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, statut: 'PROSPECT' }),
      })
      if (!res.ok) throw new Error()
      const contact = await res.json()
      router.push(`/contacts/${contact.id}`)
    } catch {
      alert('Erreur lors de la création du contact.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/contacts" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nouveau prospect</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Identité */}
        <div className="form-section">
          <h2 className="form-section-title">Identité</h2>
          <div className="form-grid">
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
              options={CIVILITE_OPTIONS}
              placeholder="— Choisir —"
            />
            <Input
              label="Prénom *"
              value={form.prenom}
              onChange={(e) => set('prenom', e.target.value)}
              required
              placeholder="Jean"
            />
            <Input
              label="Nom *"
              value={form.nom}
              onChange={(e) => set('nom', e.target.value)}
              required
              placeholder="Dupont"
            />
            <Input
              label="Société"
              value={form.societe}
              onChange={(e) => set('societe', e.target.value)}
              placeholder="Entreprise SA"
            />
            <Input
              label="Poste"
              value={form.poste}
              onChange={(e) => set('poste', e.target.value)}
              placeholder="Directeur technique"
            />
          </div>
        </div>

        {/* Coordonnées */}
        <div className="form-section">
          <h2 className="form-section-title">Coordonnées</h2>
          <div className="form-grid">
            <Input
              label="Email *"
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              required
              placeholder="jean.dupont@entreprise.com"
            />
            <Input
              label="Téléphone fixe"
              type="tel"
              value={form.telephoneFixe}
              onChange={(e) => set('telephoneFixe', e.target.value)}
              placeholder="01 23 45 67 89"
            />
            <Input
              label="Téléphone mobile"
              type="tel"
              value={form.telephoneMobile}
              onChange={(e) => set('telephoneMobile', e.target.value)}
              placeholder="06 12 34 56 78"
            />
            <Input
              label="LinkedIn URL"
              type="url"
              value={form.linkedinUrl}
              onChange={(e) => set('linkedinUrl', e.target.value)}
              placeholder="https://linkedin.com/in/prenom-nom"
            />
          </div>
        </div>

        {/* Adresses */}
        <div className="form-section">
          <h2 className="form-section-title">Adresses</h2>
          <div className="grid grid-cols-1 gap-4">
            <Textarea
              label="Adresse de facturation"
              value={form.adresseFacturation}
              onChange={(e) => set('adresseFacturation', e.target.value)}
              placeholder="1 rue de la Paix"
              rows={2}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Code postal"
                value={form.codePostal}
                onChange={(e) => set('codePostal', e.target.value)}
                placeholder="75001"
              />
              <Input
                label="Ville"
                value={form.ville}
                onChange={(e) => set('ville', e.target.value)}
                placeholder="Paris"
              />
            </div>
            <Textarea
              label="Adresse d'installation (si différente)"
              value={form.adresseInstallation}
              onChange={(e) => set('adresseInstallation', e.target.value)}
              placeholder="Laisser vide si identique à l'adresse de facturation"
              rows={2}
            />
          </div>
        </div>

        {/* Informations commerciales */}
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
            <Input
              label="Commercial assigné"
              value={form.commercial}
              onChange={(e) => set('commercial', e.target.value)}
              placeholder="Nom du commercial"
            />
          </div>
          <div className="mt-4">
            <Textarea
              label="Notes"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Notes libres sur ce contact..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/contacts">
            <Button variant="outline" type="button">Annuler</Button>
          </Link>
          <Button type="submit" loading={loading}>
            Créer le prospect
          </Button>
        </div>
      </form>
    </div>
  )
}
