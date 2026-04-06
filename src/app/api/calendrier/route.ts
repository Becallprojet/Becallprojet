import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const userId = searchParams.get('userId') || undefined

    const whereBase: Record<string, unknown> = {}
    if (userId) whereBase.userId = userId
    if (from || to) {
      whereBase.date = {}
      if (from) (whereBase.date as Record<string, unknown>).gte = new Date(from)
      if (to) (whereBase.date as Record<string, unknown>).lte = new Date(to)
    }

    const [rdvs, rappels] = await Promise.all([
      prisma.activite.findMany({
        where: { ...whereBase, type: 'RDV' },
        include: {
          prospect: { select: { id: true, prenom: true, nom: true, societe: true } },
          user: { select: { id: true, prenom: true, nom: true } },
        },
        orderBy: { date: 'asc' },
      }),
      prisma.rappel.findMany({
        where: whereBase,
        include: {
          prospect: { select: { id: true, prenom: true, nom: true, societe: true } },
          user: { select: { id: true, prenom: true, nom: true } },
        },
        orderBy: { date: 'asc' },
      }),
    ])

    return NextResponse.json({ rdvs, rappels })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const userId = (session.user as { id: string }).id
    const body = await request.json()

    const rdv = await prisma.activite.create({
      data: {
        type: 'RDV',
        titre: body.titre || null,
        date: new Date(body.date),
        duree: body.duree ? parseInt(body.duree) : null,
        notes: body.notes || null,
        prospectId: body.prospectId || null,
        userId,
      },
      include: {
        prospect: { select: { id: true, prenom: true, nom: true, societe: true } },
        user: { select: { id: true, prenom: true, nom: true } },
      },
    })

    return NextResponse.json(rdv, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
