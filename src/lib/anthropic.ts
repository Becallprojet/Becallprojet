import Anthropic from '@anthropic-ai/sdk'

const globalForAnthropic = globalThis as unknown as {
  anthropic: Anthropic | undefined
}

if (process.env.NODE_ENV === 'production' && !process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY est manquante. Veuillez la définir dans votre fichier .env')
}

export const anthropic =
  globalForAnthropic.anthropic ??
  new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || 'sk-ant-PLACEHOLDER',
  })

if (process.env.NODE_ENV !== 'production') globalForAnthropic.anthropic = anthropic
