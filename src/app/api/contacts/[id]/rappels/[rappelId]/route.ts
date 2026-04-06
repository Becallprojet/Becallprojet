import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  _: NextRequest,
  { params }: { params: Promise<{ id: string; rappelId: string }> }
) {
  try {
    const { rappelId } = await params
    const rappel = await prisma.rappel.update({
      where: { id: rappelId },
      data: { fait: true },
      include: { user: { select: { prenom: true, nom: true } } },
    })
    return NextResponse.json(rappel)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
