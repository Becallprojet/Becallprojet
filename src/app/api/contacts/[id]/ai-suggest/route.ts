export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { geminiGenerateJSON } from '@/lib/gemini'
import { requireAuth, isNextResponse } from '@/lib/session'

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    if (isNextResponse(user)) return user

    const { id } = await params

    const [contact, activites, dernierDevis, rappels] = await Promise.all([
      prisma.contact.findUnique({ where: { id } }),
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

    // Ownership check
    if (contact.userId && contact.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
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
   - "urgence" : niveau d'urgence parmi "HAUTE", "MOYENNE" ou "FAIBLE"`

    const rawText = await geminiGenerateJSON(
      prompt,
      'Tu es un assistant commercial B2B expert en relation client et en stratégie de vente. Tu réponds uniquement en JSON valide, sans markdown.'
    )

    let result: { email: string; action: { type: string; suggestion: string; urgence: string } }
    try {
      result = JSON.parse(rawText)
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/)
      if (!match) {
        return NextResponse.json({ error: 'Impossible de parser la réponse IA' }, { status: 500 })
      }
      result = JSON.parse(match[0])
    }

    return NextResponse.json(result)
  } catch (error: unknown) {
    console.error('AI suggest error:', error)
    if (error instanceof Error) {
      if (error.message.includes('429') || error.message.includes('quota')) {
        return NextResponse.json({ error: 'Limite de requêtes IA atteinte. Réessayez dans quelques instants.' }, { status: 429 })
      }
      if (error.message.includes('API_KEY') || error.message.includes('401') || error.message.includes('403')) {
        return NextResponse.json({ error: 'Clé API Gemini invalide. Vérifiez votre configuration.' }, { status: 401 })
      }
    }
    return NextResponse.json({ error: 'Erreur lors de la génération de la suggestion IA' }, { status: 500 })
  }
}
