import { useEffect, useState, type JSX } from 'react'
import type { JournalAudit, RoleUtilisateur, UtilisateurPublic } from '../../../shared/types'

export function AdministrationScreen(): JSX.Element {
  const [utilisateurs, setUtilisateurs] = useState<UtilisateurPublic[]>([])
  const [nom, setNom] = useState('')
  const [identifiant, setIdentifiant] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [role, setRole] = useState<RoleUtilisateur>('OPERATEUR')
  const [sauvegardes, setSauvegardes] = useState<string[]>([])
  const [sauvegardeSelectionnee, setSauvegardeSelectionnee] = useState('')
  const [journal, setJournal] = useState<JournalAudit[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  async function rafraichirSauvegardes(): Promise<void> {
    const resultat = await window.api.administration.listerSauvegardes()
    if (resultat.ok) {
      setSauvegardes(resultat.data)
      if (resultat.data[0]) setSauvegardeSelectionnee(resultat.data[0])
    }
  }

  useEffect(() => {
    window.api.referentiels.listerUtilisateurs().then((resultat) => {
      if (resultat.ok) setUtilisateurs(resultat.data)
    })
    window.api.administration.listerSauvegardes().then((resultat) => {
      if (resultat.ok) {
        setSauvegardes(resultat.data)
        if (resultat.data[0]) setSauvegardeSelectionnee(resultat.data[0])
      }
    })
    window.api.administration.journalAudit().then((resultat) => {
      if (resultat.ok) setJournal(resultat.data)
    })
  }, [])

  async function creerUtilisateur(evenement: React.FormEvent): Promise<void> {
    evenement.preventDefault()
    setErreur(null)
    setMessage(null)

    const resultat = await window.api.administration.creerUtilisateur({
      nom,
      identifiant,
      motDePasse,
      role
    })
    if (!resultat.ok) {
      setErreur(resultat.error.message)
      return
    }

    setUtilisateurs((precedent) => [...precedent, resultat.data])
    setNom('')
    setIdentifiant('')
    setMotDePasse('')
    setMessage(`Utilisateur ${resultat.data.identifiant} créé.`)
  }

  async function sauvegarderMaintenant(): Promise<void> {
    setErreur(null)
    setMessage(null)
    const resultat = await window.api.administration.sauvegarderMaintenant()
    if (!resultat.ok) {
      setErreur(resultat.error.message)
      return
    }
    setMessage(`Sauvegarde créée : ${resultat.data.cheminSauvegarde}`)
    await rafraichirSauvegardes()
  }

  async function restaurer(): Promise<void> {
    if (!sauvegardeSelectionnee) return
    setErreur(null)
    const resultat = await window.api.administration.restaurer({
      cheminSauvegarde: sauvegardeSelectionnee
    })
    if (!resultat.ok) {
      setErreur(resultat.error.message)
      return
    }
    setMessage('Restauration effectuée — redémarrage de l’application…')
  }

  return (
    <section>
      <h2>Administration</h2>

      <h3>Comptes utilisateurs</h3>
      <table>
        <thead>
          <tr>
            <th>Identifiant</th>
            <th>Nom</th>
            <th>Rôle</th>
            <th>Actif</th>
          </tr>
        </thead>
        <tbody>
          {utilisateurs.map((utilisateur) => (
            <tr key={utilisateur.id}>
              <td>{utilisateur.identifiant}</td>
              <td>{utilisateur.nom}</td>
              <td>{utilisateur.role}</td>
              <td>{utilisateur.actif ? 'Oui' : 'Non'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h4>Créer un compte (réservé aux administrateurs)</h4>
      <form onSubmit={creerUtilisateur}>
        <input placeholder="Nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
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
        <select value={role} onChange={(e) => setRole(e.target.value as RoleUtilisateur)}>
          <option value="OPERATEUR">Opérateur</option>
          <option value="ADMINISTRATEUR">Administrateur</option>
        </select>
        <button type="submit">Créer</button>
      </form>

      <h3>Sauvegarde &amp; restauration</h3>
      <button type="button" onClick={sauvegarderMaintenant}>
        Sauvegarder maintenant
      </button>
      <div>
        <select
          value={sauvegardeSelectionnee}
          onChange={(e) => setSauvegardeSelectionnee(e.target.value)}
        >
          {sauvegardes.map((chemin) => (
            <option key={chemin} value={chemin}>
              {chemin}
            </option>
          ))}
        </select>
        <button type="button" disabled={!sauvegardeSelectionnee} onClick={restaurer}>
          Restaurer cette sauvegarde
        </button>
      </div>

      {message && <p>{message}</p>}
      {erreur && <p role="alert">{erreur}</p>}

      <h3>Journal d'audit</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Action</th>
            <th>Cible</th>
            <th>Détail</th>
          </tr>
        </thead>
        <tbody>
          {journal.map((entree) => (
            <tr key={entree.id}>
              <td>{new Date(entree.dateAction).toLocaleString('fr-FR')}</td>
              <td>{entree.action}</td>
              <td>{entree.cible}</td>
              <td>{entree.detail ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
