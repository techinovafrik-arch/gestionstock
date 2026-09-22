import { ipcMain } from 'electron'
import type { PrismaClient } from '@prisma/client'
import type { EnregistrerVersementInput, GenererEtatReversementInput } from '../../shared/types'
import {
  enregistrerVersement,
  genererEtatReversement,
  listerReversements
} from '../services/reversement'
import { versResultat } from './resultat'

export function enregistrerHandlersReversement(db: PrismaClient): void {
  ipcMain.handle('reversement:genererEtat', (_event, input: GenererEtatReversementInput) =>
    versResultat(() => genererEtatReversement(db, input))
  )
  ipcMain.handle('reversement:enregistrerVersement', (_event, input: EnregistrerVersementInput) =>
    versResultat(() => enregistrerVersement(db, input))
  )
  ipcMain.handle('reversement:lister', () => versResultat(() => listerReversements(db)))
}
