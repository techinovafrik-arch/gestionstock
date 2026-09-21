import { ipcMain } from 'electron'
import type { PrismaClient } from '@prisma/client'
import type {
  CreerClientInput,
  CreerOuvrageInput,
  ListerClientsInput,
  ListerOuvragesInput,
  ModifierOuvrageInput
} from '../../shared/types'
import {
  creerClient,
  listerClients,
  listerCommunes,
  listerUtilisateurs
} from '../services/referentiels'
import { creerOuvrage, listerOuvrages, modifierOuvrage } from '../services/ouvrages'
import { versResultat } from './resultat'

export function enregistrerHandlersReferentiels(db: PrismaClient): void {
  ipcMain.handle('referentiels:listerOuvrages', (_event, input: ListerOuvragesInput) =>
    versResultat(() => listerOuvrages(db, input))
  )
  ipcMain.handle('referentiels:creerOuvrage', (_event, input: CreerOuvrageInput) =>
    versResultat(() => creerOuvrage(db, input))
  )
  ipcMain.handle('referentiels:modifierOuvrage', (_event, input: ModifierOuvrageInput) =>
    versResultat(() => modifierOuvrage(db, input))
  )
  ipcMain.handle('referentiels:listerCommunes', () => versResultat(() => listerCommunes(db)))
  ipcMain.handle('referentiels:listerClients', (_event, input: ListerClientsInput) =>
    versResultat(() => listerClients(db, input))
  )
  ipcMain.handle('referentiels:creerClient', (_event, input: CreerClientInput) =>
    versResultat(() => creerClient(db, input))
  )
  ipcMain.handle('referentiels:listerUtilisateurs', () =>
    versResultat(() => listerUtilisateurs(db))
  )
}
