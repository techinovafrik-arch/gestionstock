import { useEffect, useState, type JSX } from 'react'
import type { MouvementStock, StockLigne } from '../../../shared/types'

export function StockScreen(): JSX.Element {
  const [lignes, setLignes] = useState<StockLigne[]>([])
  const [historique, setHistorique] = useState<MouvementStock[]>([])
  const [ouvrageSelectionne, setOuvrageSelectionne] = useState('')
  const [quantite, setQuantite] = useState('')
  const [sens, setSens] = useState<'PLUS' | 'MOINS'>('PLUS')
  const [motif, setMotif] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)

  async function rafraichirStock(): Promise<void> {
    const resultat = await window.api.stock.consulter()
    if (resultat.ok) {
      setLignes(resultat.data)
      if (!ouvrageSelectionne && resultat.data[0]) setOuvrageSelectionne(resultat.data[0].ouvrageId)
    }
  }

  async function rafraichirHistorique(): Promise<void> {
    const resultat = await window.api.stock.historique()
    if (resultat.ok) setHistorique(resultat.data)
  }

  useEffect(() => {
    window.api.stock.consulter().then((resultat) => {
      if (resultat.ok) {
        setLignes(resultat.data)
        if (resultat.data[0]) setOuvrageSelectionne(resultat.data[0].ouvrageId)
      }
    })
    window.api.stock.historique().then((resultat) => {
      if (resultat.ok) setHistorique(resultat.data)
    })
  }, [])

  async function soumettreAjustement(evenement: React.FormEvent): Promise<void> {
    evenement.preventDefault()
    setErreur(null)

    const resultat = await window.api.stock.ajuster({
      ouvrageId: ouvrageSelectionne,
      quantite: Number(quantite),
      sens,
      motif
    })

    if (!resultat.ok) {
      setErreur(resultat.error.message)
      return
    }

    setQuantite('')
    setMotif('')
    await rafraichirStock()
    await rafraichirHistorique()
  }

  return (
    <section>
      <h2>Stock de l'entrepôt (Port-Bouët)</h2>

      <table>
        <thead>
          <tr>
            <th>Ouvrage</th>
            <th>Quantité disponible</th>
            <th>Seuil d'alerte</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {lignes.map((ligne) => (
            <tr key={ligne.ouvrageId}>
              <td>{ligne.titre}</td>
              <td>{ligne.quantiteDisponible}</td>
              <td>{ligne.seuilAlerte}</td>
              <td>{ligne.enAlerte ? '⚠ En alerte' : 'OK'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Ajustement d'inventaire</h3>
      <form onSubmit={soumettreAjustement}>
        <select value={ouvrageSelectionne} onChange={(e) => setOuvrageSelectionne(e.target.value)}>
          {lignes.map((ligne) => (
            <option key={ligne.ouvrageId} value={ligne.ouvrageId}>
              {ligne.titre}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Quantité"
          value={quantite}
          onChange={(e) => setQuantite(e.target.value)}
          required
        />
        <select value={sens} onChange={(e) => setSens(e.target.value as 'PLUS' | 'MOINS')}>
          <option value="PLUS">Ajouter (+)</option>
          <option value="MOINS">Retirer (−)</option>
        </select>
        <input
          placeholder="Motif (obligatoire)"
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
          required
        />
        <button type="submit">Valider l'ajustement</button>
      </form>

      {erreur && <p role="alert">{erreur}</p>}

      <h3>Historique des mouvements</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Quantité</th>
            <th>Motif</th>
          </tr>
        </thead>
        <tbody>
          {historique.map((mouvement) => (
            <tr key={mouvement.id}>
              <td>{new Date(mouvement.dateMouvement).toLocaleString('fr-FR')}</td>
              <td>{mouvement.typeMouvement}</td>
              <td>{mouvement.quantite}</td>
              <td>{mouvement.motif ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
