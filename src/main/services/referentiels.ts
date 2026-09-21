import type { PrismaClient } from '@prisma/client'
import type { CreerClientInput, ListerClientsInput } from '../../shared/types'

export async function listerCommunes(db: PrismaClient) {
  return db.commune.findMany({ orderBy: { nom: 'asc' } })
}

export async function listerClients(db: PrismaClient, input: ListerClientsInput = {}) {
  return db.client.findMany({
    where: {
      communeId: input.communeId,
      nom: input.recherche ? { contains: input.recherche } : undefined
    },
    orderBy: { nom: 'asc' }
  })
}

export async function creerClient(db: PrismaClient, input: CreerClientInput) {
  return db.client.create({
    data: {
      nom: input.nom,
      typeClient: input.typeClient,
      communeId: input.communeId,
      telephone: input.telephone,
      adresse: input.adresse
    }
  })
}

export async function listerUtilisateurs(db: PrismaClient) {
  const utilisateurs = await db.utilisateur.findMany({ orderBy: { nom: 'asc' } })
  return utilisateurs.map(({ motDePasseHash: _motDePasseHash, ...utilisateur }) => utilisateur)
}
