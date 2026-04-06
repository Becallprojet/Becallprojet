import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const rappels = await prisma.rappel.findMany({
      where: { prospectId: id },
      include: { user: { select: { prenom: true, nom: true } } },
      orderBy: { date: 'asc' },
    })
    return NextResponse.json(rappels)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const userId = (session.user as any).id as string

    const rappel = await prisma.rappel.create({
      data: {
        titre: body.titre,
        date: new Date(body.date),
        notes: body.notes || null,
        prospectId: id,
        userId,
      },
      include: { user: { select: { prenom: true, nom: true } } },
    })

    return NextResponse.json(rappel, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
