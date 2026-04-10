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

    // Personalize email body with Gemini (fallback to user's message if Gemini fails/unavailable)
    const personalizedMessage = await generatePersonalizedEmail({
      documentType: 'devis',
      documentNumero: devis.numero,
      documentObjet: devis.objet ?? undefined,
      documentTotalTTC: devis.totalTTC,
      contact: {
        civilite: devis.contact?.civilite,
        prenom: devis.contact?.prenom ?? '',
        nom: devis.contact?.nom ?? '',
        societe: devis.contact?.societe,
        poste: devis.contact?.poste,
        stade: devis.contact?.stade,
        notes: devis.contact?.notes,
      },
      expediteur: (session?.user as { name?: string } | undefined)?.name ?? undefined,
      userMessage: message,
    })

    // Generate PDF using localhost (internal access, no auth needed for print pages)
    let pdfBuffer: Buffer | undefined
    try {
      pdfBuffer = await generatePDF(`http://127.0.0.1:3000/print/devis/${id}`)
    } catch (err) {
      console.warn('[email] PDF generation failed, sending without attachment:', err)
    }

    await sendDocumentEmail({
      to,
      subject,
      message: personalizedMessage ?? message ?? '',
      documentType: 'devis',
      documentId: id,
      documentNumero: devis.numero,
      documentData: devis as unknown as Record<string, unknown>,
      userId: (session?.user as { id?: string } | undefined)?.id,
      pdfAttachment: pdfBuffer ? { filename: `Devis-${devis.numero}.pdf`, content: pdfBuffer } : undefined,
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
    return NextResponse.json({ error: "Erreur lors de l'envoi de l'email" }, { status: 500 })
  }
}
