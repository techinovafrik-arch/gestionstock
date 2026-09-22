import type { PrismaClient } from '@prisma/client'
import { enregistrerHandlersReferentiels } from './referentiels'
import { enregistrerHandlersReceptions } from './receptions'
import { enregistrerHandlersStock } from './stock'
import { enregistrerHandlersVentes } from './ventes'
import { enregistrerHandlersFacturation } from './facturation'
import { enregistrerHandlersReglements } from './reglements'
import { enregistrerHandlersReversement } from './reversement'
import { enregistrerHandlersAuth } from './auth'
import { enregistrerHandlersAdministration } from './administration'

export function enregistrerTousLesHandlersIpc(db: PrismaClient): void {
  enregistrerHandlersReferentiels(db)
  enregistrerHandlersReceptions(db)
  enregistrerHandlersStock(db)
  enregistrerHandlersVentes(db)
  enregistrerHandlersFacturation(db)
  enregistrerHandlersReglements(db)
  enregistrerHandlersReversement(db)
  enregistrerHandlersAuth(db)
  enregistrerHandlersAdministration(db)
}
