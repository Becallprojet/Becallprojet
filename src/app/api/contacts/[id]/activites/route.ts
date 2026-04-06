import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isNextResponse } from '@/lib/session'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    if (isNextResponse(user)) return user

    const { id } = await params

    const whereFilter =
      user.role === 'ADMIN'
        ? { prospectId: id }
        : { prospectId: id, userId: user.id }

    const activites = await prisma.activite.findMany({
      where: whereFilter,
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
    const user = await requireAuth()
    if (isNextResponse(user)) return user

    const { id } = await params
    const body = await request.json()
    const userId = user.id

    const activite = await prisma.activite.create({
      data: {
        type: body.type,
        titre: body.titre || null,
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
