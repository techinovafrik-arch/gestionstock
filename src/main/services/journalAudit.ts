import type { PrismaClient, Prisma } from '@prisma/client'
import type { ListerJournalAuditInput } from '../../shared/types'

type Tx = PrismaClient | Prisma.TransactionClient

// CLAUDE.md §6 : toute annulation, ajustement de stock ou modification de prix doit être tracée.
export async function journaliser(
  db: Tx,
  params: { utilisateurId: string; action: string; cible: string; detail?: string }
): Promise<void> {
  await db.journalAudit.create({
    data: {
      utilisateurId: params.utilisateurId,
      action: params.action,
      cible: params.cible,
      detail: params.detail
    }
  })
}

export async function listerJournalAudit(db: PrismaClient, input: ListerJournalAuditInput = {}) {
  return db.journalAudit.findMany({
    where: {
      utilisateurId: input.utilisateurId,
      dateAction: {
        gte: input.periodeDebut ? new Date(input.periodeDebut) : undefined,
        lte: input.periodeFin ? new Date(input.periodeFin) : undefined
      }
    },
    orderBy: { dateAction: 'desc' }
  })
}
