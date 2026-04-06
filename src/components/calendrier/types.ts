export interface CalendrierEvent {
  id: string
  titre: string
  date: string // ISO string
  type: 'RDV' | 'RAPPEL'
  prospectId?: string
  prospectNom?: string
  duree?: number
  notes?: string
  userId: string
  fait?: boolean
}
