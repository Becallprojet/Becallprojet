'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Package, Wrench, MonitorSmartphone, MessageSquare } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Badge from '@/components/ui/Badge'
import { formatMontant } from '@/lib/utils'

interface Abonnement { id: string; reference: string; nom: string; type: string; categorie: string; prixHT: number; description?: string }
interface Prestation { id: string; reference: string; nom: string; type: string; prixHT: number; description?: string }
interface PhraseNote { id: string; texte: string; ordre: number }

const ABO_TYPE_OPTIONS = [
  { value: 'Opérateur', label: 'Opérateur' },
  { value: 'Opérateur mobile', label: 'Opérateur mobile' },
  { value: 'Cyber-Sécurité', label: 'Cyber-Sécurité' },
  { value: 'Maintenance', label: 'Maintenance' },
]

const LOC_TYPE_OPTIONS = [
  { value: 'Matériel de téléphonie', label: 'Matériel de téléphonie' },
  { value: 'Matériel de sécurité', label: 'Matériel de sécurité' },
  { value: 'Socle', label: 'Socle' },
]

const PREST_TYPE_OPTIONS = [
  { value: 'FAS', label: 'FAS' },
  { value: 'Vente matériel de téléphonie', label: 'Vente matériel de téléphonie' },
  { value: 'Vente matériel de sécurité', label: 'Vente matériel de sécurité' },
  { value: 'Frais Installation', label: 'Frais Installation' },
]

const EMPTY_ABO: Abonnement = { id: '', reference: '', nom: '', type: 'Opérateur', categorie: 'ABONNEMENT', prixHT: 0, description: '' }
const EMPTY_LOC: Abonnement = { id: '', reference: '', nom: '', type: 'Matériel de téléphonie', categorie: 'LOCATION', prixHT: 0, description: '' }
const EMPTY_PREST: Prestation = { id: '', reference: '', nom: '', type: 'FAS', prixHT: 0, description: '' }

