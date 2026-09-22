import { access, copyFile, mkdir, readdir, stat, unlink } from 'node:fs/promises'
import path from 'node:path'

const RETENTION_JOURS = 15

export function cheminFichierDepuisDatabaseUrl(databaseUrl: string): string {
  return databaseUrl.startsWith('file:') ? databaseUrl.slice('file:'.length) : databaseUrl
}

// Sauvegarde manuelle ou automatique (docs/ARCHITECTURE.md §5) : simple copie du fichier SQLite,
// asynchrone et non bloquante pour l'utilisateur. Rétention glissante de 15 jours.
export async function sauvegarderMaintenant(
  cheminDb: string,
  dossierSauvegardes: string
): Promise<{ cheminSauvegarde: string; dateSauvegarde: string }> {
  await mkdir(dossierSauvegardes, { recursive: true })
  const dateSauvegarde = new Date()
  const nomFichier = `gestion-stock-${dateSauvegarde.toISOString().replace(/[:.]/g, '-')}.db`
  const cheminSauvegarde = path.join(dossierSauvegardes, nomFichier)

  await copyFile(cheminDb, cheminSauvegarde)
  await purgerAnciennesSauvegardes(dossierSauvegardes)

  return { cheminSauvegarde, dateSauvegarde: dateSauvegarde.toISOString() }
}

async function purgerAnciennesSauvegardes(dossierSauvegardes: string): Promise<void> {
  const limite = Date.now() - RETENTION_JOURS * 24 * 60 * 60 * 1000
  const fichiers = await readdir(dossierSauvegardes)
  for (const fichier of fichiers) {
    const cheminFichier = path.join(dossierSauvegardes, fichier)
    const infos = await stat(cheminFichier)
    if (infos.mtimeMs < limite) await unlink(cheminFichier)
  }
}

// Retourne les chemins complets, triés du plus récent au plus ancien.
export async function listerSauvegardes(dossierSauvegardes: string): Promise<string[]> {
  await mkdir(dossierSauvegardes, { recursive: true })
  const fichiers = await readdir(dossierSauvegardes)
  return fichiers
    .filter((f) => f.endsWith('.db'))
    .sort()
    .reverse()
    .map((f) => path.join(dossierSauvegardes, f))
}

// La restauration proprement dite (arrêt de la connexion Prisma, redémarrage de l'app) est
// orchestrée par src/main/ipc/administration.ts — cette fonction ne fait que la copie de
// fichier, validée et testable indépendamment d'Electron.
export async function restaurerDepuisFichier(
  cheminSauvegarde: string,
  cheminDb: string
): Promise<void> {
  await access(cheminSauvegarde)
  await copyFile(cheminSauvegarde, cheminDb)
}
