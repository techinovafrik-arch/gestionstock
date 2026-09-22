import { randomUUID } from 'node:crypto'
import { ErreurMetier } from './services/erreurs'

// Session unique en mémoire (processus main) — application mono-poste, une seule fenêtre à la
// fois. Le "token" existe pour respecter le contrat documenté (docs/API_CONTRACT.md, auth:*) ;
// la sécurité réelle repose sur l'isolation du processus main, pas sur ce jeton.
interface Session {
  utilisateurId: string
  token: string
}

let sessionActuelle: Session | null = null

export function ouvrirSession(utilisateurId: string): string {
  const token = randomUUID()
  sessionActuelle = { utilisateurId, token }
  return token
}

export function fermerSession(): void {
  sessionActuelle = null
}

export function utilisateurConnecteId(): string | null {
  return sessionActuelle?.utilisateurId ?? null
}

// À utiliser par tout service exigeant un utilisateur tracé (RG-05) : lève une erreur métier
// explicite plutôt que de laisser passer un utilisateurId manquant.
export function utilisateurCourantIdObligatoire(): string {
  if (!sessionActuelle) {
    throw new ErreurMetier('NON_AUTHENTIFIE', 'Aucune session active — veuillez vous connecter.')
  }
  return sessionActuelle.utilisateurId
}
