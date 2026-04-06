import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const rdv = await prisma.activite.update({
      where: { id },
      data: {
        titre: body.titre !== undefined ? body.titre || null : undefined,
        date: body.date ? new Date(body.date) : undefined,
        duree: body.duree !== undefined ? (body.duree ? parseInt(body.duree) : null) : undefined,
        notes: body.notes !== undefined ? body.notes || null : undefined,
        prospectId: body.prospectId !== undefined ? body.prospectId || null : undefined,
      },
      include: {
        prospect: { select: { id: true, prenom: true, nom: true, societe: true } },
        user: { select: { id: true, prenom: true, nom: true } },
      },
    })

    return NextResponse.json(rdv)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params
    await prisma.activite.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
