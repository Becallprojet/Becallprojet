import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateNumeroDevis } from '@/lib/numbering'
import { calculerTotaux } from '@/lib/totals'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const statut = searchParams.get('statut') || ''
    const contactId = searchParams.get('contactId') || ''

    const devis = await prisma.devis.findMany({
      where: {
        AND: [
          statut ? { statut } : {},
          contactId ? { contactId } : {},
          search
            ? {
                OR: [
                  { numero: { contains: search } },
{ contact: { societe: { contains: search } } },
                  { contact: { nom: { contains: search } } },
                ],
              }
            : {},
        ],
      },
      include: {
        contact: { select: { id: true, prenom: true, nom: true, societe: true } },
        _count: { select: { lignes: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(devis)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lignes = [], ...devisData } = body

    const numero = await generateNumeroDevis()
    const totaux = calculerTotaux(lignes)

    const devis = await prisma.devis.create({
      data: {
        numero,
        statut: 'BROUILLON',
        contactId: devisData.contactId,
        dureeEngagement: devisData.dureeEngagement ? parseInt(devisData.dureeEngagement) : null,
        validite: devisData.validite ? parseInt(devisData.validite) : 30,
        conditions: devisData.conditions || null,
        notes: devisData.notes || null,
        noteAbonnements: devisData.noteAbonnements || null,
        noteLocation: devisData.noteLocation || null,
        notePrestation: devisData.notePrestation || null,
        ...totaux,
        lignes: {
          create: lignes.map(
            (
              l: {
                type: string
                designation: string
                description?: string
                quantite: number
                prixUnitaireHT: number
                totalHT: number
                abonnementId?: string
                prestationId?: string
                ordre?: number
              },
              index: number
            ) => ({
              type: l.type,
              designation: l.designation,
              description: l.description || null,
              quantite: l.quantite,
              prixUnitaireHT: l.prixUnitaireHT,
              totalHT: l.totalHT,
              abonnementId: l.abonnementId || null,
              prestationId: l.prestationId || null,
              ordre: l.ordre ?? index,
            })
          ),
        },
      },
      include: {
        contact: true,
        lignes: { orderBy: { ordre: 'asc' } },
      },
    })

    return NextResponse.json(devis, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
