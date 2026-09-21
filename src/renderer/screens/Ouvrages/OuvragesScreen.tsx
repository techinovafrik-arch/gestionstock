import { useEffect, useState, type JSX } from 'react'
import type { Fournisseur, Ouvrage } from '../../../shared/types'

export function OuvragesScreen(): JSX.Element {
  const [ouvrages, setOuvrages] = useState<Ouvrage[]>([])
  const [fournisseur, setFournisseur] = useState<Fournisseur | null>(null)
  const [titre, setTitre] = useState('')
  const [prixAchat, setPrixAchat] = useState('')
  const [prixVente, setPrixVente] = useState('')
  const [seuilAlerte, setSeuilAlerte] = useState('0')
  const [erreur, setErreur] = useState<string | null>(null)

  async function rafraichir(): Promise<void> {
    const resultat = await window.api.referentiels.listerOuvrages()
    if (resultat.ok) setOuvrages(resultat.data)
  }

  useEffect(() => {
    window.api.referentiels.listerFournisseurs().then((resultat) => {
      if (resultat.ok && resultat.data[0]) setFournisseur(resultat.data[0])
    })
    window.api.referentiels.listerOuvrages().then((resultat) => {
      if (resultat.ok) setOuvrages(resultat.data)
    })
  }, [])

  async function soumettre(evenement: React.FormEvent): Promise<void> {
    evenement.preventDefault()
    setErreur(null)

    if (!fournisseur) {
      setErreur('Fournisseur Supernova introuvable — vérifier le seed de la base.')
      return
    }

    const resultat = await window.api.referentiels.creerOuvrage({
      titre,
      prixAchat: Number(prixAchat),
      prixVente: Number(prixVente),
      seuilAlerte: Number(seuilAlerte),
      fournisseurId: fournisseur.id
    })

    if (!resultat.ok) {
      setErreur(resultat.error.message)
      return
    }

    setTitre('')
    setPrixAchat('')
    setPrixVente('')
    setSeuilAlerte('0')
    await rafraichir()
  }

  return (
    <section>
      <h2>Catalogue des ouvrages</h2>

      <form onSubmit={soumettre}>
        <input
          placeholder="Titre"
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Prix d'achat (FCFA)"
          value={prixAchat}
          onChange={(e) => setPrixAchat(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Prix de vente (FCFA)"
          value={prixVente}
          onChange={(e) => setPrixVente(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Seuil d'alerte"
          value={seuilAlerte}
          onChange={(e) => setSeuilAlerte(e.target.value)}
        />
        <button type="submit">Ajouter l'ouvrage</button>
      </form>

      {erreur && <p role="alert">{erreur}</p>}

      <table>
        <thead>
          <tr>
            <th>Titre</th>
            <th>Prix d'achat</th>
            <th>Prix de vente</th>
            <th>Stock disponible</th>
            <th>Seuil d'alerte</th>
          </tr>
        </thead>
        <tbody>
          {ouvrages.map((ouvrage) => (
            <tr key={ouvrage.id}>
              <td>{ouvrage.titre}</td>
              <td>{ouvrage.prixAchat}</td>
              <td>{ouvrage.prixVente}</td>
              <td>{ouvrage.quantiteDisponible}</td>
              <td>{ouvrage.seuilAlerte}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
