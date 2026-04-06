import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isNextResponse } from '@/lib/session'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    if (isNextResponse(user)) return user

    const { id } = await params
    const bdc = await prisma.bonDeCommande.findUnique({
      where: { id },
      include: {
        contact: true,
        devis: { select: { id: true, numero: true, objet: true, dureeEngagement: true } },
        lignes: { orderBy: { ordre: 'asc' } },
      },
    })

    if (!bdc) {
      return NextResponse.json({ error: 'Bon de commande introuvable' }, { status: 404 })
    }

    if (bdc.userId && bdc.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    return NextResponse.json(bdc)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    if (isNextResponse(user)) return user

    const { id } = await params

    const existing = await prisma.bonDeCommande.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Bon de commande introuvable' }, { status: 404 })
    }
    if (existing.userId && existing.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()

    const bdc = await prisma.bonDeCommande.update({
      where: { id },
      data: {
        statut: body.statut,
        notes: body.notes || null,
        dateLivraison: body.dateLivraison ? new Date(body.dateLivraison) : null,
      },
    })

    return NextResponse.json(bdc)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    if (isNextResponse(user)) return user

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { id } = await params
    await prisma.bonDeCommande.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
