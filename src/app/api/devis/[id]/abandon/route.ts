import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const devis = await prisma.devis.findUnique({
      where: { id },
      include: { bonDeCommande: true },
    })

    if (!devis) {
      return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.devis.update({
        where: { id },
        data: { statut: 'ABANDONNE' },
      })

      if (devis.bonDeCommande) {
        await tx.bonDeCommande.update({
          where: { id: devis.bonDeCommande.id },
          data: { statut: 'ANNULE' },
        })
      }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
