import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isNextResponse } from '@/lib/session'

function personaliserMessage(template: string, lead: { prenom: string; nom: string; societe?: string | null; poste?: string | null }): string {
  return template
    .replace(/\{\{prenom\}\}/gi, lead.prenom)
    .replace(/\{\{nom\}\}/gi, lead.nom)
    .replace(/\{\{societe\}\}/gi, lead.societe ?? '')
    .replace(/\{\{poste\}\}/gi, lead.poste ?? '')
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    if (isNextResponse(user)) return user

    const { id } = await params
    const campagne = await prisma.campagneLinkedin.findFirst({
      where: { id, ...(user.role !== 'ADMIN' ? { userId: user.id } : {}) },
    })
    if (!campagne) return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 })

    const leads = await prisma.leadLinkedin.findMany({
      where: { campagneId: id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(leads)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    if (isNextResponse(user)) return user

    const { id: campagneId } = await params
    const campagne = await prisma.campagneLinkedin.findFirst({
      where: { id: campagneId, ...(user.role !== 'ADMIN' ? { userId: user.id } : {}) },
    })
    if (!campagne) return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 })

    const body = await request.json()

    // Batch import (CSV ou multiple)
    if (Array.isArray(body)) {
      const valides = body.filter((l) => l.prenom?.trim() && l.nom?.trim())
      if (valides.length === 0) {
        return NextResponse.json({ error: 'Aucun lead valide' }, { status: 400 })
      }
      const created = await prisma.$transaction(
        valides.map((l) =>
          prisma.leadLinkedin.create({
            data: {
              campagneId,
              prenom: l.prenom.trim(),
              nom: l.nom.trim(),
              email: l.email?.trim() || null,
              telephone: l.telephone?.trim() || null,
              linkedinUrl: l.linkedin_url?.trim() || l.linkedinUrl?.trim() || null,
              linkedinProviderId: l.linkedinProviderId?.trim() || null,
              societe: l.societe?.trim() || null,
              poste: l.poste?.trim() || null,
              messagePersonnalise: personaliserMessage(campagne.messageTemplate, l),
            },
          })
        )
      )
      return NextResponse.json(created, { status: 201 })
    }

    // Import manuel (single)
    const { prenom, nom, email, telephone, linkedinUrl, linkedinProviderId, societe, poste } = body
    if (!prenom?.trim() || !nom?.trim()) {
      return NextResponse.json({ error: 'Prénom et nom obligatoires' }, { status: 400 })
    }

    const lead = await prisma.leadLinkedin.create({
      data: {
        campagneId,
        prenom: prenom.trim(),
        nom: nom.trim(),
        email: email?.trim() || null,
        telephone: telephone?.trim() || null,
        linkedinUrl: linkedinUrl?.trim() || null,
        linkedinProviderId: linkedinProviderId?.trim() || null,
        societe: societe?.trim() || null,
        poste: poste?.trim() || null,
        messagePersonnalise: personaliserMessage(campagne.messageTemplate, { prenom, nom, societe, poste }),
      },
    })
    return NextResponse.json(lead, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
