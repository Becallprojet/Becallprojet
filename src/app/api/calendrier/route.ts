export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createGoogleEvent } from '@/lib/googleCalendar'
import { requireAuth, isNextResponse } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (isNextResponse(user)) return user

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    // For regular users, always use their own userId. Admin can optionally filter by ?userId=
    const filterUserId = user.role === 'ADMIN' ? (searchParams.get('userId') || undefined) : user.id

    const whereBase: Record<string, unknown> = {}
    if (filterUserId) whereBase.userId = filterUserId
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
    const user = await requireAuth()
    if (isNextResponse(user)) return user

    const userId = user.id
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

    // Google Calendar sync (silent — ne bloque jamais)
    try {
      const userRecord = await prisma.user.findUnique({
        where: { id: userId },
        select: { googleCalendarSync: true },
      })
      if (userRecord?.googleCalendarSync) {
        const googleEventId = await createGoogleEvent(userId, rdv)
        if (googleEventId) {
          await prisma.activite.update({
            where: { id: rdv.id },
            data: { googleEventId },
          })
        }
      }
    } catch (gcErr) {
      console.error('[GoogleCalendar] POST sync error:', gcErr)
    }

    return NextResponse.json(rdv, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
