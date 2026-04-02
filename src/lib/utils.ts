export function formatMontant(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

export function formatDateInput(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString().split('T')[0]
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export const STATUT_CONTACT_LABELS: Record<string, string> = {
  PROSPECT: 'Prospect',
  CLIENT: 'Client',
}

export const STATUT_DEVIS_LABELS: Record<string, string> = {
  BROUILLON: 'Brouillon',
  ENVOYE: 'Envoyé',
  ACCEPTE: 'Accepté',
  REFUSE: 'Refusé',
}

export const STATUT_BDC_LABELS: Record<string, string> = {
  EN_COURS: 'En cours',
  LIVRE: 'Livré',
  ANNULE: 'Annulé',
}

export const TYPE_ABONNEMENT_LABELS: Record<string, string> = {
  MATERIEL: 'Matériel',
  OPERATEUR: 'Opérateur',
  PRESTATION: 'Prestation',
  MAINTENANCE: 'Maintenance',
}

export const DUREES_ENGAGEMENT = [12, 24, 36, 48, 60, 63]

export const SOURCES_LEAD = [
  'Site web',
  'Recommandation',
  'Appel entrant',
  'Prospection',
  'Salon / Événement',
  'Réseaux sociaux',
  'Partenaire',
  'Autre',
]
