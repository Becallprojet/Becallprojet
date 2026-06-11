import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isNextResponse } from '@/lib/session'

export async function POST(request: NextRequest) {
  const user = await requireAuth()
  if (isNextResponse(user)) return user

  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Réservé aux administrateurs' }, { status: 403 })
  }

  const rows: Record<string, string>[] = await request.json()

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'Aucune donnée reçue' }, { status: 400 })
  }

  const emails = rows.map((r) => r.email?.trim().toLowerCase()).filter(Boolean)
  const existing = await prisma.contact.findMany({
    where: { email: { in: emails } },
    select: { email: true },
  })
  const existingEmails = new Set(existing.map((e) => e.email.toLowerCase()))

  const toCreate = rows.filter((r) => {
    const email = r.email?.trim().toLowerCase()
    return r.prenom?.trim() && r.nom?.trim() && email && !existingEmails.has(email)
  })

  if (toCreate.length === 0) {
    return NextResponse.json({ imported: 0, skipped: rows.length })
  }

  await prisma.contact.createMany({
    data: toCreate.map((r) => ({
      prenom: r.prenom.trim(),
      nom: r.nom.trim(),
      email: r.email.trim().toLowerCase(),
      societe: r.societe?.trim() || null,
      poste: r.poste?.trim() || null,
      telephoneMobile: r.telephone?.trim() || r.telephoneMobile?.trim() || null,
      telephoneFixe: r.telephoneFixe?.trim() || null,
      ville: r.ville?.trim() || null,
      commercial: r.commercial?.trim() || null,
      notes: r.notes?.trim() || null,
      linkedinUrl: r.linkedin_url?.trim() || r.linkedinUrl?.trim() || null,
      statut: 'PROSPECT',
      stade: 'NOUVEAU',
      userId: user.id,
    })),
    skipDuplicates: true,
  })

  return NextResponse.json({ imported: toCreate.length, skipped: rows.length - toCreate.length })
}
