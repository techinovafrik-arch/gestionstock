import { ipcMain } from 'electron'
import type { PrismaClient } from '@prisma/client'
import type { CreerReceptionInput } from '../../shared/types'
import { enregistrerReception } from '../services/stock'
import { utilisateurCourantIdObligatoire } from '../session'
import { versResultat } from './resultat'

export function enregistrerHandlersReceptions(db: PrismaClient): void {
  ipcMain.handle('receptions:creer', (_event, input: CreerReceptionInput) =>
    versResultat(() => enregistrerReception(db, utilisateurCourantIdObligatoire(), input))
  )
}
