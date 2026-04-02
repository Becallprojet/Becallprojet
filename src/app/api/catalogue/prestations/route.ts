import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const prestations = await prisma.prestation.findMany({
      where: { actif: true },
      orderBy: { nom: 'asc' },
    })
    return NextResponse.json(prestations)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const prestation = await prisma.prestation.create({
      data: {
        reference: body.reference,
        nom: body.nom,
        description: body.description || null,
        prixHT: parseFloat(body.prixHT),
        actif: true,
      },
    })

    return NextResponse.json(prestation, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
