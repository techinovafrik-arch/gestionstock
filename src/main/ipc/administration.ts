import { app, ipcMain } from 'electron'
import type { PrismaClient } from '@prisma/client'
import path from 'node:path'
import type {
  CreerUtilisateurInput,
  ListerJournalAuditInput,
  RestaurerInput
} from '../../shared/types'
import { creerUtilisateur } from '../services/administration'
import { listerJournalAudit } from '../services/journalAudit'
import {
  cheminFichierDepuisDatabaseUrl,
  listerSauvegardes,
  restaurerDepuisFichier,
  sauvegarderMaintenant
} from '../backup'
import { utilisateurCourantIdObligatoire } from '../session'
import { versResultat } from './resultat'

function dossierSauvegardes(): string {
  return path.join(app.getPath('userData'), 'backups')
}

export function enregistrerHandlersAdministration(db: PrismaClient): void {
  ipcMain.handle('administration:creerUtilisateur', (_event, input: CreerUtilisateurInput) =>
    versResultat(() => creerUtilisateur(db, utilisateurCourantIdObligatoire(), input))
  )
  ipcMain.handle('administration:sauvegarderMaintenant', () =>
    versResultat(() =>
      sauvegarderMaintenant(
        cheminFichierDepuisDatabaseUrl(process.env.DATABASE_URL!),
        dossierSauvegardes()
      )
    )
  )
  ipcMain.handle('administration:listerSauvegardes', () =>
    versResultat(() => listerSauvegardes(dossierSauvegardes()))
  )
  ipcMain.handle('administration:restaurer', (_event, input: RestaurerInput) =>
    versResultat(async () => {
      await db.$disconnect()
      await restaurerDepuisFichier(
        input.cheminSauvegarde,
        cheminFichierDepuisDatabaseUrl(process.env.DATABASE_URL!)
      )
      // La restauration remplace le fichier sous la connexion Prisma active : on relance
      // l'application pour repartir sur une connexion fraîche plutôt que de risquer un état
      // incohérent en mémoire.
      app.relaunch()
      app.exit(0)
      return { ok: true as const }
    })
  )
  ipcMain.handle('administration:journalAudit', (_event, input: ListerJournalAuditInput) =>
    versResultat(() => listerJournalAudit(db, input))
  )
}
