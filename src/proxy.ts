import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const pathname = req.nextUrl.pathname

  // Pas connecté → login
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Accès admin réservé aux ADMIN
  if (pathname.startsWith('/admin') && (token as any).role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!login|print|api/auth|api/pdf|_next/static|_next/image|favicon.ico|logo).*)'],
}
