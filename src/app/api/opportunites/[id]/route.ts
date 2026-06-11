import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isNextResponse } from '@/lib/session'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    if (isNextResponse(user)) return user

    const { id } = await params
    const opp = await prisma.opportuniteLinkedin.findFirst({
      where: { id, ...(user.role !== 'ADMIN' ? { userId: user.id } : {}) },
      include: {
        lead: {
          include: { campagne: { select: { nom: true, produit: true } } },
        },
      },
    })
    if (!opp) return NextResponse.json({ error: 'Opportunité introuvable' }, { status: 404 })
    return NextResponse.json(opp)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    if (isNextResponse(user)) return user

    const { id } = await params
    const body = await request.json()

    const opp = await prisma.opportuniteLinkedin.findFirst({
      where: { id, ...(user.role !== 'ADMIN' ? { userId: user.id } : {}) },
    })
    if (!opp) return NextResponse.json({ error: 'Opportunité introuvable' }, { status: 404 })

    const data: Record<string, unknown> = {}
    if ('notes' in body) data.notes = body.notes
    if ('valeurEstimee' in body) data.valeurEstimee = body.valeurEstimee ? parseFloat(body.valeurEstimee) : null

    const updated = await prisma.opportuniteLinkedin.update({ where: { id }, data })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    if (isNextResponse(user)) return user

    const { id } = await params
    const opp = await prisma.opportuniteLinkedin.findFirst({
      where: { id, ...(user.role !== 'ADMIN' ? { userId: user.id } : {}) },
    })
    if (!opp) return NextResponse.json({ error: 'Opportunité introuvable' }, { status: 404 })

    await prisma.opportuniteLinkedin.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
