import 'dotenv/config'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '@prisma/client'
import { hashMotDePasse } from '../src/main/services/motDePasse'

async function main(): Promise<void> {
  const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! })
  const prisma = new PrismaClient({ adapter })

  for (const nom of ['Koumassi', 'Port-Bouët', 'Marcory']) {
    await prisma.commune.upsert({ where: { nom }, update: {}, create: { nom } })
  }

  await prisma.fournisseur.upsert({
    where: { id: 'supernova' },
    update: {},
    create: { id: 'supernova', nom: 'Supernova' }
  })

  await prisma.utilisateur.upsert({
    where: { identifiant: 'admin' },
    update: {},
    create: {
      identifiant: 'admin',
      nom: 'Administrateur',
      motDePasseHash: hashMotDePasse('admin'),
      role: 'ADMINISTRATEUR'
    }
  })

  await prisma.$disconnect()
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
