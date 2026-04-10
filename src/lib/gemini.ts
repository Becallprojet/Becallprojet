import { GoogleGenerativeAI } from '@google/generative-ai'

export function getGeminiClient(): GoogleGenerativeAI {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY est manquante. Veuillez la définir dans votre fichier .env')
  }
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
}

export interface EmailPersonalizationContext {
  documentType: 'devis' | 'bdc'
  documentNumero: string
  documentObjet?: string
  documentTotalTTC: number
  contact: {
    civilite?: string | null
    prenom: string
    nom: string
    societe?: string | null
    poste?: string | null
    stade?: string | null
    notes?: string | null
  }
  expediteur?: string | null
  userMessage?: string
}

/**
 * Generate a personalized email body using Gemini.
 * Falls back gracefully (returns null) if GEMINI_API_KEY is not set.
 */
export async function generatePersonalizedEmail(ctx: EmailPersonalizationContext): Promise<string | null> {
  if (!process.env.GEMINI_API_KEY) return null

  const docLabel = ctx.documentType === 'devis' ? 'devis' : 'bon de commande'
  const civility = ctx.contact.civilite ? `${ctx.contact.civilite} ` : ''
  const contactDesc = [
    `Nom : ${civility}${ctx.contact.prenom} ${ctx.contact.nom}`,
    ctx.contact.societe ? `Société : ${ctx.contact.societe}` : null,
    ctx.contact.poste ? `Poste : ${ctx.contact.poste}` : null,
    ctx.contact.stade ? `Stade pipeline : ${ctx.contact.stade}` : null,
    ctx.contact.notes ? `Notes commerciales : ${ctx.contact.notes}` : null,
  ].filter(Boolean).join('\n')

  const prompt = `Tu dois rédiger le corps d'un email professionnel en français pour accompagner l'envoi d'un ${docLabel}.

## Document
- Type : ${docLabel}
- Numéro : ${ctx.documentNumero}
${ctx.documentObjet ? `- Objet/projet : ${ctx.documentObjet}` : ''}
- Montant TTC : ${ctx.documentTotalTTC.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}

## Destinataire
${contactDesc}

${ctx.expediteur ? `## Expéditeur\n${ctx.expediteur}` : ''}

${ctx.userMessage ? `## Instructions / contexte fourni par le commercial\n${ctx.userMessage}` : ''}

## Consignes
- Rédige uniquement le corps du message (pas d'objet, pas de signature technique)
- Commence directement par la formule d'appel (ex: "Madame," / "Monsieur Dupont,")
- Ton professionnel, chaleureux, personnalisé au contexte du destinataire
- Mentionne le document joint et invite à revenir vers nous pour toute question
- 3 à 5 phrases maximum
- Termine par une formule de politesse complète`

  try {
    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const result = await model.generateContent(prompt)
    return result.response.text().trim()
  } catch (err) {
    console.warn('[Gemini] generatePersonalizedEmail failed:', err)
    return null
  }
}

export async function geminiGenerateJSON(prompt: string, systemInstruction: string): Promise<string> {
  const genAI = getGeminiClient()
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction,
    generationConfig: {
      responseMimeType: 'application/json',
    },
  })
  const result = await model.generateContent(prompt)
  return result.response.text()
}
