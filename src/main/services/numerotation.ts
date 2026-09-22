import type { Prisma, PrismaClient } from '@prisma/client'

type Tx = PrismaClient | Prisma.TransactionClient

function formaterNumero(prefixe: string, annee: number, sequence: number): string {
  return `${prefixe}-${annee}-${String(sequence).padStart(6, '0')}`
}

// RG-11 : numérotation séquentielle, unique, générée exclusivement côté services (jamais
// côté UI). L'appelant DOIT invoquer ces fonctions à l'intérieur du $transaction qui crée
// le document, pour que le comptage et l'insertion restent atomiques.
export async function genererNumeroBonLivraison(tx: Tx, date: Date = new Date()): Promise<string> {
  const annee = date.getFullYear()
  const total = await tx.bonLivraison.count({
    where: { dateBL: { gte: new Date(annee, 0, 1), lt: new Date(annee + 1, 0, 1) } }
  })
  return formaterNumero('BL', annee, total + 1)
}

export async function genererNumeroFacture(tx: Tx, date: Date = new Date()): Promise<string> {
  const annee = date.getFullYear()
  const total = await tx.facture.count({
    where: { dateFacture: { gte: new Date(annee, 0, 1), lt: new Date(annee + 1, 0, 1) } }
  })
  return formaterNumero('FAC', annee, total + 1)
}
