import type { PrismaClient } from '@prisma/client'
import type { CreerUtilisateurInput } from '../../shared/types'
import { ErreurMetier } from './erreurs'
import { hashMotDePasse } from './motDePasse'

export async function creerUtilisateur(
  db: PrismaClient,
  demandeurId: string,
  input: CreerUtilisateurInput
) {
  const demandeur = await db.utilisateur.findUniqueOrThrow({ where: { id: demandeurId } })
  if (demandeur.role !== 'ADMINISTRATEUR') {
    throw new ErreurMetier(
      'ACCES_REFUSE',
      'Seul un administrateur peut créer un compte utilisateur.'
    )
  }
  if (input.motDePasse.length < 4) {
    throw new ErreurMetier(
      'MOT_DE_PASSE_FAIBLE',
      'Le mot de passe doit comporter au moins 4 caractères.'
    )
  }

  const { motDePasseHash: _motDePasseHash, ...utilisateur } = await db.utilisateur.create({
    data: {
      nom: input.nom,
      identifiant: input.identifiant,
      motDePasseHash: hashMotDePasse(input.motDePasse),
      role: input.role
    }
  })
  return utilisateur
}
