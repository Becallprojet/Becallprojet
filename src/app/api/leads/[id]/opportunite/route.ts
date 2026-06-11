import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isNextResponse } from '@/lib/session'

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    if (isNextResponse(user)) return user

    const { id: leadId } = await params
    const lead = await prisma.leadLinkedin.findUnique({
      where: { id: leadId },
      include: {
        campagne: { select: { userId: true } },
        opportunite: { select: { id: true } },
      },
    })
    if (!lead) return NextResponse.json({ error: 'Lead introuvable' }, { status: 404 })
    if (user.role !== 'ADMIN' && lead.campagne.userId !== user.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }
    if (lead.opportunite) {
      return NextResponse.json({ error: 'Opportunité déjà créée' }, { status: 409 })
    }

    const opportunite = await prisma.$transaction(async (tx) => {
      await tx.leadLinkedin.update({
        where: { id: leadId },
        data: { statutLinkedin: 'CONVERTI' },
      })
      return tx.opportuniteLinkedin.create({
        data: { leadId, userId: user.id },
        include: { lead: { select: { prenom: true, nom: true, societe: true } } },
      })
    })
    return NextResponse.json(opportunite, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
