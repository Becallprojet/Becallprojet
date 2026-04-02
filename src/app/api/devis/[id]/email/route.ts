export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendDocumentEmail } from '@/lib/email'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { to, subject, message } = body

    if (!to || !subject) {
      return NextResponse.json({ error: 'Destinataire et objet requis' }, { status: 400 })
    }

    const devis = await prisma.devis.findUnique({
      where: { id },
      include: {
        contact: true,
        lignes: { orderBy: { ordre: 'asc' } },
      },
    })

    if (!devis) {
      return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
    }

    await sendDocumentEmail({
      to,
      subject,
      message,
      documentType: 'devis',
      documentId: id,
      documentNumero: devis.numero,
      documentData: devis as unknown as Record<string, unknown>,
    })

    if (devis.statut === 'BROUILLON') {
      await prisma.devis.update({
        where: { id },
        data: { statut: 'ENVOYE', dateEnvoi: new Date() },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur lors de l\'envoi de l\'email' }, { status: 500 })
  }
}
