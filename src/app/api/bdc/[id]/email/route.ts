export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendDocumentEmail } from '@/lib/email'
import { generatePersonalizedEmail } from '@/lib/gemini'
import { generatePDF } from '@/lib/puppeteer'

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

    // Personalize email body with Gemini (fallback to user's message if Gemini fails/unavailable)
    const personalizedMessage = await generatePersonalizedEmail({
      documentType: 'bdc',
      documentNumero: bdc.numero,
      documentTotalTTC: bdc.totalTTC,
      contact: {
        civilite: bdc.contact?.civilite,
        prenom: bdc.contact?.prenom ?? '',
        nom: bdc.contact?.nom ?? '',
        societe: bdc.contact?.societe,
        poste: bdc.contact?.poste,
        stade: bdc.contact?.stade,
        notes: bdc.contact?.notes,
      },
      expediteur: (session?.user as { name?: string } | undefined)?.name ?? undefined,
      userMessage: message,
    })

    // Generate PDF and attach it
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    let pdfBuffer: Buffer | undefined
    try {
      pdfBuffer = await generatePDF(`${baseUrl}/print/bdc/${id}`)
    } catch (err) {
      console.warn('[email] PDF generation failed, sending without attachment:', err)
    }

    await sendDocumentEmail({
      to,
      subject,
      message: personalizedMessage ?? message ?? '',
      documentType: 'bdc',
      documentId: id,
      documentNumero: bdc.numero,
      documentData: bdc as unknown as Record<string, unknown>,
      userId: (session?.user as { id?: string } | undefined)?.id,
      pdfAttachment: pdfBuffer ? { filename: `BDC-${bdc.numero}.pdf`, content: pdfBuffer } : undefined,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erreur lors de l'envoi de l'email" }, { status: 500 })
  }
}
