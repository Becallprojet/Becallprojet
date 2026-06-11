import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isNextResponse } from '@/lib/session'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    if (isNextResponse(user)) return user

    const { id } = await params
    const campagne = await prisma.campagneLinkedin.findFirst({
      where: {
        id,
        ...(user.role !== 'ADMIN' ? { userId: user.id } : {}),
      },
      include: {
        leads: {
          orderBy: { createdAt: 'desc' },
          include: { opportunite: { select: { id: true, stade: true } } },
        },
        _count: { select: { leads: true } },
      },
    })
    if (!campagne) return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 })
    return NextResponse.json(campagne)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    if (isNextResponse(user)) return user

    const { id } = await params
    const body = await request.json()
    const { nom, produit, messageTemplate, statut } = body

    const existing = await prisma.campagneLinkedin.findFirst({
      where: { id, ...(user.role !== 'ADMIN' ? { userId: user.id } : {}) },
    })
    if (!existing) return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 })

    const updated = await prisma.campagneLinkedin.update({
      where: { id },
      data: {
        ...(nom?.trim() && { nom: nom.trim() }),
        ...(produit?.trim() && { produit: produit.trim() }),
        ...(messageTemplate?.trim() && { messageTemplate: messageTemplate.trim() }),
        ...(statut && { statut }),
      },
    })
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
    const existing = await prisma.campagneLinkedin.findFirst({
      where: { id, ...(user.role !== 'ADMIN' ? { userId: user.id } : {}) },
    })
    if (!existing) return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 })

    await prisma.campagneLinkedin.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
