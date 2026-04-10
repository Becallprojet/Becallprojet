export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isNextResponse } from '@/lib/session'
import { BDC_DOCUMENTS } from '@/lib/bdcDocuments'
import path from 'path'
import fs from 'fs'

function getDocPath(slug: string): string {
  return path.join(process.cwd(), 'public', 'docs', `${slug}.pdf`)
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const user = await requireAuth()
  if (isNextResponse(user)) return user
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const { slug } = await params
  if (!BDC_DOCUMENTS.find(d => d.slug === slug)) {
    return NextResponse.json({ error: 'Document inconnu' }, { status: 404 })
  }

  return NextResponse.json({ exists: fs.existsSync(getDocPath(slug)) })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const user = await requireAuth()
  if (isNextResponse(user)) return user
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const { slug } = await params
  if (!BDC_DOCUMENTS.find(d => d.slug === slug)) {
    return NextResponse.json({ error: 'Document inconnu' }, { status: 404 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file || file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Fichier PDF requis' }, { status: 400 })
  }

  const docPath = getDocPath(slug)
  fs.mkdirSync(path.dirname(docPath), { recursive: true })
  fs.writeFileSync(docPath, Buffer.from(await file.arrayBuffer()))

  return NextResponse.json({ ok: true })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const user = await requireAuth()
  if (isNextResponse(user)) return user
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const { slug } = await params
  const docPath = getDocPath(slug)
  if (fs.existsSync(docPath)) fs.unlinkSync(docPath)

  return NextResponse.json({ ok: true })
}
