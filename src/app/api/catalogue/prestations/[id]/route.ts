import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const prestation = await prisma.prestation.update({
      where: { id },
      data: {
        reference: body.reference,
        nom: body.nom,
        description: body.description || null,
        prixHT: parseFloat(body.prixHT),
        actif: body.actif ?? true,
      },
    })

    return NextResponse.json(prestation)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.prestation.update({
      where: { id },
      data: { actif: false },
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
