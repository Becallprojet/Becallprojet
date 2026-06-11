import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isNextResponse } from '@/lib/session'

export async function GET() {
  try {
    const user = await requireAuth()
    if (isNextResponse(user)) return user

    const opportunites = await prisma.opportuniteLinkedin.findMany({
      where: user.role === 'ADMIN' ? {} : { userId: user.id },
      include: {
        lead: {
          select: {
            prenom: true, nom: true, societe: true, poste: true,
            linkedinUrl: true, email: true, telephone: true,
            campagne: { select: { nom: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(opportunites)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
