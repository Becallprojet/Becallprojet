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

export async function generateNumeroClient(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `CLI-${year}-`

  const last = await prisma.contact.findFirst({
    where: { numeroClient: { startsWith: prefix } },
    orderBy: { numeroClient: 'desc' },
    select: { numeroClient: true },
  })

  const nextSeq = last && last.numeroClient ? parseInt(last.numeroClient.split('-')[2]) + 1 : 1
  return `${prefix}${String(nextSeq).padStart(3, '0')}`
}
