import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categorie = searchParams.get('categorie')
    const abonnements = await prisma.abonnement.findMany({
      where: { actif: true, ...(categorie ? { categorie } : {}) },
      orderBy: [{ type: 'asc' }, { nom: 'asc' }],
    })
    return NextResponse.json(abonnements)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const abonnement = await prisma.abonnement.create({
      data: {
        reference: body.reference,
        nom: body.nom,
        description: body.description || null,
        type: body.type || 'Opérateur',
        categorie: body.categorie || 'ABONNEMENT',
        prixHT: parseFloat(body.prixHT),
        actif: true,
      },
    })

    return NextResponse.json(abonnement, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
