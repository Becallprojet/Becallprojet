export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isNextResponse } from '@/lib/session'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    if (!lead.linkedinProviderId) {
      return NextResponse.json({ error: 'Provider ID LinkedIn manquant' }, { status: 400 })
    }
    if (lead.statutLinkedin !== 'CONNECTE') {
      return NextResponse.json({ error: 'Le lead doit être connecté pour envoyer un message' }, { status: 409 })
    }

    const apiKey = process.env.UNIPILE_API_KEY
    const dsn = process.env.UNIPILE_DSN
    const accountId = process.env.UNIPILE_ACCOUNT_ID
    if (!apiKey || !dsn || !accountId) {
      return NextResponse.json({ error: 'Configuration Unipile manquante' }, { status: 500 })
    }

    const body = await request.json()
    const texte = body.texte?.trim()
    if (!texte) return NextResponse.json({ error: 'Message vide' }, { status: 400 })

    const form = new FormData()
    form.append('account_id', accountId)
    form.append('attendees_ids', lead.linkedinProviderId)
    form.append('text', texte)

    const res = await fetch(`https://${dsn}/api/v1/chats`, {
      method: 'POST',
      headers: { 'X-API-KEY': apiKey },
      body: form,
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return NextResponse.json(
        { error: err.detail ?? `Erreur Unipile: ${res.status}` },
        { status: res.status }
      )
    }

    const data = await res.json()
    const updated = await prisma.leadLinkedin.update({
      where: { id },
      data: { chatId: data.chat_id ?? null },
    })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
