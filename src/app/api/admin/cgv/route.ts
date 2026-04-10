export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isNextResponse } from '@/lib/session'
import path from 'path'
import fs from 'fs'

const CGV_PATH = path.join(process.cwd(), 'public', 'cgv.pdf')

export async function GET() {
  const user = await requireAuth()
  if (isNextResponse(user)) return user
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const exists = fs.existsSync(CGV_PATH)
  return NextResponse.json({ exists })
}

export async function POST(request: NextRequest) {
  const user = await requireAuth()
  if (isNextResponse(user)) return user
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const formData = await request.formData()
  const file = formData.get('cgv') as File | null

  if (!file || file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Fichier PDF requis' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  fs.writeFileSync(CGV_PATH, buffer)

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const user = await requireAuth()
  if (isNextResponse(user)) return user
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  if (fs.existsSync(CGV_PATH)) {
    fs.unlinkSync(CGV_PATH)
  }

  return NextResponse.json({ ok: true })
}
