import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const activites = await prisma.activite.findMany({
      where: { prospectId: id },
      include: { user: { select: { prenom: true, nom: true } } },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(activites)
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

    const activite = await prisma.activite.create({
      data: {
        type: body.type,
        date: new Date(body.date),
        duree: body.duree ? parseInt(body.duree) : null,
        notes: body.notes || null,
        prospectId: id,
        userId,
      },
      include: { user: { select: { prenom: true, nom: true } } },
    })

    return NextResponse.json(activite, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