export default function CataloguePage() {
  const [tab, setTab] = useState<'abonnements' | 'location' | 'prestations' | 'phrases'>('abonnements')
  const [abonnements, setAbonnements] = useState<Abonnement[]>([])
  const [locations, setLocations] = useState<Abonnement[]>([])
  const [prestations, setPrestations] = useState<Prestation[]>([])
  const [phrases, setPhrases] = useState<PhraseNote[]>([])
  const [showAboModal, setShowAboModal] = useState(false)
  const [showLocModal, setShowLocModal] = useState(false)
  const [showPrestModal, setShowPrestModal] = useState(false)
  const [showPhraseModal, setShowPhraseModal] = useState(false)
  const [editingAbo, setEditingAbo] = useState<Abonnement>(EMPTY_ABO)
  const [editingLoc, setEditingLoc] = useState<Abonnement>(EMPTY_LOC)
  const [editingPrest, setEditingPrest] = useState<Prestation>(EMPTY_PREST)
  const [editingPhrase, setEditingPhrase] = useState<PhraseNote>({ id: '', texte: '', ordre: 0 })
  const [saving, setSaving] = useState(false)

  const loadAbonnements = () =>
    fetch('/api/catalogue/abonnements?categorie=ABONNEMENT').then((r) => r.json()).then((d) => setAbonnements(Array.isArray(d) ? d : []))
  const loadLocations = () =>
    fetch('/api/catalogue/abonnements?categorie=LOCATION').then((r) => r.json()).then((d) => setLocations(Array.isArray(d) ? d : []))
  const loadPrestations = () =>
    fetch('/api/catalogue/prestations').then((r) => r.json()).then((d) => setPrestations(Array.isArray(d) ? d : []))
  const loadPhrases = () =>
    fetch('/api/catalogue/phrases').then((r) => r.json()).then((d) => setPhrases(Array.isArray(d) ? d : []))

  useEffect(() => {
    loadAbonnements()
    loadLocations()
    loadPrestations()
    loadPhrases()
  }, [])

  const openAboEdit = (item?: Abonnement) => {
    setEditingAbo(item ? { ...item } : { ...EMPTY_ABO })
    setShowAboModal(true)
  }

  const openLocEdit = (item?: Abonnement) => {
    setEditingLoc(item ? { ...item } : { ...EMPTY_LOC })
    setShowLocModal(true)
  }

  const openPrestEdit = (prest?: Prestation) => {
    setEditingPrest(prest ? { ...prest } : { ...EMPTY_PREST })
    setShowPrestModal(true)
  }

  const saveAbo = async (e: React.FormEvent, item: Abonnement, onClose: () => void, reload: () => void) => {
    e.preventDefault()
    setSaving(true)
    try {
      const url = item.id ? `/api/catalogue/abonnements/${item.id}` : '/api/catalogue/abonnements'
      const method = item.id ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) })
      if (!res.ok) throw new Error()
      onClose()
      reload()
    } catch {
      alert('Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  const savePrest = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const url = editingPrest.id ? `/api/catalogue/prestations/${editingPrest.id}` : '/api/catalogue/prestations'
      const method = editingPrest.id ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingPrest) })
      if (!res.ok) throw new Error()
      setShowPrestModal(false)
      loadPrestations()
    } catch {
      alert('Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  const deleteAbo = async (id: string, reload: () => void) => {
    if (!confirm('Désactiver cet élément ?')) return
    await fetch(`/api/catalogue/abonnements/${id}`, { method: 'DELETE' })
    reload()
  }

  const deletePrest = async (id: string) => {
    if (!confirm('Désactiver cette prestation ?')) return
    await fetch(`/api/catalogue/prestations/${id}`, { method: 'DELETE' })
    loadPrestations()
  }

  const openPhraseEdit = (phrase?: PhraseNote) => {
    setEditingPhrase(phrase ? { ...phrase } : { id: '', texte: '', ordre: phrases.length })
    setShowPhraseModal(true)
  }

  const savePhrase = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const url = editingPhrase.id ? `/api/catalogue/phrases/${editingPhrase.id}` : '/api/catalogue/phrases'
      const method = editingPhrase.id ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texte: editingPhrase.texte, ordre: editingPhrase.ordre }) })
      if (!res.ok) throw new Error()
      setShowPhraseModal(false)
      loadPhrases()
    } catch {
      alert('Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  const deletePhrase = async (id: string) => {
    if (!confirm('Supprimer cette phrase ?')) return
    await fetch(`/api/catalogue/phrases/${id}`, { method: 'DELETE' })
    loadPhrases()
  }

  const handleAdd = () => {
    if (tab === 'abonnements') openAboEdit()
    else if (tab === 'location') openLocEdit()
    else if (tab === 'phrases') openPhraseEdit()
    else openPrestEdit()
  }

  const addLabel = tab === 'abonnements' ? 'Nouvel abonnement' : tab === 'location' ? 'Nouvelle location' : tab === 'phrases' ? 'Nouvelle phrase' : 'Nouvelle prestation'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Catalogue</h1>
          <p className="text-sm text-slate-500 mt-1">Abonnements, location de matériel et prestations</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus size={16} />
          {addLabel}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-6 w-fit">
        {[
          { key: 'abonnements', label: 'Abonnements', icon: Package, count: abonnements.length },
          { key: 'location', label: 'Location de matériel', icon: MonitorSmartphone, count: locations.length },
          { key: 'prestations', label: 'Prestations', icon: Wrench, count: prestations.length },
          { key: 'phrases', label: 'Notes prédéfinies', icon: MessageSquare, count: phrases.length },
        ].map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setTab(key as typeof tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon size={15} />
            {label}
            <span className="bg-slate-200 text-slate-600 text-xs rounded-full px-1.5 py-0.5">{count}</span>
          </button>
        ))}
      </div>

      {/* Abonnements */}
      {tab === 'abonnements' && (
        <AbonnementTable
          items={abonnements}
          onEdit={openAboEdit}
          onDelete={(id) => deleteAbo(id, loadAbonnements)}
          priceLabel="Prix HT/mois"
        />
      )}

      {/* Location */}
      {tab === 'location' && (
        <AbonnementTable
          items={locations}
          onEdit={openLocEdit}
          onDelete={(id) => deleteAbo(id, loadLocations)}
          priceLabel="Prix HT/mois"
        />
      )}

      {/* Prestations */}
      {tab === 'prestations' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {prestations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <p className="text-sm">Aucune prestation dans le catalogue</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Référence</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Nom</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase hidden md:table-cell">Type</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase">Prix HT</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prestations.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4"><span className="text-xs font-mono text-slate-500">{p.reference}</span></td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-900">{p.nom}</p>
                      {p.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{p.description}</p>}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <Badge variant="purple">{p.type}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold text-slate-900">{formatMontant(p.prixHT)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => openPrestEdit(p)} className="text-slate-400 hover:text-[#0F2A6B] transition-colors"><Edit size={15} /></button>
                        <button onClick={() => deletePrest(p.id)} className="text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Notes prédéfinies */}
      {tab === 'phrases' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {phrases.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <MessageSquare size={28} className="mb-2 text-slate-300" />
              <p className="text-sm">Aucune phrase prédéfinie</p>
              <p className="text-xs mt-1">Ces phrases apparaissent comme choix dans le formulaire de devis</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {phrases.map((ph, i) => (
                <div key={ph.id} className="flex items-start justify-between px-6 py-4 hover:bg-slate-50">
                  <div className="flex items-start gap-3">
                    <span className="text-xs text-slate-400 font-mono mt-0.5 w-4">{i + 1}.</span>
                    <p className="text-sm text-slate-700">{ph.texte}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <button onClick={() => openPhraseEdit(ph)} className="text-slate-400 hover:text-[#0F2A6B] transition-colors"><Edit size={15} /></button>
                    <button onClick={() => deletePhrase(ph.id)} className="text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Abonnement */}
      <Modal open={showAboModal} onClose={() => setShowAboModal(false)} title={editingAbo.id ? "Modifier l'abonnement" : 'Nouvel abonnement'} size="md">
        <form onSubmit={(e) => saveAbo(e, editingAbo, () => setShowAboModal(false), loadAbonnements)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Référence *" value={editingAbo.reference} onChange={(e) => setEditingAbo((p) => ({ ...p, reference: e.target.value }))} required />
            <Select label="Type" value={editingAbo.type} onChange={(e) => setEditingAbo((p) => ({ ...p, type: e.target.value }))} options={ABO_TYPE_OPTIONS} />
          </div>
          <Input label="Nom *" value={editingAbo.nom} onChange={(e) => setEditingAbo((p) => ({ ...p, nom: e.target.value }))} required />
          <Textarea label="Description" value={editingAbo.description || ''} onChange={(e) => setEditingAbo((p) => ({ ...p, description: e.target.value }))} rows={2} />
          <Input label="Prix HT / mois (€) *" type="number" step="0.01" min="0" value={editingAbo.prixHT} onChange={(e) => setEditingAbo((p) => ({ ...p, prixHT: parseFloat(e.target.value) || 0 }))} required />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowAboModal(false)}>Annuler</Button>
            <Button type="submit" loading={saving}>Enregistrer</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Location */}
      <Modal open={showLocModal} onClose={() => setShowLocModal(false)} title={editingLoc.id ? 'Modifier la location' : 'Nouvelle location'} size="md">
        <form onSubmit={(e) => saveAbo(e, editingLoc, () => setShowLocModal(false), loadLocations)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Référence *" value={editingLoc.reference} onChange={(e) => setEditingLoc((p) => ({ ...p, reference: e.target.value }))} required />
            <Select label="Type" value={editingLoc.type} onChange={(e) => setEditingLoc((p) => ({ ...p, type: e.target.value }))} options={LOC_TYPE_OPTIONS} />
          </div>
          <Input label="Nom *" value={editingLoc.nom} onChange={(e) => setEditingLoc((p) => ({ ...p, nom: e.target.value }))} required />
          <Textarea label="Description" value={editingLoc.description || ''} onChange={(e) => setEditingLoc((p) => ({ ...p, description: e.target.value }))} rows={2} />
          <Input label="Prix HT / mois (€) *" type="number" step="0.01" min="0" value={editingLoc.prixHT} onChange={(e) => setEditingLoc((p) => ({ ...p, prixHT: parseFloat(e.target.value) || 0 }))} required />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowLocModal(false)}>Annuler</Button>
            <Button type="submit" loading={saving}>Enregistrer</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Prestation */}
      <Modal open={showPrestModal} onClose={() => setShowPrestModal(false)} title={editingPrest.id ? 'Modifier la prestation' : 'Nouvelle prestation'} size="md">
        <form onSubmit={savePrest} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Référence *" value={editingPrest.reference} onChange={(e) => setEditingPrest((p) => ({ ...p, reference: e.target.value }))} required />
            <Select label="Type" value={editingPrest.type || ''} onChange={(e) => setEditingPrest((p) => ({ ...p, type: e.target.value }))} options={PREST_TYPE_OPTIONS} />
          </div>
          <Input label="Nom *" value={editingPrest.nom} onChange={(e) => setEditingPrest((p) => ({ ...p, nom: e.target.value }))} required />
          <Textarea label="Description" value={editingPrest.description || ''} onChange={(e) => setEditingPrest((p) => ({ ...p, description: e.target.value }))} rows={2} />
          <Input label="Prix HT (€) *" type="number" step="0.01" min="0" value={editingPrest.prixHT} onChange={(e) => setEditingPrest((p) => ({ ...p, prixHT: parseFloat(e.target.value) || 0 }))} required />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowPrestModal(false)}>Annuler</Button>
            <Button type="submit" loading={saving}>Enregistrer</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Phrase */}
      <Modal open={showPhraseModal} onClose={() => setShowPhraseModal(false)} title={editingPhrase.id ? 'Modifier la phrase' : 'Nouvelle phrase prédéfinie'} size="md">
        <form onSubmit={savePhrase} className="space-y-4">
          <Textarea
            label="Texte de la phrase *"
            value={editingPhrase.texte}
            onChange={(e) => setEditingPhrase((p) => ({ ...p, texte: e.target.value }))}
            rows={3}
            hint="Cette phrase apparaîtra comme option à cocher dans le formulaire de devis"
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowPhraseModal(false)}>Annuler</Button>
            <Button type="submit" loading={saving}>Enregistrer</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function AbonnementTable({
  items,
  onEdit,
  onDelete,
  priceLabel,
}: {
  items: Abonnement[]
  onEdit: (item: Abonnement) => void
  onDelete: (id: string) => void
  priceLabel: string
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-slate-400">
          <p className="text-sm">Aucun élément dans le catalogue</p>
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Référence</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Nom</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase hidden md:table-cell">Type</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase">{priceLabel}</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="px-6 py-4"><span className="text-xs font-mono text-slate-500">{a.reference}</span></td>
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-slate-900">{a.nom}</p>
                  {a.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{a.description}</p>}
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <Badge variant="blue">{a.type}</Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm font-semibold text-slate-900">{formatMontant(a.prixHT)}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => onEdit(a)} className="text-slate-400 hover:text-[#0F2A6B] transition-colors"><Edit size={15} /></button>
                    <button onClick={() => onDelete(a.id)} className="text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
