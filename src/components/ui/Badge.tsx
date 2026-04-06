import { cn, STADE_LABELS } from '@/lib/utils'

type BadgeVariant = 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple' | 'orange'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  blue:   'bg-[#EEF5FF] text-[#007BFF]',
  green:  'bg-[#e6fdf4] text-[#00875a]',
  yellow: 'bg-amber-50 text-amber-700',
  red:    'bg-red-50 text-red-700',
  gray:   'bg-slate-100 text-slate-600',
  purple: 'bg-purple-50 text-purple-700',
  orange: 'bg-orange-50 text-orange-700',
}

export default function Badge({ variant = 'gray', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

export function StatutContactBadge({ statut }: { statut: string }) {
  return (
    <Badge variant={statut === 'CLIENT' ? 'green' : 'blue'}>
      {statut === 'CLIENT' ? 'Client' : 'Prospect'}
    </Badge>
  )
}

export function StatutDevisBadge({ statut }: { statut: string }) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    BROUILLON:  { variant: 'gray',   label: 'Brouillon' },
    ENVOYE:     { variant: 'blue',   label: 'Envoyé' },
    ACCEPTE:    { variant: 'green',  label: 'Accepté' },
    REFUSE:     { variant: 'red',    label: 'Refusé' },
    ABANDONNE:  { variant: 'orange', label: 'Abandonné' },
  }
  const { variant, label } = map[statut] || { variant: 'gray', label: statut }
  return <Badge variant={variant}>{label}</Badge>
}

export function StatutBdcBadge({ statut }: { statut: string }) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    EN_COURS: { variant: 'blue',  label: 'En cours' },
    LIVRE:    { variant: 'green', label: 'Livré' },
    ANNULE:   { variant: 'red',   label: 'Annulé' },
  }
  const { variant, label } = map[statut] || { variant: 'gray', label: statut }
  return <Badge variant={variant}>{label}</Badge>
}

export function StadeProspectBadge({ stade }: { stade: string }) {
  const map: Record<string, { variant: BadgeVariant }> = {
    NOUVEAU:     { variant: 'gray' },
    CONTACTE:    { variant: 'blue' },
    QUALIFIE:    { variant: 'purple' },
    PROPOSITION: { variant: 'yellow' },
    NEGOCIE:     { variant: 'orange' },
    GAGNE:       { variant: 'green' },
    PERDU:       { variant: 'red' },
  }
  const { variant } = map[stade] || { variant: 'gray' }
  return <Badge variant={variant}>{STADE_LABELS[stade] ?? stade}</Badge>
}
