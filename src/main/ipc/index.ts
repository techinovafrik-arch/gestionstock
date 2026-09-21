import type { PrismaClient } from '@prisma/client'
import { enregistrerHandlersReferentiels } from './referentiels'
import { enregistrerHandlersReceptions } from './receptions'
import { enregistrerHandlersStock } from './stock'

export function enregistrerTousLesHandlersIpc(db: PrismaClient): void {
  enregistrerHandlersReferentiels(db)
  enregistrerHandlersReceptions(db)
  enregistrerHandlersStock(db)
}
