import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isNextResponse, userScopeFilter } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (isNextResponse(user)) return user

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const statut = searchParams.get('statut') || ''

    const scopeFilter = userScopeFilter(user.id, user.role)

    const bdc = await prisma.bonDeCommande.findMany({
      where: {
        ...(Object.keys(scopeFilter).length ? scopeFilter : {}),
        ...(statut ? { statut } : {}),
        ...(search
          ? {
              OR: [
                { numero: { contains: search } },
                { contact: { societe: { contains: search } } },
                { contact: { nom: { contains: search } } },
              ],
            }
          : {}),
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
