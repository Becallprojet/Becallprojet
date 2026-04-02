import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const statut = searchParams.get('statut') || ''

    const contacts = await prisma.contact.findMany({
      where: {
        AND: [
          statut ? { statut } : {},
          search
            ? {
                OR: [
                  { nom: { contains: search } },
                  { prenom: { contains: search } },
                  { societe: { contains: search } },
                  { email: { contains: search } },
                ],
              }
            : {},
        ],
      },
      include: {
        _count: { select: { devis: true, bonsDeCommande: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(contacts)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const contact = await prisma.contact.create({
      data: {
        statut: body.statut || 'PROSPECT',
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
      },
    })

    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
