import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const STADES_PROSPECT = ['NOUVEAU', 'CONTACTE', 'QUALIFIE', 'PROPOSITION', 'NEGOCIE', 'GAGNE', 'PERDU']

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { stade } = body

    if (!stade || !STADES_PROSPECT.includes(stade)) {
      return NextResponse.json(
        { error: `Stade invalide. Valeurs acceptées : ${STADES_PROSPECT.join(', ')}` },
        { status: 400 }
      )
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: { stade },
    })

    return NextResponse.json(contact)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
