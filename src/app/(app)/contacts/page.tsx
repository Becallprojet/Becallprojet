'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Plus, Search, Phone, Mail, Building2, Upload, CheckCircle, AlertCircle } from 'lucide-react'
import { useSession } from 'next-auth/react'
import * as XLSX from 'xlsx'
import { StatutContactBadge, StadeProspectBadge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { formatDate } from '@/lib/utils'

interface Contact {
  id: string
  statut: string
  stade?: string
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

type ImportRow = Record<string, string>
type ImportResult = { imported: number; skipped: number } | null

function normalizeKey(k: string): string {
  return k.trim().toLowerCase()
    .replace(/[éèê]/g, 'e').replace(/[àâ]/g, 'a').replace(/[ùû]/g, 'u').replace(/[îï]/g, 'i').replace(/[ôö]/g, 'o')
    .replace(/\s+/g, '_')
}

function mapRow(raw: Record<string, unknown>): ImportRow {
  const row: ImportRow = {}
  for (const [k, v] of Object.entries(raw)) {
    const key = normalizeKey(k)
    const aliases: Record<string, string> = {
      prenom: 'prenom', first_name: 'prenom', firstname: 'prenom',
      nom: 'nom', last_name: 'nom', lastname: 'nom',
      email: 'email', mail: 'email',
      telephone: 'telephone', tel: 'telephone', phone: 'telephone', mobile: 'telephone',
      societe: 'societe', company: 'societe', entreprise: 'societe',
      poste: 'poste', titre: 'poste', job_title: 'poste', title: 'poste',
      ville: 'ville', city: 'ville',
      commercial: 'commercial',
      notes: 'notes', note: 'notes',
      linkedin_url: 'linkedin_url', linkedin: 'linkedin_url',
    }
    const mapped = aliases[key] ?? key
    row[mapped] = String(v ?? '').trim()
  }
  return row
}

export default function ContactsPage() {
  const { data: session } = useSession()
  const isAdmin = (session?.user as { role?: string })?.role === 'ADMIN'

  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statut, setStatut] = useState('')

  // Import state
  const [showImport, setShowImport] = useState(false)
  const [importRows, setImportRows] = useState<ImportRow[]>([])
  const [importError, setImportError] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError('')
    setImportResult(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: '' })
        const rows = raw.map(mapRow).filter((r) => r.prenom && r.nom && r.email)
        if (rows.length === 0) {
          setImportError('Aucune ligne valide. Colonnes requises : prenom, nom, email')
          setImportRows([])
        } else {
          setImportRows(rows)
        }
      } catch {
        setImportError('Fichier invalide ou corrompu.')
        setImportRows([])
      }
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  const runImport = async () => {
    setImporting(true)
    try {
      const res = await fetch('/api/contacts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(importRows),
      })
      const data = await res.json()
      if (!res.ok) { setImportError(data.error || 'Erreur lors de l\'import.'); return }
      setImportResult(data)
      setImportRows([])
      loadContacts()
    } finally {
      setImporting(false)
    }
  }

  const closeImport = () => {
    setShowImport(false)
    setImportRows([])
    setImportError('')
    setImportResult(null)
  }

  const loadContacts = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statut) params.set('statut', statut)

    fetch(`/api/contacts?${params}`)
      .then((r) => r.json())
      .then(setContacts)
      .finally(() => setLoading(false))
  }, [search, statut])

  useEffect(() => {
    const timer = setTimeout(loadContacts, 300)
    return () => clearTimeout(timer)
  }, [loadContacts])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Prospects</h1>
          <p className="text-sm text-slate-500 mt-1">{contacts.length} prospect{contacts.length > 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="secondary" onClick={() => { setShowImport(true); setImportResult(null) }}>
              <Upload size={15} />
              Importer en masse
            </Button>
          )}
          <Link href="/contacts/new">
            <Button>
              <Plus size={16} />
              Nouveau prospect
            </Button>
          </Link>
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
        <select
          value={statut}
          onChange={(e) => setStatut(e.target.value)}
          className="px-3 py-2 text-sm border border-[#d0dff5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5FBF]/30 bg-white"
        >
          <option value="">Tous les statuts</option>
          <option value="PROSPECT">Prospects</option>
          <option value="CLIENT">Clients</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-6 h-6 border-4 border-[#1A5FBF] border-t-transparent rounded-full" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <p className="text-sm">Aucun prospect trouvé</p>
            <Link href="/contacts/new" className="mt-2 text-sm text-[#1A5FBF] hover:underline">
              Créer le premier prospect
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Prospect</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Email / Tél</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">Commercial</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Statut</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">Stade</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">Devis / BDC</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Créé le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contacts.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/contacts/${c.id}`} className="block">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#E8F0FD] text-[#1A5FBF] rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
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
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <p className="text-sm text-slate-600">{c.commercial || '—'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <StatutContactBadge statut={c.statut} />
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    {c.stade && <StadeProspectBadge stade={c.stade} />}
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
      {/* Modal import en masse */}
      <Modal open={showImport} onClose={closeImport} title="Importer des prospects en masse" size="lg">
        <div className="space-y-5">
          <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600 space-y-1">
            <p className="font-medium text-slate-700">Colonnes reconnues dans le fichier :</p>
            <p><span className="font-semibold">Obligatoires :</span> prenom, nom, email</p>
            <p><span className="font-semibold">Optionnelles :</span> telephone, societe, poste, ville, commercial, notes, linkedin_url</p>
            <p className="text-xs text-slate-400 pt-1">Les doublons (même email) sont automatiquement ignorés. Formats acceptés : CSV, Excel (.xlsx, .xls)</p>
          </div>

          {importResult ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-800">{importResult.imported} prospect{importResult.imported > 1 ? 's' : ''} importé{importResult.imported > 1 ? 's' : ''}</p>
                {importResult.skipped > 0 && <p className="text-sm text-green-600">{importResult.skipped} ignoré{importResult.skipped > 1 ? 's' : ''} (doublons ou données manquantes)</p>}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-2 border-dashed border-[#d0dff5] rounded-lg hover:border-[#1A5FBF] hover:bg-[#EEF5FF] transition-colors text-slate-600"
                >
                  <Upload size={16} />
                  Choisir un fichier CSV ou Excel
                </button>
                <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,text/csv" onChange={handleFile} className="hidden" />
                {importRows.length > 0 && (
                  <span className="text-sm font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-full">
                    {importRows.length} prospect{importRows.length > 1 ? 's' : ''} détecté{importRows.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {importError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <AlertCircle size={15} className="flex-shrink-0" />
                  {importError}
                </div>
              )}

              {importRows.length > 0 && (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-3 py-2 font-medium text-slate-500">Prénom</th>
                        <th className="text-left px-3 py-2 font-medium text-slate-500">Nom</th>
                        <th className="text-left px-3 py-2 font-medium text-slate-500">Email</th>
                        <th className="text-left px-3 py-2 font-medium text-slate-500 hidden sm:table-cell">Société</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {importRows.slice(0, 5).map((r, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 text-slate-700">{r.prenom}</td>
                          <td className="px-3 py-2 text-slate-700">{r.nom}</td>
                          <td className="px-3 py-2 text-slate-500">{r.email}</td>
                          <td className="px-3 py-2 text-slate-500 hidden sm:table-cell">{r.societe || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importRows.length > 5 && (
                    <p className="px-3 py-2 text-xs text-slate-400 bg-slate-50 border-t border-slate-100">
                      + {importRows.length - 5} ligne{importRows.length - 5 > 1 ? 's' : ''} supplémentaire{importRows.length - 5 > 1 ? 's' : ''}…
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={closeImport}>Fermer</Button>
            {!importResult && (
              <Button onClick={runImport} loading={importing} disabled={importRows.length === 0}>
                Importer {importRows.length > 0 ? `${importRows.length} prospect${importRows.length > 1 ? 's' : ''}` : ''}
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
