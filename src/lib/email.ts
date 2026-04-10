import nodemailer from 'nodemailer'
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
  pdfAttachment?: { filename: string; content: Buffer }
}

function getPdfAttachment(filename: string, publicFile: string): { filename: string; path: string; contentType: string } | null {
  const filePath = path.join(process.cwd(), 'public', publicFile)
  if (fs.existsSync(filePath)) {
    return { filename, path: filePath, contentType: 'application/pdf' }
  }
  return null
}

export async function sendDocumentEmail(options: SendEmailOptions) {
  // Simple HTML: just the message text, no document preview
  const messageHtml = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:32px;">
      <p style="color:#334155;line-height:1.8;white-space:pre-line;">${options.message.replace(/\n/g, '<br>')}</p>
    </div>`

  // Attach CGV + IPC for BDC emails
  const bdcAttachments = options.documentType === 'bdc'
    ? [
        getPdfAttachment('CGV_BECALL.pdf', 'cgv.pdf'),
        getPdfAttachment('IPC_BECALL.pdf', 'ipc.pdf'),
      ].filter(Boolean) as { filename: string; path: string; contentType: string }[]
    : []

  // Build full attachments list (document PDF + CGV/IPC)
  const gmailAttachmentsList: GmailAttachment[] = []
  if (options.pdfAttachment) {
    gmailAttachmentsList.push({
      filename: options.pdfAttachment.filename,
      content: options.pdfAttachment.content,
      contentType: 'application/pdf',
    })
  }
  bdcAttachments.forEach(f =>
    gmailAttachmentsList.push({ filename: f.filename, content: fs.readFileSync(f.path), contentType: f.contentType })
  )

  const nodemailerAttachments = [
    ...(options.pdfAttachment ? [{ filename: options.pdfAttachment.filename, content: options.pdfAttachment.content }] : []),
    ...bdcAttachments.map(f => ({ filename: f.filename, path: f.path })),
  ]

  // Attempt to send via Gmail API when a userId is provided
  if (options.userId) {
    try {
      await sendEmailViaGmail(options.userId, {
        to: options.to,
        subject: options.subject,
        html: messageHtml,
        from: process.env.SMTP_FROM,
        attachments: gmailAttachmentsList,
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
    ...(nodemailerAttachments.length > 0 ? { attachments: nodemailerAttachments } : {}),
  })
}
