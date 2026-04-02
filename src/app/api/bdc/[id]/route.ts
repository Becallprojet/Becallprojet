import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
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

    return NextResponse.json(bdc)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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
