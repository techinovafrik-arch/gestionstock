import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '@prisma/client'

// Base de test isolée : un fichier SQLite temporaire par suite, migré via les vraies
// migrations Prisma (pas de mock de la base — voir docs/BUSINESS_RULES.md, préambule).
export function creerBaseDeTest() {
  const dossier = mkdtempSync(path.join(tmpdir(), 'gestionstock-test-'))
  const cheminDb = path.join(dossier, `${randomUUID()}.db`)
  const url = `file:${cheminDb}`

  const racineProjet = path.resolve(__dirname, '../..')
  const prismaCli = path.join(racineProjet, 'node_modules/prisma/build/index.js')
  execFileSync(process.execPath, [prismaCli, 'migrate', 'deploy'], {
    cwd: racineProjet,
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'ignore'
  })

  const adapter = new PrismaBetterSqlite3({ url })
  const db = new PrismaClient({ adapter })

  return {
    db,
    async fermer(): Promise<void> {
      await db.$disconnect()
      rmSync(dossier, { recursive: true, force: true })
    }
  }
}

export async function creerFixturesDeBase(db: PrismaClient) {
  const fournisseur = await db.fournisseur.create({ data: { nom: 'Supernova' } })
  const commune = await db.commune.create({ data: { nom: 'Koumassi' } })
  const utilisateur = await db.utilisateur.create({
    data: {
      nom: 'Test',
      identifiant: `test-${randomUUID()}`,
      motDePasseHash: 'x',
      role: 'OPERATEUR'
    }
  })
  const client = await db.client.create({
    data: { nom: 'Établissement Test', typeClient: 'etablissement_scolaire', communeId: commune.id }
  })
  return { fournisseur, commune, utilisateur, client }
}
