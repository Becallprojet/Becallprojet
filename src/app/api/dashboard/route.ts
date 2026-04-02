import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [
      totalProspects,
      totalClients,
      devisBrouillon,
      devisEnvoye,
      devisAccepte,
      devisRefuse,
      bdcEnCours,
      bdcLivre,
      dernierDevis,
      derniersContacts,
    ] = await Promise.all([
      prisma.contact.count({ where: { statut: 'PROSPECT' } }),
      prisma.contact.count({ where: { statut: 'CLIENT' } }),
      prisma.devis.count({ where: { statut: 'BROUILLON' } }),
      prisma.devis.count({ where: { statut: 'ENVOYE' } }),
      prisma.devis.count({ where: { statut: 'ACCEPTE' } }),
      prisma.devis.count({ where: { statut: 'REFUSE' } }),
      prisma.bonDeCommande.count({ where: { statut: 'EN_COURS' } }),
      prisma.bonDeCommande.count({ where: { statut: 'LIVRE' } }),
      prisma.devis.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { contact: { select: { prenom: true, nom: true, societe: true } } },
      }),
      prisma.contact.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    const totalCADevis = await prisma.devis.aggregate({
      where: { statut: 'ACCEPTE' },
      _sum: { totalTTC: true },
    })

    return NextResponse.json({
      contacts: { prospects: totalProspects, clients: totalClients },
      devis: { brouillon: devisBrouillon, envoye: devisEnvoye, accepte: devisAccepte, refuse: devisRefuse },
      bdc: { enCours: bdcEnCours, livre: bdcLivre },
      ca: totalCADevis._sum.totalTTC || 0,
      dernierDevis,
      derniersContacts,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
