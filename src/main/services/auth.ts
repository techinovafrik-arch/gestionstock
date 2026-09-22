import type { PrismaClient } from '@prisma/client'
import type { ConnexionInput, ConnexionOutput } from '../../shared/types'
import { ErreurMetier } from './erreurs'
import { verifierMotDePasse } from './motDePasse'
import { fermerSession, ouvrirSession, utilisateurConnecteId } from '../session'

function versUtilisateurPublic<T extends { motDePasseHash: string }>(utilisateur: T) {
  const { motDePasseHash: _motDePasseHash, ...utilisateurPublic } = utilisateur
  return utilisateurPublic
}

export async function connexion(db: PrismaClient, input: ConnexionInput): Promise<ConnexionOutput> {
  const utilisateur = await db.utilisateur.findUnique({ where: { identifiant: input.identifiant } })

  if (
    !utilisateur ||
    !utilisateur.actif ||
    !verifierMotDePasse(input.motDePasse, utilisateur.motDePasseHash)
  ) {
    throw new ErreurMetier('IDENTIFIANTS_INVALIDES', 'Identifiant ou mot de passe incorrect.')
  }

  const token = ouvrirSession(utilisateur.id)
  return { utilisateur: versUtilisateurPublic(utilisateur), token }
}

export function deconnexion(): void {
  fermerSession()
}

export async function sessionCourante(db: PrismaClient) {
  const id = utilisateurConnecteId()
  if (!id) return null
  const utilisateur = await db.utilisateur.findUnique({ where: { id } })
  if (!utilisateur || !utilisateur.actif) return null
  return versUtilisateurPublic(utilisateur)
}
