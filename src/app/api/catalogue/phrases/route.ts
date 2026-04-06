import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const phrases = await prisma.phraseNote.findMany({
      where: { actif: true },
      orderBy: { ordre: 'asc' },
    })
    return NextResponse.json(phrases)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const count = await prisma.phraseNote.count()
    const phrase = await prisma.phraseNote.create({
      data: {
        texte: body.texte,
        ordre: body.ordre ?? count,
        actif: true,
      },
    })
    return NextResponse.json(phrase, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
