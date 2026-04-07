import { GoogleGenerativeAI } from '@google/generative-ai'

export function getGeminiClient(): GoogleGenerativeAI {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY est manquante. Veuillez la définir dans votre fichier .env')
  }
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
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
