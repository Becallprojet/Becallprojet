export const runtime = 'nodejs'

import { prisma } from '@/lib/prisma'
import { getAccessToken } from '@/lib/googleCalendar'

export interface GmailSendOptions {
  to: string
  subject: string
  html: string
  from?: string
}

/**
 * Encode a string to base64url (URL-safe base64 without padding).
 */
function toBase64Url(input: string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
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
  // 1. Check that the user has a stored refresh token
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { googleRefreshToken: true },
  })

  if (!user?.googleRefreshToken) {
    throw new Error('Gmail non connecté')
  }

  // 2. Get a fresh access token
  const accessToken = await getAccessToken(userId)
  if (!accessToken) {
    throw new Error('Impossible d\'obtenir un access token Gmail')
  }

  // 3. Build the RFC 2822 raw email
  const fromHeader = options.from ?? 'BECALL <noreply>'
  const rawEmail = [
    `From: ${fromHeader}`,
    `To: ${options.to}`,
    `Subject: ${options.subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    options.html,
  ].join('\r\n')

  // 4. Encode to base64url
  const encodedEmail = toBase64Url(rawEmail)

  // 5. Call the Gmail API
  const res = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodedEmail }),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    console.error('[Gmail] messages.send failed:', text)
    throw new Error(`Gmail API error: ${res.status}`)
  }

  const data = await res.json()
  return data.id as string
}
