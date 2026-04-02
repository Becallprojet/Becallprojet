'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Plus, Trash2, Package, MonitorSmartphone, Wrench, Search } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Modal from '@/components/ui/Modal'
import { formatMontant, DUREES_ENGAGEMENT, round2 } from '@/lib/utils'
import { calculerTotaux } from '@/lib/totals'
import { LigneInput } from '@/types'

interface Contact { id: string; prenom: string; nom: string; societe?: string }
interface Abonnement { id: string; reference: string; nom: string; type: string; prixHT: number; description?: string }
interface Prestation { id: string; reference: string; nom: string; type: string; prixHT: number; description?: string }

type ModalSection = 'ABONNEMENT' | 'LOCATION' | 'PRESTATION'

export default function DevisNewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedContactId = searchParams.get('contactId') || ''

  const [contacts, setContacts] = useState<Contact[]>([])
  const [abonnements, setAbonnements] = useState<Abonnement[]>([])
  const [locations, setLocations] = useState<Abonnement[]>([])
  const [prestations, setPrestations] = useState<Prestation[]>([])
  const [lignes, setLignes] = useState<LigneInput[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalSection, setModalSection] = useState<ModalSection>('ABONNEMENT')
  const [catalogueSearch, setCatalogueSearch] = useState('')

  const [form, setForm] = useState({
    contactId: preselectedContactId,
    objet: '',
    dureeEngagement: '36',
    validite: '30',
    conditions: "Devis valable 30 jours à compter de sa date d'émission.",
    notes: '',
  })

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  useEffect(() => {
    Promise.all([
      fetch('/api/contacts').then((r) => r.json()),
      fetch('/api/catalogue/abonnements?categorie=ABONNEMENT').then((r) => r.json()),
      fetch('/api/catalogue/abonnements?categorie=LOCATION').then((r) => r.json()),
      fetch('/api/catalogue/prestations').then((r) => r.json()),
    ]).then(([c, a, l, p]) => {
      setContacts(Array.isArray(c) ? c : [])
      setAbonnements(Array.isArray(a) ? a : [])
      setLocations(Array.isArray(l) ? l : [])
      setPrestations(Array.isArray(p) ? p : [])
    })
  }, [])

  const totaux = calculerTotaux(lignes)

  const openModal = (section: ModalSection) => {
    setModalSection(section)
    setCatalogueSearch('')
    setShowModal(true)
  }

  const addFromCatalogue = (item: Abonnement | Prestation, section: ModalSection) => {
    const ligne: LigneInput = {
      tempId: crypto.randomUUID(),
      type: section,
      designation: item.nom,
      description: item.description || '',
      quantite: 1,
      prixUnitaireHT: item.prixHT,
      totalHT: item.prixHT,
      ...(section !== 'PRESTATION'
        ? { abonnementId: (item as Abonnement).id }
        : { prestationId: (item as Prestation).id }),
    }
    setLignes((prev) => [...prev, ligne])
    setShowModal(false)
  }

  const addManualLigne = (section: ModalSection) => {
    const ligne: LigneInput = {
      tempId: crypto.randomUUID(),
      type: section,
      designation: '',
      description: '',
      quantite: 1,
      prixUnitaireHT: 0,
      totalHT: 0,
    }
    setLignes((prev) => [...prev, ligne])
    setShowModal(false)
  }

  const updateLigne = useCallback(
    (tempId: string, field: string, value: string | number) => {
      setLignes((prev) =>
        prev.map((l) => {
          if (l.tempId !== tempId) return l
          const updated = { ...l, [field]: value }
          if (field === 'quantite' || field === 'prixUnitaireHT') {
            const q = field === 'quantite' ? Number(value) : updated.quantite
            const p = field === 'prixUnitaireHT' ? Number(value) : updated.prixUnitaireHT
            updated.totalHT = round2(q * p)
          }
          return updated
        })
      )
    },
    []
  )

  const removeLigne = useCallback((tempId: string) => {
    setLignes((prev) => prev.filter((l) => l.tempId !== tempId))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.contactId) { alert('Veuillez sélectionner un contact.'); return }
    if (!form.objet) { alert('Veuillez saisir un objet.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/devis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          dureeEngagement: form.dureeEngagement ? parseInt(form.dureeEngagement) : null,
          validite: parseInt(form.validite),
          lignes: lignes.map((l, i) => ({ ...l, ordre: i })),
        }),
      })
      if (!res.ok) throw new Error()
      const devis = await res.json()
      router.push(`/devis/${devis.id}`)
    } catch {
      alert('Erreur lors de la création du devis.')
    } finally {
      setLoading(false)
    }
  }

  const activeList: (Abonnement | Prestation)[] =
    modalSection === 'PRESTATION' ? prestations :
    modalSection === 'LOCATION' ? locations :
    abonnements

  const filteredCatalogue = catalogueSearch
    ? activeList.filter(
        (item) =>
          item.nom.toLowerCase().includes(catalogueSearch.toLowerCase()) ||
          item.reference.toLowerCase().includes(catalogueSearch.toLowerCase())
      )
    : activeList

  const abonnementLignes = lignes.filter((l) => l.type === 'ABONNEMENT')
  const locationLignes = lignes.filter((l) => l.type === 'LOCATION')
  const prestationLignes = lignes.filter((l) => l.type === 'PRESTATION')

  const modalTitle =
    modalSection === 'ABONNEMENT' ? 'Ajouter un abonnement service' :
    modalSection === 'LOCATION' ? 'Ajouter une location de matériel' :
    'Ajouter une prestation'

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/devis" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nouveau devis</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            {/* Infos générales */}
            <div className="form-section">
              <h2 className="form-section-title">Informations générales</h2>
              <div className="form-grid">
                <div>
                  <label className="text-sm font-medium text-slate-700">Contact *</label>
                  <select
                    value={form.contactId}
                    onChange={(e) => set('contactId', e.target.value)}
                    required
                    className="mt-1 w-full px-3 py-2 text-sm border border-[#d0dff5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5FBF]/30 focus:border-[#1A5FBF] bg-white text-[#1C1C2E]"
                  >
                    <option value="">— Sélectionner un contact —</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.prenom} {c.nom}{c.societe ? ` — ${c.societe}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Objet du devis *"
                  value={form.objet}
                  onChange={(e) => set('objet', e.target.value)}
                  placeholder="Ex: Mise en place infrastructure réseau"
                  required
                />
                <Select
                  label="Durée d'engagement"
                  value={form.dureeEngagement}
                  onChange={(e) => set('dureeEngagement', e.target.value)}
                  options={DUREES_ENGAGEMENT.map((d) => ({ value: d, label: `${d} mois` }))}
                  placeholder="Sans engagement"
                />
                <Input
                  label="Validité (jours)"
                  type="number"
                  value={form.validite}
                  onChange={(e) => set('validite', e.target.value)}
                  min={1}
                />
              </div>
            </div>

            {/* Abonnements services */}
            <div className="form-section">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-slate-800">
                  Abonnements services
                  {abonnementLignes.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-slate-500">
                      ({formatMontant(totaux.totalAbonnementHT - lignes.filter(l => l.type === 'LOCATION').reduce((s, l) => s + l.totalHT, 0))}/mois HT)
                    </span>
                  )}
                </h2>
                <Button type="button" variant="secondary" size="sm" onClick={() => openModal('ABONNEMENT')}>
                  <Package size={15} />
                  Ajouter
                </Button>
              </div>

              {abonnementLignes.length === 0 ? (
                <div
                  onClick={() => openModal('ABONNEMENT')}
                  className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center cursor-pointer hover:border-[#1A5FBF] hover:bg-[#E8F0FD]/30 transition-colors"
                >
                  <Package size={24} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Cliquer pour ajouter un abonnement service</p>
                </div>
              ) : (
                <LignesSection lignes={abonnementLignes} onUpdate={updateLigne} onRemove={removeLigne} showUnite="/mois" />
              )}
            </div>

            {/* Location de matériel */}
            <div className="form-section">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-slate-800">
                  Location de matériel
                  {locationLignes.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-slate-500">
                      ({formatMontant(locationLignes.reduce((s, l) => s + l.totalHT, 0))}/mois HT)
                    </span>
                  )}
                </h2>
                <Button type="button" variant="secondary" size="sm" onClick={() => openModal('LOCATION')}>
                  <MonitorSmartphone size={15} />
                  Ajouter
                </Button>
              </div>

              {locationLignes.length === 0 ? (
                <div
                  onClick={() => openModal('LOCATION')}
                  className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center cursor-pointer hover:border-[#1A5FBF] hover:bg-[#E8F0FD]/30 transition-colors"
                >
                  <MonitorSmartphone size={24} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Cliquer pour ajouter une location de matériel</p>
                </div>
              ) : (
                <LignesSection lignes={locationLignes} onUpdate={updateLigne} onRemove={removeLigne} showUnite="/mois" />
              )}
            </div>

            {/* Prestations */}
            <div className="form-section">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-slate-800">
                  Prestations ponctuelles
                  {prestationLignes.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-slate-500">
                      ({formatMontant(totaux.totalPrestationsHT)} HT)
                    </span>
                  )}
                </h2>
                <Button type="button" variant="secondary" size="sm" onClick={() => openModal('PRESTATION')}>
                  <Wrench size={15} />
                  Ajouter
                </Button>
              </div>

              {prestationLignes.length === 0 ? (
                <div
                  onClick={() => openModal('PRESTATION')}
                  className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center cursor-pointer hover:border-[#1A5FBF] hover:bg-[#E8F0FD]/30 transition-colors"
                >
                  <Wrench size={24} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Cliquer pour ajouter une prestation ponctuelle</p>
                </div>
              ) : (
                <LignesSection lignes={prestationLignes} onUpdate={updateLigne} onRemove={removeLigne} />
              )}
            </div>

            {/* Conditions */}
            <div className="form-section">
              <h2 className="form-section-title">Conditions et notes</h2>
              <div className="space-y-4">
                <Textarea
                  label="Conditions"
                  value={form.conditions}
                  onChange={(e) => set('conditions', e.target.value)}
                  rows={2}
                />
                <Textarea
                  label="Notes internes"
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  rows={2}
                  hint="Ces notes ne seront pas visibles par le client"
                />
              </div>
            </div>
          </div>

          {/* Récapitulatif */}
          <div className="xl:col-span-1">
            <div className="sticky top-6 space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-900 mb-4">Récapitulatif</h3>
                <div className="space-y-3">
                  {abonnementLignes.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Abonnements services HT</span>
                      <span className="font-medium">{formatMontant(abonnementLignes.reduce((s, l) => s + l.totalHT, 0))}/mois</span>
                    </div>
                  )}
                  {locationLignes.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Location matériel HT</span>
                      <span className="font-medium">{formatMontant(locationLignes.reduce((s, l) => s + l.totalHT, 0))}/mois</span>
                    </div>
                  )}
                  {prestationLignes.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Prestations HT</span>
                      <span className="font-medium">{formatMontant(totaux.totalPrestationsHT)}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-100 pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Total HT</span>
                      <span className="font-medium">{formatMontant(totaux.totalHT)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">TVA 20%</span>
                      <span className="font-medium">{formatMontant(totaux.tva)}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold border-t border-slate-200 pt-2">
                      <span>Total TTC</span>
                      <span className="text-[#0F2A6B]">{formatMontant(totaux.totalTTC)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button type="submit" loading={loading} size="lg" className="w-full">
                  Créer le devis
                </Button>
                <Link href="/devis">
                  <Button variant="outline" type="button" className="w-full">
                    Annuler
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Modal catalogue */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={modalTitle} size="lg">
        <div className="space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher dans le catalogue..."
              value={catalogueSearch}
              onChange={(e) => setCatalogueSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-[#d0dff5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5FBF]/30 focus:border-[#1A5FBF]"
              autoFocus
            />
          </div>

          <div className="space-y-1 max-h-80 overflow-y-auto">
            {filteredCatalogue.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => addFromCatalogue(item, modalSection)}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-[#E8F0FD] transition-colors flex items-center justify-between group"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900 group-hover:text-[#0F2A6B]">{item.nom}</p>
                  {item.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.description}</p>}
                  <p className="text-xs text-slate-400 mt-0.5">{item.reference}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-sm font-semibold text-slate-900">
                    {formatMontant(item.prixHT)}
                    {modalSection !== 'PRESTATION' && <span className="text-xs font-normal text-slate-500">/mois</span>}
                  </p>
                </div>
              </button>
            ))}
            {filteredCatalogue.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">Aucun élément trouvé</p>
            )}
          </div>

          <div className="border-t border-slate-200 pt-3">
            <button
              type="button"
              onClick={() => addManualLigne(modalSection)}
              className="w-full text-left px-4 py-2.5 text-sm text-[#0F2A6B] hover:bg-[#E8F0FD] rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus size={15} />
              Ajouter une ligne personnalisée
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function LignesSection({
  lignes,
  onUpdate,
  onRemove,
  showUnite,
}: {
  lignes: LigneInput[]
  onUpdate: (tempId: string, field: string, value: string | number) => void
  onRemove: (tempId: string) => void
  showUnite?: string
}) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-12 gap-2 px-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
        <span className="col-span-5">Désignation</span>
        <span className="col-span-2 text-center">Qté</span>
        <span className="col-span-2 text-right">PU HT{showUnite}</span>
        <span className="col-span-2 text-right">Total HT</span>
        <span className="col-span-1" />
      </div>
      {lignes.map((ligne) => (
        <LigneRow key={ligne.tempId} ligne={ligne} onUpdate={onUpdate} onRemove={onRemove} />
      ))}
    </div>
  )
}

function LigneRow({
  ligne,
  onUpdate,
  onRemove,
}: {
  ligne: LigneInput
  onUpdate: (tempId: string, field: string, value: string | number) => void
  onRemove: (tempId: string) => void
}) {
  return (
    <div className="grid grid-cols-12 gap-2 items-center bg-slate-50 rounded-lg px-2 py-2">
      <div className="col-span-5">
        <input
          type="text"
          value={ligne.designation}
          onChange={(e) => onUpdate(ligne.tempId, 'designation', e.target.value)}
          placeholder="Désignation"
          className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#1A5FBF]/40"
        />
      </div>
      <div className="col-span-2">
        <input
          type="number"
          value={ligne.quantite}
          onChange={(e) => onUpdate(ligne.tempId, 'quantite', parseFloat(e.target.value) || 0)}
          min={0}
          step={1}
          className="w-full px-2 py-1.5 text-sm text-center border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#1A5FBF]/40"
        />
      </div>
      <div className="col-span-2">
        <input
          type="number"
          value={ligne.prixUnitaireHT}
          onChange={(e) => onUpdate(ligne.tempId, 'prixUnitaireHT', parseFloat(e.target.value) || 0)}
          min={0}
          step={0.01}
          className="w-full px-2 py-1.5 text-sm text-right border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#1A5FBF]/40"
        />
      </div>
      <div className="col-span-2 text-right">
        <span className="text-sm font-medium text-slate-900 pr-1">{formatMontant(ligne.totalHT)}</span>
      </div>
      <div className="col-span-1 flex justify-end">
        <button
          type="button"
          onClick={() => onRemove(ligne.tempId)}
          className="text-slate-300 hover:text-red-500 transition-colors"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}
