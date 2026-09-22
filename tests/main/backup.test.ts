import { mkdtempSync, readFileSync, readdirSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  cheminFichierDepuisDatabaseUrl,
  listerSauvegardes,
  restaurerDepuisFichier,
  sauvegarderMaintenant
} from '../../src/main/backup'

describe('backup — sauvegarde et restauration (RG-14)', () => {
  let dossierTemp: string
  let cheminDb: string
  let dossierSauvegardes: string

  beforeEach(() => {
    dossierTemp = mkdtempSync(path.join(tmpdir(), 'gestionstock-backup-'))
    cheminDb = path.join(dossierTemp, 'dev.db')
    dossierSauvegardes = path.join(dossierTemp, 'backups')
    writeFileSync(cheminDb, 'contenu-initial-de-la-base')
  })

  afterEach(() => {
    // Les fichiers temporaires sont laissés à la charge du système (répertoire tmp), voir testDb.ts.
  })

  it('extrait le chemin de fichier depuis une DATABASE_URL au format file:', () => {
    expect(cheminFichierDepuisDatabaseUrl('file:./dev.db')).toBe('./dev.db')
    expect(cheminFichierDepuisDatabaseUrl('file:/absolu/dev.db')).toBe('/absolu/dev.db')
  })

  it('copie le fichier de base vers le dossier de sauvegardes', async () => {
    const resultat = await sauvegarderMaintenant(cheminDb, dossierSauvegardes)

    expect(readFileSync(resultat.cheminSauvegarde, 'utf-8')).toBe('contenu-initial-de-la-base')
    const sauvegardes = await listerSauvegardes(dossierSauvegardes)
    expect(sauvegardes).toHaveLength(1)
  })

  it('purge les sauvegardes de plus de 15 jours', async () => {
    await sauvegarderMaintenant(cheminDb, dossierSauvegardes)
    const [ancienFichier] = readdirSync(dossierSauvegardes)
    const dateAncienne = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
    utimesSync(path.join(dossierSauvegardes, ancienFichier!), dateAncienne, dateAncienne)

    // Une nouvelle sauvegarde déclenche la purge de l'ancienne.
    await sauvegarderMaintenant(cheminDb, dossierSauvegardes)

    const sauvegardes = await listerSauvegardes(dossierSauvegardes)
    expect(sauvegardes).toHaveLength(1)
  })

  it('restaure le contenu du fichier de sauvegarde vers la base', async () => {
    const { cheminSauvegarde } = await sauvegarderMaintenant(cheminDb, dossierSauvegardes)
    writeFileSync(cheminDb, 'contenu-modifie-apres-la-sauvegarde')

    await restaurerDepuisFichier(cheminSauvegarde, cheminDb)

    expect(readFileSync(cheminDb, 'utf-8')).toBe('contenu-initial-de-la-base')
  })

  it('rejette la restauration si le fichier de sauvegarde est introuvable', async () => {
    await expect(
      restaurerDepuisFichier(path.join(dossierSauvegardes, 'inexistant.db'), cheminDb)
    ).rejects.toThrow()
  })
})
