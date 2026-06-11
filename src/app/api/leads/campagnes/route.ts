import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isNextResponse } from '@/lib/session'

export async function GET() {
  try {
    const user = await requireAuth()
    if (isNextResponse(user)) return user

    const campagnes = await prisma.campagneLinkedin.findMany({
      where: user.role === 'ADMIN' ? {} : { userId: user.id },
      include: { _count: { select: { leads: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(campagnes)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (isNextResponse(user)) return user

    const body = await request.json()
    const { nom, produit, messageTemplate } = body

    if (!nom?.trim() || !produit?.trim() || !messageTemplate?.trim()) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
    }

    const campagne = await prisma.campagneLinkedin.create({
      data: {
        nom: nom.trim(),
        produit: produit.trim(),
        messageTemplate: messageTemplate.trim(),
        userId: user.id,
      },
    })
    return NextResponse.json(campagne, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
