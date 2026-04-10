export interface BdcDocument {
  slug: string       // filename on disk (without .pdf)
  label: string      // display name in settings
}

export const BDC_DOCUMENTS: BdcDocument[] = [
  { slug: 'cgm',          label: 'Conditions Générales de Maintenance' },
  { slug: 'cgso',         label: 'Conditions Générales des Services Opérateur' },
  { slug: 'cgbdc',        label: 'Conditions Générales du Bon de Commande' },
  { slug: 'cgcst',        label: 'Conditions Générales du Contrat Support Technique Télécom et Infogérance Standard' },
  { slug: 'cpav',         label: 'Conditions Particulières des Abonnements Voix du Contrat Opérateur' },
  { slug: 'cpobi',        label: 'Conditions Particulières des Offres de Services Opérateur Internet de BECALL' },
  { slug: 'cpcb',         label: 'Conditions Particulières du Contrat Connexion BECALL' },
  { slug: 'ipc-services', label: 'IPC Services' },
  { slug: 'ipc-materiel', label: 'IPC Matériel' },
  { slug: 'retractation', label: 'Rétractation BDC' },
]
