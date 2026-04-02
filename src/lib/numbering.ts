import { prisma } from './prisma'

export async function generateNumeroDevis(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `DEV-${year}-`

  const last = await prisma.devis.findFirst({
    where: { numero: { startsWith: prefix } },
    orderBy: { numero: 'desc' },
    select: { numero: true },
  })

  const nextSeq = last ? parseInt(last.numero.split('-')[2]) + 1 : 1
  return `${prefix}${String(nextSeq).padStart(3, '0')}`
}

export async function generateNumeroBdc(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `BDC-${year}-`

  const last = await prisma.bonDeCommande.findFirst({
    where: { numero: { startsWith: prefix } },
    orderBy: { numero: 'desc' },
    select: { numero: true },
  })

  const nextSeq = last ? parseInt(last.numero.split('-')[2]) + 1 : 1
  return `${prefix}${String(nextSeq).padStart(3, '0')}`
}
