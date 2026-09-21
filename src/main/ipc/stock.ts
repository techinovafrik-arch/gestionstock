import { ipcMain } from 'electron'
import type { PrismaClient } from '@prisma/client'
import type {
  AjusterStockInput,
  ConsulterStockInput,
  HistoriqueStockInput
} from '../../shared/types'
import { ajusterStock, consulterStock, historiqueMouvements } from '../services/stock'
import { getCurrentUserId } from '../session'
import { versResultat } from './resultat'

export function enregistrerHandlersStock(db: PrismaClient): void {
  ipcMain.handle('stock:consulter', (_event, input: ConsulterStockInput) =>
    versResultat(() => consulterStock(db, input))
  )
  ipcMain.handle('stock:historique', (_event, input: HistoriqueStockInput) =>
    versResultat(() => historiqueMouvements(db, input))
  )
  ipcMain.handle('stock:ajuster', (_event, input: AjusterStockInput) =>
    versResultat(async () => {
      const utilisateurId = await getCurrentUserId(db)
      return ajusterStock(db, utilisateurId, input)
    })
  )
}
