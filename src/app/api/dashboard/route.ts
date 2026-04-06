import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isNextResponse } from '@/lib/session'

export async function GET() {
  try {
    const user = await requireAuth()
    if (isNextResponse(user)) return user

    const isAdmin = user.role === 'ADMIN'
    const userFilter = isAdmin ? {} : { userId: user.id }

    const now = new Date()

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
      pipelineParStade,
      activitesRecentes,
      rappelsDuJour,
      caBdcAggregate,
      totalContacts,
      contactsGagne,
    ] = await Promise.all([
      prisma.contact.count({ where: { ...userFilter, statut: 'PROSPECT' } }),
      prisma.contact.count({ where: { ...userFilter, statut: 'CLIENT' } }),
      prisma.devis.count({ where: { ...userFilter, statut: 'BROUILLON' } }),
      prisma.devis.count({ where: { ...userFilter, statut: 'ENVOYE' } }),
      prisma.devis.count({ where: { ...userFilter, statut: 'ACCEPTE' } }),
      prisma.devis.count({ where: { ...userFilter, statut: 'REFUSE' } }),
      prisma.bonDeCommande.count({ where: { ...userFilter, statut: 'EN_COURS' } }),
      prisma.bonDeCommande.count({ where: { ...userFilter, statut: 'LIVRE' } }),
      prisma.devis.findMany({
        take: 5,
        where: userFilter,
        orderBy: { createdAt: 'desc' },
        include: { contact: { select: { prenom: true, nom: true, societe: true } } },
      }),
      prisma.contact.findMany({
        take: 5,
        where: userFilter,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.contact.groupBy({
        by: ['stade'],
        where: { ...userFilter, statut: 'PROSPECT' },
        _count: { _all: true },
      }),
      prisma.activite.findMany({
        take: 8,
        where: isAdmin ? {} : { userId: user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          prospect: { select: { id: true, prenom: true, nom: true, societe: true } },
          user: { select: { id: true, prenom: true, nom: true } },
        },
      }),
      prisma.rappel.findMany({
        where: {
          ...(isAdmin ? {} : { userId: user.id }),
          fait: false,
          date: { lte: now },
        },
        include: {
          prospect: { select: { id: true, prenom: true, nom: true, societe: true } },
        },
        orderBy: { date: 'asc' },
      }),
      prisma.bonDeCommande.aggregate({
        where: { ...userFilter, statut: { in: ['EN_COURS', 'LIVRE'] } },
        _sum: { totalTTC: true },
      }),
      prisma.contact.count({ where: userFilter }),
      prisma.contact.count({ where: { ...userFilter, stade: 'GAGNE' } }),
    ])

    const totalCADevis = await prisma.devis.aggregate({
      where: { ...userFilter, statut: 'ACCEPTE' },
      _sum: { totalTTC: true },
    })

    const tauxConversion = totalContacts > 0 ? (contactsGagne / totalContacts) * 100 : 0

    return NextResponse.json({
      contacts: { prospects: totalProspects, clients: totalClients },
      devis: { brouillon: devisBrouillon, envoye: devisEnvoye, accepte: devisAccepte, refuse: devisRefuse },
      bdc: { enCours: bdcEnCours, livre: bdcLivre },
      ca: totalCADevis._sum.totalTTC || 0,
      dernierDevis,
      derniersContacts,
      pipelineParStade: pipelineParStade.map((s) => ({ stade: s.stade ?? 'NOUVEAU', count: s._count._all })),
      activitesRecentes,
      rappelsDuJour,
      caBdc: caBdcAggregate._sum.totalTTC || 0,
      tauxConversion: Math.round(tauxConversion * 10) / 10,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
