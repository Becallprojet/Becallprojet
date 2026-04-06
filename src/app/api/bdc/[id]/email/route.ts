export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendDocumentEmail } from '@/lib/email'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    const body = await request.json()
    const { to, subject, message } = body

    if (!to || !subject) {
      return NextResponse.json({ error: 'Destinataire et objet requis' }, { status: 400 })
    }

    const bdc = await prisma.bonDeCommande.findUnique({
      where: { id },
      include: {
        contact: true,
        lignes: { orderBy: { ordre: 'asc' } },
      },
    })

    if (!bdc) {
      return NextResponse.json({ error: 'Bon de commande introuvable' }, { status: 404 })
    }

    await sendDocumentEmail({
      to,
      subject,
      message,
      documentType: 'bdc',
      documentId: id,
      documentNumero: bdc.numero,
      documentData: bdc as unknown as Record<string, unknown>,
      userId: (session?.user as { id?: string } | undefined)?.id,
    })

    if (bdc.statut === 'EN_COURS') {
      await prisma.bonDeCommande.update({
        where: { id },
        data: { statut: 'EN_COURS' },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur lors de l\'envoi de l\'email' }, { status: 500 })
  }
}
