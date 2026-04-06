import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { NextResponse } from 'next/server'

export type SessionUser = {
  id: string
  role: string
  name?: string | null
  email?: string | null
}

export async function requireAuth(): Promise<SessionUser | NextResponse> {
  const session = await getServerSession(authOptions)
  const user = session?.user as SessionUser | undefined
  if (!user?.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  return user
}

export function isNextResponse(val: unknown): val is NextResponse {
  return val instanceof NextResponse
}

export function userScopeFilter(userId: string, role: string) {
  return role === 'ADMIN' ? {} : { userId }
}
