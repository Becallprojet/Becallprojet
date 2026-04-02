'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, ShieldCheck, User, KeyRound } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'

interface UserRow {
  id: string
  email: string
  nom: string
  prenom: string
  role: string
  actif: boolean
  createdAt: string
}

const emptyForm = { email: '', nom: '', prenom: '', password: '', role: 'USER', actif: true }

export default function AdminPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPwdModal, setShowPwdModal] = useState(false)
  const [editing, setEditing] = useState<UserRow | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [pwdUserId, setPwdUserId] = useState('')

  const load = () => {
    fetch('/api/admin/users').then(r => r.json()).then(setUsers).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (u: UserRow) => {
    setEditing(u)
    setForm({ email: u.email, nom: u.nom, prenom: u.prenom, password: '', role: u.role, actif: u.actif })
    setShowModal(true)
  }

  const openPassword = (u: UserRow) => {
    setPwdUserId(u.id)
    setNewPassword('')
    setShowPwdModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const url = editing ? `/api/admin/users/${editing.id}` : '/api/admin/users'
      const method = editing ? 'PUT' : 'POST'
      const body = editing
        ? { email: form.email, nom: form.nom, prenom: form.prenom, role: form.role, actif: form.actif }
        : form
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) { const d = await res.json(); alert(d.error); return }
      setShowModal(false)
      load()
    } finally { setSaving(false) }
  }

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 6) { alert('Mot de passe trop court (6 caractères min.)'); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${pwdUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      })
      if (!res.ok) { alert('Erreur'); return }
      setShowPwdModal(false)
    } finally { setSaving(false) }
  }

  const handleDelete = async (u: UserRow) => {
    if (!confirm(`Supprimer ${u.prenom} ${u.nom} ?`)) return
    const res = await fetch(`/api/admin/users/${u.id}`, { method: 'DELETE' })
    if (!res.ok) { const d = await res.json(); alert(d.error); return }
    load()
  }

  const toggleActif = async (u: UserRow) => {
    await fetch(`/api/admin/users/${u.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: u.email, nom: u.nom, prenom: u.prenom, role: u.role, actif: !u.actif }),
    })
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0F2A6B' }}>Gestion des utilisateurs</h1>
          <p className="text-sm text-slate-500 mt-1">{users.length} utilisateur{users.length > 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} />
          Nouvel utilisateur
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-6 h-6 border-4 border-t-transparent rounded-full" style={{ borderColor: '#0F2A6B', borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Utilisateur</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Rôle</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                        style={{ background: u.role === 'ADMIN' ? '#0F2A6B' : '#64748b' }}>
                        {u.prenom[0]}{u.nom[0]}
                      </div>
                      <span className="text-sm font-medium text-slate-900">{u.prenom} {u.nom}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${
                      u.role === 'ADMIN' ? 'bg-[#E8F0FD] text-[#1A5FBF]' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {u.role === 'ADMIN' ? <ShieldCheck size={11} /> : <User size={11} />}
                      {u.role === 'ADMIN' ? 'Admin' : 'Utilisateur'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleActif(u)}
                      className={`text-xs font-medium px-2.5 py-0.5 rounded-full cursor-pointer border-0 ${
                        u.actif ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                      }`}>
                      {u.actif ? 'Actif' : 'Inactif'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openPassword(u)} className="text-slate-400 hover:text-yellow-600 transition-colors" title="Changer le mot de passe">
                        <KeyRound size={16} />
                      </button>
                      <button onClick={() => openEdit(u)} className="text-slate-400 hover:text-[#1A5FBF] transition-colors">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(u)} className="text-slate-400 hover:text-red-600 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal créer / éditer */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'} size="md">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Prénom *" value={form.prenom} onChange={e => setForm(p => ({ ...p, prenom: e.target.value }))} required />
            <Input label="Nom *" value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} required />
          </div>
          <Input label="Email *" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
          {!editing && (
            <Input label="Mot de passe *" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required placeholder="Minimum 6 caractères" />
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Rôle</label>
            <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-[#d0dff5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5FBF]/30 focus:border-[#1A5FBF] bg-white text-[#1C1C2E]">
              <option value="USER">Utilisateur</option>
              <option value="ADMIN">Administrateur</option>
            </select>
          </div>
          {editing && (
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input type="checkbox" checked={form.actif} onChange={e => setForm(p => ({ ...p, actif: e.target.checked }))} className="rounded" />
              Compte actif
            </label>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button type="submit" loading={saving}>{editing ? 'Enregistrer' : 'Créer'}</Button>
          </div>
        </form>
      </Modal>

      {/* Modal mot de passe */}
      <Modal open={showPwdModal} onClose={() => setShowPwdModal(false)} title="Changer le mot de passe" size="sm">
        <form onSubmit={handlePassword} className="space-y-4">
          <Input label="Nouveau mot de passe *" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required placeholder="Minimum 6 caractères" autoFocus />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowPwdModal(false)}>Annuler</Button>
            <Button type="submit" loading={saving}>Changer</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
