export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendDocumentEmail } from '@/lib/email'
import { generatePDF } from '@/lib/puppeteer'
import { defaultBdcMessage } from '@/lib/emailTemplates'

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

    // Use user's message if provided, otherwise use standard template
    const emailMessage = message?.trim()
      ? message
      : defaultBdcMessage(
          {
            civilite: bdc.contact?.civilite,
            prenom: bdc.contact?.prenom ?? '',
            nom: bdc.contact?.nom ?? '',
            societe: bdc.contact?.societe,
          },
          bdc.numero
        )

    // Generate PDF and attach it
    let pdfBuffer: Buffer | undefined
    try {
      pdfBuffer = await generatePDF(`http://127.0.0.1:3000/print/bdc/${id}`)
    } catch (err) {
      console.warn('[email] PDF generation failed, sending without attachment:', err)
    }

    await sendDocumentEmail({
      to,
      subject,
      message: emailMessage,
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
