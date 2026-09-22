import { ipcMain } from 'electron'
import type { PrismaClient } from '@prisma/client'
import type { ConnexionInput } from '../../shared/types'
import { connexion, deconnexion, sessionCourante } from '../services/auth'
import { versResultat } from './resultat'

export function enregistrerHandlersAuth(db: PrismaClient): void {
  ipcMain.handle('auth:connexion', (_event, input: ConnexionInput) =>
    versResultat(() => connexion(db, input))
  )
  ipcMain.handle('auth:deconnexion', () =>
    versResultat(() => {
      deconnexion()
      return Promise.resolve({ ok: true as const })
    })
  )
  ipcMain.handle('auth:sessionCourante', () => versResultat(() => sessionCourante(db)))
}
