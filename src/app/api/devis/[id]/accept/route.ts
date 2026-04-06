import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateNumeroBdc, generateNumeroClient } from '@/lib/numbering'

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const devis = await prisma.devis.findUnique({
      where: { id },
      include: {
        lignes: { orderBy: { ordre: 'asc' } },
        bonDeCommande: { select: { id: true } },
      },
    })

    if (!devis) {
      return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
    }
    if (devis.bonDeCommande) {
      return NextResponse.json(
        { error: 'Un bon de commande existe déjà pour ce devis', bdcId: devis.bonDeCommande.id },
        { status: 409 }
      )
    }

    const numeroBdc = await generateNumeroBdc()

    // Check if the contact already has a numeroClient
    const contact = await prisma.contact.findUnique({
      where: { id: devis.contactId },
      select: { numeroClient: true },
    })
    const numeroClientFinal = contact?.numeroClient ?? (await generateNumeroClient())

    const result = await prisma.$transaction(async (tx) => {
      await tx.devis.update({
        where: { id },
        data: {
          statut: 'ACCEPTE',
          dateAcceptation: new Date(),
        },
      })

      await tx.contact.update({
        where: { id: devis.contactId },
        data: { statut: 'CLIENT', stade: 'GAGNE', numeroClient: numeroClientFinal },
      })

      const bdc = await tx.bonDeCommande.create({
        data: {
          numero: numeroBdc,
          statut: 'EN_COURS',
          devisId: id,
          contactId: devis.contactId,
          totalAbonnementHT: devis.totalAbonnementHT,
          totalPrestationsHT: devis.totalPrestationsHT,
          totalHT: devis.totalHT,
          tva: devis.tva,
          totalTTC: devis.totalTTC,
          noteAbonnements: devis.noteAbonnements,
          noteLocation: devis.noteLocation,
          notePrestation: devis.notePrestation,
          lignes: {
            create: devis.lignes.map((l) => ({
              ligneDevisId: l.id,
              type: l.type,
              ordre: l.ordre,
              designation: l.designation,
              description: l.description,
              quantite: l.quantite,
              prixUnitaireHT: l.prixUnitaireHT,
              totalHT: l.totalHT,
            })),
          },
        },
        include: {
          lignes: true,
          contact: true,
        },
      })

      return bdc
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
