import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isNextResponse } from '@/lib/session'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    if (isNextResponse(user)) return user

    const { id } = await params
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        devis: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            numero: true,
            objet: true,
            statut: true,
            totalTTC: true,
            createdAt: true,
          },
        },
        bonsDeCommande: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            numero: true,
            statut: true,
            totalTTC: true,
            createdAt: true,
          },
        },
      },
    })

    if (!contact) {
      return NextResponse.json({ error: 'Contact introuvable' }, { status: 404 })
    }

    if (contact.userId && contact.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    return NextResponse.json(contact)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    if (isNextResponse(user)) return user

    const { id } = await params

    const existing = await prisma.contact.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Contact introuvable' }, { status: 404 })
    }
    if (existing.userId && existing.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()

    const contact = await prisma.contact.update({
      where: { id },
      data: {
        statut: body.statut,
        ...(body.stade !== undefined ? { stade: body.stade } : {}),
        civilite: body.civilite || null,
        prenom: body.prenom,
        nom: body.nom,
        societe: body.societe || null,
        poste: body.poste || null,
        email: body.email,
        telephoneFixe: body.telephoneFixe || null,
        telephoneMobile: body.telephoneMobile || null,
        adresseFacturation: body.adresseFacturation || null,
        adresseInstallation: body.adresseInstallation || null,
        codePostal: body.codePostal || null,
        ville: body.ville || null,
        sourceLead: body.sourceLead || null,
        commercial: body.commercial || null,
        notes: body.notes || null,
        linkedinUrl: body.linkedinUrl || null,
      },
    })

    return NextResponse.json(contact)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    if (isNextResponse(user)) return user

    const { id } = await params

    const existing = await prisma.contact.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Contact introuvable' }, { status: 404 })
    }
    if (existing.userId && existing.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    await prisma.contact.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
