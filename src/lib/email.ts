import nodemailer from 'nodemailer'
import { formatMontant, formatDate } from './utils'
import { sendEmailViaGmail, type GmailAttachment } from './gmail'
import path from 'path'
import fs from 'fs'

export const runtime = 'nodejs'

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

export interface SendEmailOptions {
  to: string
  subject: string
  message: string
  documentType: 'devis' | 'bdc'
  documentId: string
  documentNumero: string
  documentData: Record<string, unknown>
  userId?: string
}

function generateDocumentHtml(
  type: 'devis' | 'bdc',
  data: Record<string, unknown>,
  baseUrl: string,
  documentId: string
): string {
  const doc = data as {
    numero: string
    contact?: { prenom: string; nom: string; societe?: string }
    totalTTC: number
    totalHT: number
    tva: number
    createdAt: string
    lignes?: Array<{ designation: string; quantite: number; prixUnitaireHT: number; totalHT: number }>
  }

  const url = `${baseUrl}/print/${type === 'devis' ? 'devis' : 'bdc'}/${documentId}`
  const title = type === 'devis' ? 'Devis' : 'Bon de Commande'

  const lignesHtml = (doc.lignes || []).map(l => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${l.designation}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">${l.quantite}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatMontant(l.prixUnitaireHT)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatMontant(l.totalHT)}</td>
    </tr>
  `).join('')

  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>${title} ${doc.numero}</title></head>
<body style="font-family:Arial,sans-serif;margin:0;background:#f8fafc;">
<div style="max-width:640px;margin:32px auto;background:white;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
  <div style="background:#1e40af;padding:24px 32px;">
    <h1 style="color:white;margin:0;font-size:22px;">${title} n° ${doc.numero}</h1>
    <p style="color:#bfdbfe;margin:4px 0 0;">${formatDate(doc.createdAt)}</p>
  </div>
  <div style="padding:32px;">
    ${doc.contact ? `<p style="color:#475569;margin:0 0 24px;"><strong>Client :</strong> ${doc.contact.prenom} ${doc.contact.nom}${doc.contact.societe ? ` — ${doc.contact.societe}` : ''}</p>` : ''}
    ${lignesHtml ? `
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <thead>
        <tr style="background:#f1f5f9;">
          <th style="padding:8px 12px;text-align:left;font-size:12px;color:#64748b;text-transform:uppercase;">Désignation</th>
          <th style="padding:8px 12px;text-align:center;font-size:12px;color:#64748b;text-transform:uppercase;">Qté</th>
          <th style="padding:8px 12px;text-align:right;font-size:12px;color:#64748b;text-transform:uppercase;">PU HT</th>
          <th style="padding:8px 12px;text-align:right;font-size:12px;color:#64748b;text-transform:uppercase;">Total HT</th>
        </tr>
      </thead>
      <tbody>${lignesHtml}</tbody>
    </table>` : ''}
    <div style="background:#f8fafc;padding:16px;border-radius:6px;text-align:right;">
      <p style="margin:4px 0;color:#475569;">Total HT : <strong>${formatMontant(doc.totalHT)}</strong></p>
      <p style="margin:4px 0;color:#475569;">TVA 20% : <strong>${formatMontant(doc.tva)}</strong></p>
      <p style="margin:8px 0 0;font-size:18px;color:#1e293b;">Total TTC : <strong>${formatMontant(doc.totalTTC)}</strong></p>
    </div>
    <div style="margin-top:32px;text-align:center;">
      <a href="${url}" style="background:#1e40af;color:white;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">
        Voir le document complet →
      </a>
    </div>
    <p style="margin-top:24px;font-size:12px;color:#94a3b8;text-align:center;">
      Lien direct : <a href="${url}" style="color:#1e40af;">${url}</a>
    </p>
  </div>
</div>
</body>
</html>`
}

function getCgvAttachment(): { filename: string; path: string; contentType: string } | null {
  const cgvPath = path.join(process.cwd(), 'public', 'cgv.pdf')
  if (fs.existsSync(cgvPath)) {
    return { filename: 'CGV_BECALL.pdf', path: cgvPath, contentType: 'application/pdf' }
  }
  return null
}

export async function sendDocumentEmail(options: SendEmailOptions) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const htmlDocument = generateDocumentHtml(
    options.documentType,
    options.documentData,
    baseUrl,
    options.documentId
  )

  const messageHtml = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;">
      <p style="color:#334155;line-height:1.7;white-space:pre-line;">${options.message.replace(/\n/g, '<br>')}</p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
      ${htmlDocument}
    </div>`

  // Attach CGV only for BDC emails
  const cgvFile = options.documentType === 'bdc' ? getCgvAttachment() : null

  // Attempt to send via Gmail API when a userId is provided
  if (options.userId) {
    try {
      const gmailAttachments: GmailAttachment[] = cgvFile
        ? [{ filename: cgvFile.filename, content: fs.readFileSync(cgvFile.path), contentType: cgvFile.contentType }]
        : []

      await sendEmailViaGmail(options.userId, {
        to: options.to,
        subject: options.subject,
        html: messageHtml,
        from: process.env.SMTP_FROM,
        attachments: gmailAttachments,
      })
      return
    } catch (err) {
      console.warn('[email] Gmail API failed, falling back to SMTP:', err)
    }
  }

  // Fallback: Nodemailer SMTP
  const transporter = getTransporter()

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: options.to,
    subject: options.subject,
    html: messageHtml,
    ...(cgvFile ? { attachments: [{ filename: cgvFile.filename, path: cgvFile.path }] } : {}),
  })
}
