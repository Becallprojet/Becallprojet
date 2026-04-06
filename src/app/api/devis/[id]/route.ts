import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculerTotaux } from '@/lib/totals'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const devis = await prisma.devis.findUnique({
      where: { id },
      include: {
        contact: true,
        lignes: {
          orderBy: { ordre: 'asc' },
          include: { abonnement: true, prestation: true },
        },
        bonDeCommande: {
          select: { id: true, numero: true, statut: true },
        },
      },
    })

    if (!devis) {
      return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
    }

    return NextResponse.json(devis)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.devis.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
    }
    if (existing.statut === 'ACCEPTE') {
      return NextResponse.json({ error: 'Impossible de modifier un devis accepté' }, { status: 403 })
    }

    const { lignes = [], statut, ...devisData } = body
    const totaux = calculerTotaux(lignes)

    const devis = await prisma.$transaction(async (tx) => {
      await tx.ligneDevis.deleteMany({ where: { devisId: id } })

      return tx.devis.update({
        where: { id },
        data: {
          statut: statut || existing.statut,
          contactId: devisData.contactId,
          dureeEngagement: devisData.dureeEngagement ? parseInt(devisData.dureeEngagement) : null,
          validite: devisData.validite ? parseInt(devisData.validite) : 30,
          conditions: devisData.conditions || null,
          notes: devisData.notes || null,
          noteAbonnements: devisData.noteAbonnements || null,
          noteLocation: devisData.noteLocation || null,
          notePrestation: devisData.notePrestation || null,
          dateEnvoi: statut === 'ENVOYE' && !existing.dateEnvoi ? new Date() : existing.dateEnvoi,
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
    })

    return NextResponse.json(devis)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    const isAdmin = (session?.user as any)?.role === 'ADMIN'

    const existing = await prisma.devis.findUnique({ where: { id } })
    if (existing?.statut === 'ACCEPTE' && !isAdmin) {
      return NextResponse.json({ error: 'Impossible de supprimer un devis accepté' }, { status: 403 })
    }

    await prisma.devis.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
