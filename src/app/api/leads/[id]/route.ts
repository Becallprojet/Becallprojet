import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isNextResponse } from '@/lib/session'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    if (isNextResponse(user)) return user

    const { id } = await params
    const lead = await prisma.leadLinkedin.findUnique({
      where: { id },
      include: {
        campagne: { select: { id: true, nom: true, produit: true, userId: true } },
        opportunite: true,
      },
    })
    if (!lead) return NextResponse.json({ error: 'Lead introuvable' }, { status: 404 })
    if (user.role !== 'ADMIN' && lead.campagne.userId !== user.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }
    return NextResponse.json(lead)
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

    const lead = await prisma.leadLinkedin.findUnique({
      where: { id },
      include: { campagne: { select: { userId: true } } },
    })
    if (!lead) return NextResponse.json({ error: 'Lead introuvable' }, { status: 404 })
    if (user.role !== 'ADMIN' && lead.campagne.userId !== user.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const allowedFields = ['notes', 'statutLinkedin', 'linkedinProviderId', 'messagePersonnalise']
    const data: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (field in body) data[field] = body[field]
    }

    const updated = await prisma.leadLinkedin.update({ where: { id }, data })
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
    const lead = await prisma.leadLinkedin.findUnique({
      where: { id },
      include: { campagne: { select: { userId: true } } },
    })
    if (!lead) return NextResponse.json({ error: 'Lead introuvable' }, { status: 404 })
    if (user.role !== 'ADMIN' && lead.campagne.userId !== user.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    await prisma.leadLinkedin.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
