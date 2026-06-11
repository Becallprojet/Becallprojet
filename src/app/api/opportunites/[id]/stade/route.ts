import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isNextResponse } from '@/lib/session'

const STADES_VALIDES = ['NOUVEAU_PROJET', 'EN_NEGOCIATION', 'GAGNE', 'PERDU']

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    if (isNextResponse(user)) return user

    const { id } = await params
    const { stade } = await request.json()

    if (!STADES_VALIDES.includes(stade)) {
      return NextResponse.json({ error: 'Stade invalide' }, { status: 400 })
    }

    const opp = await prisma.opportuniteLinkedin.findFirst({
      where: { id, ...(user.role !== 'ADMIN' ? { userId: user.id } : {}) },
    })
    if (!opp) return NextResponse.json({ error: 'Opportunité introuvable' }, { status: 404 })

    const updated = await prisma.opportuniteLinkedin.update({
      where: { id },
      data: { stade },
    })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
