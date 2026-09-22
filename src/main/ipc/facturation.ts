import { ipcMain } from 'electron'
import type { PrismaClient } from '@prisma/client'
import type { CreerFactureInput, ListerFacturesInput } from '../../shared/types'
import { creerFacture, listerFactures, obtenirFacturePourImpression } from '../services/facturation'
import { gabaritFacture } from '../documents/templates/facture'
import { genererPdfDepuisHtml } from '../documents/genererPdf'
import { versResultat } from './resultat'

export function enregistrerHandlersFacturation(db: PrismaClient): void {
  ipcMain.handle('facturation:creer', (_event, input: CreerFactureInput) =>
    versResultat(() => creerFacture(db, input))
  )
  ipcMain.handle('facturation:lister', (_event, input: ListerFacturesInput) =>
    versResultat(() => listerFactures(db, input))
  )
  ipcMain.handle('facturation:imprimer', (_event, input: { id: string }) =>
    versResultat(async () => {
      const facture = await obtenirFacturePourImpression(db, input.id)
      const cheminPdf = await genererPdfDepuisHtml(
        gabaritFacture(facture),
        `${facture.numeroFacture}.pdf`
      )
      return { cheminPdf }
    })
  )
}
