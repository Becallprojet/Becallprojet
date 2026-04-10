interface ContactInfo {
  civilite?: string | null
  prenom: string
  nom: string
  societe?: string | null
}

function salutation(contact: ContactInfo): string {
  if (contact.civilite === 'M.' || contact.civilite === 'M') {
    return `Monsieur ${contact.nom},`
  }
  if (contact.civilite === 'Mme' || contact.civilite === 'Mme.') {
    return `Madame ${contact.nom},`
  }
  if (contact.prenom && contact.nom) {
    return `Bonjour ${contact.prenom} ${contact.nom},`
  }
  return 'Bonjour,'
}

export function defaultDevisMessage(contact: ContactInfo, numero: string, objet?: string | null): string {
  return `${salutation(contact)}

Veuillez trouver ci-joint votre devis ${numero}${objet ? ` relatif à : ${objet}` : ''}.

Nous restons à votre disposition pour toute question ou pour convenir d'un rendez-vous afin d'échanger sur votre projet.

Dans l'attente de votre retour, nous vous adressons nos cordiales salutations.`
}

export function defaultBdcMessage(contact: ContactInfo, numero: string): string {
  return `${salutation(contact)}

Veuillez trouver ci-joint votre bon de commande ${numero} ainsi que nos conditions générales de vente et informations précontractuelles.

Nous vous remercions de votre confiance et restons disponibles pour toute question relative à votre commande.

Avec nos cordiales salutations.`
}
