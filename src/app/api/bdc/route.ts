import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const statut = searchParams.get('statut') || ''

    const bdc = await prisma.bonDeCommande.findMany({
      where: {
        AND: [
          statut ? { statut } : {},
          search
            ? {
                OR: [
                  { numero: { contains: search } },
                  { contact: { societe: { contains: search } } },
                  { contact: { nom: { contains: search } } },
                ],
              }
            : {},
        ],
      },
      include: {
        contact: { select: { id: true, prenom: true, nom: true, societe: true } },
        devis: { select: { numero: true } },
        _count: { select: { lignes: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(bdc)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
