import { ipcMain } from 'electron'
import type { PrismaClient } from '@prisma/client'
import type { EnregistrerReglementInput, ListerCreancesInput } from '../../shared/types'
import { enregistrerReglement, listerCreances } from '../services/reglements'
import { versResultat } from './resultat'

export function enregistrerHandlersReglements(db: PrismaClient): void {
  ipcMain.handle('reglements:enregistrer', (_event, input: EnregistrerReglementInput) =>
    versResultat(() => enregistrerReglement(db, input))
  )
  ipcMain.handle('reglements:creances', (_event, input: ListerCreancesInput) =>
    versResultat(() => listerCreances(db, input))
  )
}
