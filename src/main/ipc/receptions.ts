import { ipcMain } from 'electron'
import type { PrismaClient } from '@prisma/client'
import type { CreerReceptionInput } from '../../shared/types'
import { enregistrerReception } from '../services/stock'
import { getCurrentUserId } from '../session'
import { versResultat } from './resultat'

export function enregistrerHandlersReceptions(db: PrismaClient): void {
  ipcMain.handle('receptions:creer', (_event, input: CreerReceptionInput) =>
    versResultat(async () => {
      const utilisateurId = await getCurrentUserId(db)
      return enregistrerReception(db, utilisateurId, input)
    })
  )
}
