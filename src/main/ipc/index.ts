import type { PrismaClient } from '@prisma/client'
import { enregistrerHandlersReferentiels } from './referentiels'
import { enregistrerHandlersReceptions } from './receptions'
import { enregistrerHandlersStock } from './stock'
import { enregistrerHandlersVentes } from './ventes'
import { enregistrerHandlersFacturation } from './facturation'

export function enregistrerTousLesHandlersIpc(db: PrismaClient): void {
  enregistrerHandlersReferentiels(db)
  enregistrerHandlersReceptions(db)
  enregistrerHandlersStock(db)
  enregistrerHandlersVentes(db)
  enregistrerHandlersFacturation(db)
}
