export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  // Verify secret
  const secret = request.headers.get('x-clay-secret')
  if (!secret || secret !== process.env.CLAY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  let body: {
    firstName?: string
    lastName?: string
    email?: string
    company?: string
    title?: string
    linkedinUrl?: string
    phone?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  if (!body.email) {
    return NextResponse.json({ error: 'Email requis' }, { status: 400 })
  }

  const now = new Date()

  // Check if contact exists
  const existing = await prisma.contact.findFirst({
    where: { email: body.email },
    select: { id: true },
  })

  if (existing) {
    await prisma.contact.update({
      where: { id: existing.id },
      data: {
        ...(body.title !== undefined ? { poste: body.title } : {}),
        ...(body.company !== undefined ? { societe: body.company } : {}),
        ...(body.linkedinUrl !== undefined ? { linkedinUrl: body.linkedinUrl } : {}),
        ...(body.phone !== undefined ? { telephoneMobile: body.phone } : {}),
        clayEnrichedAt: now,
      },
    })

    return NextResponse.json({ success: true, contactId: existing.id, action: 'updated' })
  } else {
    const contact = await prisma.contact.create({
      data: {
        prenom: body.firstName ?? '',
        nom: body.lastName ?? '',
        email: body.email,
        societe: body.company ?? null,
        poste: body.title ?? null,
        linkedinUrl: body.linkedinUrl ?? null,
        telephoneMobile: body.phone ?? null,
        statut: 'PROSPECT',
        sourceLead: 'CLAY',
        stade: 'NOUVEAU',
        clayEnrichedAt: now,
      },
    })

    return NextResponse.json({ success: true, contactId: contact.id, action: 'created' }, { status: 201 })
  }
}

export async function GET(request: NextRequest) {
  // Verify secret via query param
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (!secret || secret !== process.env.CLAY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const prospects = await prisma.contact.findMany({
    where: { statut: 'PROSPECT' },
    select: {
      prenom: true,
      nom: true,
      email: true,
      societe: true,
      poste: true,
      linkedinUrl: true,
      telephoneMobile: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const data = prospects.map((p) => ({
    firstName: p.prenom,
    lastName: p.nom,
    email: p.email,
    company: p.societe ?? null,
    title: p.poste ?? null,
    linkedinUrl: p.linkedinUrl ?? null,
    phone: p.telephoneMobile ?? null,
  }))

  return NextResponse.json(data)
}
