export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { anthropic } from '@/lib/anthropic'

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params

    const [contact, activites, dernierDevis, rappels] = await Promise.all([
      prisma.contact.findUnique({
        where: { id },
      }),
      prisma.activite.findMany({
        where: { prospectId: id },
        orderBy: { date: 'desc' },
        take: 10,
        include: { user: { select: { prenom: true, nom: true } } },
      }),
      prisma.devis.findFirst({
        where: { contactId: id },
        orderBy: { createdAt: 'desc' },
        include: {
          lignes: {
            select: { designation: true, quantite: true, prixUnitaireHT: true, type: true },
          },
        },
      }),
      prisma.rappel.findMany({
        where: { prospectId: id, fait: false },
        orderBy: { date: 'asc' },
      }),
    ])

    if (!contact) {
      return NextResponse.json({ error: 'Contact introuvable' }, { status: 404 })
    }

    const contactInfo = [
      `Nom : ${contact.civilite ? contact.civilite + ' ' : ''}${contact.prenom} ${contact.nom}`,
      contact.societe ? `Société : ${contact.societe}` : null,
      contact.poste ? `Poste : ${contact.poste}` : null,
      `Email : ${contact.email}`,
      contact.telephoneMobile ? `Téléphone : ${contact.telephoneMobile}` : null,
      `Statut : ${contact.statut}`,
      contact.stade ? `Stade pipeline : ${contact.stade}` : null,
      contact.sourceLead ? `Source : ${contact.sourceLead}` : null,
      contact.commercial ? `Commercial assigné : ${contact.commercial}` : null,
      contact.notes ? `Notes : ${contact.notes}` : null,
      `Date de création : ${contact.createdAt.toLocaleDateString('fr-FR')}`,
    ]
      .filter(Boolean)
      .join('\n')

    const activitesInfo =
      activites.length > 0
        ? activites
            .map(
              (a) =>
                `- [${a.date.toLocaleDateString('fr-FR')}] ${a.type}${a.duree ? ` (${a.duree} min)` : ''}${a.notes ? ` : ${a.notes}` : ''} — par ${a.user.prenom} ${a.user.nom}`
            )
            .join('\n')
        : 'Aucune activité enregistrée'

    const devisInfo = dernierDevis
      ? [
          `Numéro : ${dernierDevis.numero}`,
          `Objet : ${dernierDevis.objet}`,
          `Statut : ${dernierDevis.statut}`,
          `Total TTC : ${dernierDevis.totalTTC.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`,
          `Date : ${dernierDevis.createdAt.toLocaleDateString('fr-FR')}`,
          dernierDevis.lignes && dernierDevis.lignes.length > 0
            ? `Lignes : ${dernierDevis.lignes.map((l: { designation: string; quantite: number; prixUnitaireHT: number; type: string }) => `${l.designation} (x${l.quantite})`).join(', ')}`
            : null,
        ]
          .filter(Boolean)
          .join('\n')
      : 'Aucun devis'

    const rappelsInfo =
      rappels.length > 0
        ? rappels
            .map((r) => `- [${r.date.toLocaleDateString('fr-FR')}] ${r.titre}${r.notes ? ` : ${r.notes}` : ''}`)
            .join('\n')
        : 'Aucun rappel ouvert'

    const prompt = `Tu es un assistant commercial B2B expert. Analyse ce dossier prospect et génère une suggestion de relance personnalisée.

## Informations du contact
${contactInfo}

## Dernières activités (10 dernières)
${activitesInfo}

## Dernier devis
${devisInfo}

## Rappels ouverts
${rappelsInfo}

## Instructions
Génère une réponse JSON avec exactement ces deux clés :
1. "email" : un email de relance complet, professionnel et personnalisé en français, adapté au contexte du prospect
2. "action" : un objet avec les clés :
   - "type" : type d'action recommandée (ex: "APPEL", "EMAIL", "RDV", "DEVIS")
   - "suggestion" : description détaillée de l'action à mener (2-3 phrases)
   - "urgence" : niveau d'urgence parmi "HAUTE", "MOYENNE" ou "FAIBLE"

Réponds uniquement avec le JSON, sans markdown ni texte autour.`

    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1500,
      system:
        'Tu es un assistant commercial B2B expert en relation client et en stratégie de vente. Tu réponds uniquement en JSON valide, sans markdown.',
      messages: [{ role: 'user', content: prompt }],
    })

    const rawContent = message.content[0]
    if (rawContent.type !== 'text') {
      return NextResponse.json({ error: 'Réponse IA invalide' }, { status: 500 })
    }

    let result: { email: string; action: { type: string; suggestion: string; urgence: string } }
    try {
      result = JSON.parse(rawContent.text)
    } catch {
      // Try to extract JSON from the text
      const match = rawContent.text.match(/\{[\s\S]*\}/)
      if (!match) {
        return NextResponse.json({ error: 'Impossible de parser la réponse IA' }, { status: 500 })
      }
      result = JSON.parse(match[0])
    }

    return NextResponse.json(result)
  } catch (error: unknown) {
    console.error('AI suggest error:', error)
    if (error instanceof Error) {
      if (error.message.includes('rate_limit') || error.message.includes('429')) {
        return NextResponse.json({ error: 'Limite de requêtes IA atteinte. Réessayez dans quelques instants.' }, { status: 429 })
      }
      if (error.message.includes('authentication') || error.message.includes('401')) {
        return NextResponse.json({ error: "Clé API Anthropic invalide. Vérifiez votre configuration." }, { status: 401 })
      }
    }
    return NextResponse.json({ error: 'Erreur lors de la génération de la suggestion IA' }, { status: 500 })
  }
}
