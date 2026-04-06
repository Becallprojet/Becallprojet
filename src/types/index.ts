export type StatutContact = 'PROSPECT' | 'CLIENT'
export type StatutDevis = 'BROUILLON' | 'ENVOYE' | 'ACCEPTE' | 'REFUSE'
export type StatutBdc = 'EN_COURS' | 'LIVRE' | 'ANNULE'
export type TypeLigne = 'ABONNEMENT' | 'PRESTATION' | 'LOCATION'
export type TypeAbonnement = 'MATERIEL' | 'OPERATEUR' | 'PRESTATION' | 'MAINTENANCE'

export interface LigneInput {
  tempId: string
  type: TypeLigne
  designation: string
  description: string
  quantite: number
  prixUnitaireHT: number
  totalHT: number
  abonnementId?: string
  prestationId?: string
}

export interface TotauxDevis {
  totalAbonnementHT: number
  totalPrestationsHT: number
  totalHT: number
  tva: number
  totalTTC: number
}
