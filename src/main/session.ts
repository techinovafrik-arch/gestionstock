import type { PrismaClient } from '@prisma/client'

// Provisoire : pas d'écran d'authentification avant la Phase 4 (module Administration).
// Les mouvements de stock doivent malgré tout être attribués à un utilisateur réel (RG-05) ;
// on utilise le compte admin seedé (voir prisma/seed.ts et .claude/memory.md) en attendant.
export async function getCurrentUserId(db: PrismaClient): Promise<string> {
  const admin = await db.utilisateur.findUniqueOrThrow({ where: { identifiant: 'admin' } })
  return admin.id
}
