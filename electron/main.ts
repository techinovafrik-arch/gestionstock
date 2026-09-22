import { app, BrowserWindow } from 'electron'
import path from 'node:path'
import { prisma } from '../src/main/data/prisma'
import { enregistrerTousLesHandlersIpc } from '../src/main/ipc'
import { cheminFichierDepuisDatabaseUrl, sauvegarderMaintenant } from '../src/main/backup'

const VINGT_QUATRE_HEURES_MS = 24 * 60 * 60 * 1000

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

// Sauvegarde automatique (docs/ARCHITECTURE.md §5) : une fois au démarrage, puis toutes les
// 24h tant que l'application tourne — asynchrone, ne bloque jamais l'interface.
function demarrerSauvegardeAutomatique(): void {
  const cheminDb = cheminFichierDepuisDatabaseUrl(process.env.DATABASE_URL!)
  const dossierSauvegardes = path.join(app.getPath('userData'), 'backups')
  const lancerSauvegarde = (): void => {
    sauvegarderMaintenant(cheminDb, dossierSauvegardes).catch((error: unknown) => {
      console.error('Échec de la sauvegarde automatique :', error)
    })
  }
  lancerSauvegarde()
  setInterval(lancerSauvegarde, VINGT_QUATRE_HEURES_MS).unref()
}

app.whenReady().then(() => {
  enregistrerTousLesHandlersIpc(prisma)
  demarrerSauvegardeAutomatique()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
