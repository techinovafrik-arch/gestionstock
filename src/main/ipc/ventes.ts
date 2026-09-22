import { ipcMain } from 'electron'
import type { PrismaClient } from '@prisma/client'
import type {
  AnnulerBonLivraisonInput,
  CreerBonLivraisonInput,
  ListerBonsLivraisonInput
} from '../../shared/types'
import {
  annulerBonLivraison,
  creerBonLivraison,
  listerBonsLivraison,
  marquerLivre,
  obtenirBonLivraisonPourImpression
} from '../services/ventes'
import { gabaritBonLivraison } from '../documents/templates/bonLivraison'
import { genererPdfDepuisHtml } from '../documents/genererPdf'
import { utilisateurCourantIdObligatoire } from '../session'
import { versResultat } from './resultat'

export function enregistrerHandlersVentes(db: PrismaClient): void {
  ipcMain.handle('ventes:creerBonLivraison', (_event, input: CreerBonLivraisonInput) =>
    versResultat(() => creerBonLivraison(db, utilisateurCourantIdObligatoire(), input))
  )
  ipcMain.handle('ventes:listerBonsLivraison', (_event, input: ListerBonsLivraisonInput) =>
    versResultat(() => listerBonsLivraison(db, input))
  )
  ipcMain.handle('ventes:marquerLivre', (_event, input: { id: string }) =>
    versResultat(() => marquerLivre(db, input.id))
  )
  ipcMain.handle('ventes:annulerBonLivraison', (_event, input: AnnulerBonLivraisonInput) =>
    versResultat(() => annulerBonLivraison(db, utilisateurCourantIdObligatoire(), input))
  )
  ipcMain.handle('ventes:imprimerBonLivraison', (_event, input: { id: string }) =>
    versResultat(async () => {
      const bonLivraison = await obtenirBonLivraisonPourImpression(db, input.id)
      const cheminPdf = await genererPdfDepuisHtml(
        gabaritBonLivraison(bonLivraison),
        `${bonLivraison.numeroBL}.pdf`
      )
      return { cheminPdf }
    })
  )
}
