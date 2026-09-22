import { app, ipcMain } from 'electron'
import type { PrismaClient } from '@prisma/client'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type {
  ExporterRapportInput,
  RapportMargeInput,
  RapportVentesInput
} from '../../shared/types'
import { rapportMarge, rapportVentes } from '../services/rapports'
import { listerCreances } from '../services/reglements'
import { versCsv } from '../documents/csv'
import { gabaritTableauRapport } from '../documents/templates/tableauRapport'
import { genererPdfDepuisHtml } from '../documents/genererPdf'
import { ErreurMetier } from '../services/erreurs'
import { versResultat } from './resultat'

const NOMS_RAPPORT: Record<ExporterRapportInput['type'], string> = {
  ventes: 'Rapport des ventes',
  marge: 'Rapport de marge',
  creances: 'État des créances'
}

async function obtenirLignesRapport(
  db: PrismaClient,
  input: ExporterRapportInput
): Promise<Record<string, string | number>[]> {
  if (input.type === 'creances') {
    const creances = await listerCreances(db)
    return creances.map((c) => ({
      client: c.nom,
      montantDu: c.montantDu,
      ancienneteJours: c.ancienneteJours
    }))
  }

  if (!input.periodeDebut || !input.periodeFin) {
    throw new ErreurMetier(
      'PERIODE_REQUISE',
      'Une période (début/fin) est requise pour ce rapport.'
    )
  }

  if (input.type === 'ventes') {
    const lignes = await rapportVentes(db, {
      periodeDebut: input.periodeDebut,
      periodeFin: input.periodeFin,
      groupePar: 'ouvrage'
    })
    return lignes.map((l) => ({ ouvrage: l.cle, quantite: l.quantite, montant: l.montant }))
  }

  const lignes = await rapportMarge(db, {
    periodeDebut: input.periodeDebut,
    periodeFin: input.periodeFin
  })
  return lignes.map((l) => ({
    ouvrage: l.titre,
    quantiteVendue: l.quantiteVendue,
    margeUnitaire: l.margeUnitaire,
    margeTotale: l.margeTotale
  }))
}

export function enregistrerHandlersRapports(db: PrismaClient): void {
  ipcMain.handle('rapports:ventes', (_event, input: RapportVentesInput) =>
    versResultat(() => rapportVentes(db, input))
  )
  ipcMain.handle('rapports:marge', (_event, input: RapportMargeInput) =>
    versResultat(() => rapportMarge(db, input))
  )
  ipcMain.handle('rapports:exporter', (_event, input: ExporterRapportInput) =>
    versResultat(async () => {
      const lignes = await obtenirLignesRapport(db, input)
      const dossierExports = path.join(app.getPath('userData'), 'exports')
      await mkdir(dossierExports, { recursive: true })
      const horodatage = new Date().toISOString().replace(/[:.]/g, '-')

      if (input.format === 'csv') {
        const cheminFichier = path.join(dossierExports, `${input.type}-${horodatage}.csv`)
        await writeFile(cheminFichier, versCsv(lignes), 'utf-8')
        return { cheminFichier }
      }

      const cheminFichier = await genererPdfDepuisHtml(
        gabaritTableauRapport(NOMS_RAPPORT[input.type], lignes),
        `${input.type}-${horodatage}.pdf`
      )
      return { cheminFichier }
    })
  )
}
