import { useState, type JSX } from 'react'
import type { UtilisateurPublic } from '../../../shared/types'

interface LoginScreenProps {
  onConnecte: (utilisateur: UtilisateurPublic) => void
}

export function LoginScreen({ onConnecte }: LoginScreenProps): JSX.Element {
  const [identifiant, setIdentifiant] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)

  async function soumettre(evenement: React.FormEvent): Promise<void> {
    evenement.preventDefault()
    setErreur(null)

    const resultat = await window.api.auth.connexion({ identifiant, motDePasse })
    if (!resultat.ok) {
      setErreur(resultat.error.message)
      return
    }

    onConnecte(resultat.data.utilisateur)
  }

  return (
    <main>
      <h1>Gestion Stock &amp; Facturation — Distribution Supernova</h1>
      <section>
        <h2>Connexion</h2>
        <form onSubmit={soumettre}>
          <input
            placeholder="Identifiant"
            value={identifiant}
            onChange={(e) => setIdentifiant(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            required
          />
          <button type="submit">Se connecter</button>
        </form>
        {erreur && <p role="alert">{erreur}</p>}
      </section>
    </main>
  )
}
