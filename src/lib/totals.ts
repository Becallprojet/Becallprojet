import { round2 } from './utils'

interface LigneInput {
  type: string
  quantite: number
  prixUnitaireHT: number
}

export interface Totaux {
  totalAbonnementHT: number
  totalPrestationsHT: number
  totalHT: number
  tva: number
  totalTTC: number
}

export function calculerTotaux(lignes: LigneInput[]): Totaux {
  const totalAbonnementHT = round2(
    lignes
      .filter((l) => l.type === 'ABONNEMENT' || l.type === 'LOCATION')
      .reduce((sum, l) => sum + l.quantite * l.prixUnitaireHT, 0)
  )

  const totalPrestationsHT = round2(
    lignes
      .filter((l) => l.type === 'PRESTATION')
      .reduce((sum, l) => sum + l.quantite * l.prixUnitaireHT, 0)
  )

  const totalHT = round2(totalAbonnementHT + totalPrestationsHT)
  const tva = round2(totalHT * 0.2)
  const totalTTC = round2(totalHT + tva)

  return { totalAbonnementHT, totalPrestationsHT, totalHT, tva, totalTTC }
}
