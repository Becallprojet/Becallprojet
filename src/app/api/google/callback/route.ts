export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(
      new URL('/parametres?googleError=no_code', request.url)
    )
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID ?? '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        redirect_uri: process.env.GOOGLE_REDIRECT_URI ?? '',
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      console.error('[Google Callback] Token exchange failed:', await tokenRes.text())
      return NextResponse.redirect(
        new URL('/parametres?googleError=token_exchange', request.url)
      )
    }

    const tokens = await tokenRes.json()
    const refreshToken: string | undefined = tokens.refresh_token

    if (!refreshToken) {
      return NextResponse.redirect(
        new URL('/parametres?googleError=no_refresh_token', request.url)
      )
    }

    const userId = (session.user as { id: string }).id

    await prisma.user.update({
      where: { id: userId },
      data: {
        googleRefreshToken: refreshToken,
        googleCalendarSync: true,
      },
    })

    return NextResponse.redirect(
      new URL('/parametres?googleConnected=true', request.url)
    )
  } catch (err) {
    console.error('[Google Callback] Error:', err)
    return NextResponse.redirect(
      new URL('/parametres?googleError=server_error', request.url)
    )
  }
}
