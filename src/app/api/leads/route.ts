import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isNextResponse } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (isNextResponse(user)) return user

    const { searchParams } = new URL(request.url)
    const campagneId = searchParams.get('campagneId')
    const statut = searchParams.get('statut')

    const leads = await prisma.leadLinkedin.findMany({
      where: {
        ...(campagneId ? { campagneId } : {}),
        ...(statut ? { statutLinkedin: statut } : {}),
        ...(user.role !== 'ADMIN' ? { campagne: { userId: user.id } } : {}),
      },
      include: {
        campagne: { select: { id: true, nom: true } },
        opportunite: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(leads)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
