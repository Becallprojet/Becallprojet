export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAnthropicClient } from '@/lib/anthropic'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const now = new Date()

    const [
      pipelineParStade,
      devisEnvoyesAgg,
      devisAcceptesAgg,
      rappelsEnRetard,
      totalContacts,
      contactsGagne,
      devisBrouillon,
      devisEnvoye,
      devisAccepte,
      devisRefuse,
    ] = await Promise.all([
      prisma.contact.groupBy({
        by: ['stade'],
        where: { statut: 'PROSPECT' },
        _count: { _all: true },
      }),
      prisma.devis.aggregate({
        where: { statut: 'ENVOYE' },
        _sum: { totalTTC: true },
        _count: true,
      }),
      prisma.devis.aggregate({
        where: { statut: 'ACCEPTE' },
        _sum: { totalTTC: true },
        _count: true,
      }),
      prisma.rappel.findMany({
        where: {
          fait: false,
          date: { lt: now },
        },
        take: 20,
        orderBy: { date: 'asc' },
        include: {
          prospect: { select: { prenom: true, nom: true, societe: true } },
        },
      }),
      prisma.contact.count(),
      prisma.contact.count({ where: { stade: 'GAGNE' } }),
      prisma.devis.count({ where: { statut: 'BROUILLON' } }),
      prisma.devis.count({ where: { statut: 'ENVOYE' } }),
      prisma.devis.count({ where: { statut: 'ACCEPTE' } }),
      prisma.devis.count({ where: { statut: 'REFUSE' } }),
    ])

    const tauxConversion = totalContacts > 0 ? Math.round((contactsGagne / totalContacts) * 1000) / 10 : 0

    const pipelineDetails =
      pipelineParStade.length > 0
        ? pipelineParStade
            .map((s) => `- Stade "${s.stade ?? 'NOUVEAU'}" : ${s._count._all} prospect(s)`)
            .join('\n')
        : 'Aucun prospect dans le pipeline'

    const rappelsEnRetardInfo =
      rappelsEnRetard.length > 0
        ? rappelsEnRetard
            .slice(0, 10)
            .map(
              (r) =>
                `- [${r.date.toLocaleDateString('fr-FR')}] ${r.titre} — ${r.prospect?.societe || `${r.prospect?.prenom ?? ''} ${r.prospect?.nom ?? ''}`.trim() || 'Prospect inconnu'}`
            )
            .join('\n')
        : 'Aucun rappel en retard'

    const prompt = `Tu es un directeur commercial expert. Analyse ce pipeline commercial et fournis des recommandations stratégiques concrètes.

## État du pipeline au ${now.toLocaleDateString('fr-FR')}

### Contacts
- Total contacts : ${totalContacts}
- Prospects gagnés (stade GAGNE) : ${contactsGagne}
- Taux de conversion : ${tauxConversion}%

### Répartition du pipeline par stade
${pipelineDetails}

### Devis
- En brouillon : ${devisBrouillon}
- Envoyés (en attente de réponse) : ${devisEnvoye} — CA potentiel : ${(devisEnvoyesAgg._sum.totalTTC || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
- Acceptés (signés) : ${devisAccepte} — CA signé : ${(devisAcceptesAgg._sum.totalTTC || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
- Refusés : ${devisRefuse}

### Rappels en retard (${rappelsEnRetard.length} au total)
${rappelsEnRetardInfo}

## Instructions
Génère une réponse JSON avec exactement ces deux clés :
1. "analyse" : un texte d'analyse du pipeline en 3-4 phrases, identifiant les points forts et les risques
2. "recommandations" : un tableau de 3 à 5 recommandations prioritaires, chacune avec les clés :
   - "priorite" : numéro de priorité (1 = plus urgent)
   - "titre" : titre court de la recommandation (max 60 caractères)
   - "detail" : description détaillée de l'action à mener (2-3 phrases)
   - "impact" : niveau d'impact parmi "FORT", "MOYEN" ou "FAIBLE"

Réponds uniquement avec le JSON valide, sans markdown ni texte autour.`

    const message = await getAnthropicClient().messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 2000,
      system:
        'Tu es un directeur commercial expert en stratégie B2B et en management des ventes. Tu analyses les pipelines commerciaux et fournis des recommandations actionnables. Tu réponds uniquement en JSON valide, sans markdown.',
      messages: [{ role: 'user', content: prompt }],
    })

    const rawContent = message.content[0]
    if (rawContent.type !== 'text') {
      return NextResponse.json({ error: 'Réponse IA invalide' }, { status: 500 })
    }

    let result: {
      analyse: string
      recommandations: Array<{ priorite: number; titre: string; detail: string; impact: string }>
    }
    try {
      result = JSON.parse(rawContent.text)
    } catch {
      const match = rawContent.text.match(/\{[\s\S]*\}/)
      if (!match) {
        return NextResponse.json({ error: 'Impossible de parser la réponse IA' }, { status: 500 })
      }
      result = JSON.parse(match[0])
    }

    return NextResponse.json(result)
  } catch (error: unknown) {
    console.error('AI pipeline error:', error)
    if (error instanceof Error) {
      if (error.message.includes('rate_limit') || error.message.includes('429')) {
        return NextResponse.json({ error: 'Limite de requêtes IA atteinte. Réessayez dans quelques instants.' }, { status: 429 })
      }
      if (error.message.includes('authentication') || error.message.includes('401')) {
        return NextResponse.json({ error: "Clé API Anthropic invalide. Vérifiez votre configuration." }, { status: 401 })
      }
    }
    return NextResponse.json({ error: "Erreur lors de l'analyse IA du pipeline" }, { status: 500 })
  }
}
