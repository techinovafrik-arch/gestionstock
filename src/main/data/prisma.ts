import 'dotenv/config'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '@prisma/client'

// Prisma 7 exige un driver adapter (plus de moteur Rust intégré) — voir .claude/memory.md.
const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! })

export const prisma = new PrismaClient({ adapter })
