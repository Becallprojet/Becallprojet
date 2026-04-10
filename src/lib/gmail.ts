export const runtime = 'nodejs'

import { prisma } from '@/lib/prisma'
import { getAccessToken } from '@/lib/googleCalendar'

export interface GmailAttachment {
  filename: string
  content: Buffer
  contentType: string
}

export interface GmailSendOptions {
  to: string
  subject: string
  html: string
  from?: string
  attachments?: GmailAttachment[]
}

/**
 * Encode a Buffer or string to base64url (URL-safe base64 without padding).
 */
function toBase64Url(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/**
 * Build a raw RFC 2822 email, with optional PDF attachments (multipart/mixed).
 */
function buildRawEmail(options: GmailSendOptions & { from: string }): string {
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`
  const hasAttachments = options.attachments && options.attachments.length > 0

  if (!hasAttachments) {
    return [
      `From: ${options.from}`,
      `To: ${options.to}`,
      `Subject: ${options.subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      options.html,
    ].join('\r\n')
  }

  const parts: string[] = [
    `From: ${options.from}`,
    `To: ${options.to}`,
    `Subject: ${options.subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=utf-8',
    '',
    options.html,
  ]

  for (const att of options.attachments!) {
    parts.push(
      `--${boundary}`,
      `Content-Type: ${att.contentType}; name="${att.filename}"`,
      `Content-Disposition: attachment; filename="${att.filename}"`,
      'Content-Transfer-Encoding: base64',
      '',
      att.content.toString('base64')
    )
  }

  parts.push(`--${boundary}--`)
  return parts.join('\r\n')
}

/**
 * Send an email via the Gmail API using the user's OAuth2 refresh token.
 * Throws if the user has no Gmail connection (no refresh token).
 * Returns the Gmail message ID on success.
 */
export async function sendEmailViaGmail(
  userId: string,
  options: GmailSendOptions
): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { googleRefreshToken: true },
  })

  if (!user?.googleRefreshToken) {
    throw new Error('Gmail non connecté')
  }

  const accessToken = await getAccessToken(userId)
  if (!accessToken) {
    throw new Error("Impossible d'obtenir un access token Gmail")
  }

  const fromHeader = options.from ?? 'BECALL <noreply>'
  const rawEmail = buildRawEmail({ ...options, from: fromHeader })
  const encodedEmail = toBase64Url(rawEmail)

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encodedEmail }),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('[Gmail] messages.send failed:', text)
    throw new Error(`Gmail API error: ${res.status}`)
  }

  const data = await res.json()
  return data.id as string
}
