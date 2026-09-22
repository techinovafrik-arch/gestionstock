import { app, BrowserWindow } from 'electron'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import path from 'node:path'

// Gabarits HTML/CSS → PDF via le moteur d'impression d'Electron (docs/ARCHITECTURE.md §1) —
// pas de dépendance externe (Puppeteer, etc.) pour cette conversion.
// Le HTML est écrit dans un fichier temporaire puis chargé via loadFile() : les data: URL
// (loadURL) se sont montrées instables sur des documents un peu longs (ERR_FAILED constaté).
// La fenêtre n'est PAS offscreen: `offscreen: true` combiné à printToPDF s'est montré
// instable (échec silencieux du processus) lors des tests — une fenêtre simplement cachée
// (`show: false`) est le pattern fiable pour cet usage.
export async function genererPdfDepuisHtml(html: string, nomFichier: string): Promise<string> {
  const dossierDocuments = path.join(app.getPath('userData'), 'documents')
  await mkdir(dossierDocuments, { recursive: true })
  const cheminPdf = path.join(dossierDocuments, nomFichier)

  const dossierTemp = path.join(app.getPath('temp'), 'gestionstock-pdf')
  await mkdir(dossierTemp, { recursive: true })
  const cheminHtmlTemp = path.join(dossierTemp, `${randomUUID()}.html`)
  await writeFile(cheminHtmlTemp, html, 'utf-8')

  const fenetre = new BrowserWindow({ show: false })
  try {
    await fenetre.loadFile(cheminHtmlTemp)
    const buffer = await fenetre.webContents.printToPDF({ printBackground: true, pageSize: 'A4' })
    await writeFile(cheminPdf, buffer)
  } finally {
    fenetre.destroy()
    await rm(cheminHtmlTemp, { force: true })
  }

  return cheminPdf
}
