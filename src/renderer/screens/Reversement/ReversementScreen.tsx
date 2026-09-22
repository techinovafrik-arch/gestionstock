import { useEffect, useState, type JSX } from 'react'
import type { Reversement } from '../../../shared/types'

function premierJourDuMois(): string {
  const maintenant = new Date()
  return new Date(maintenant.getFullYear(), maintenant.getMonth(), 1).toISOString().slice(0, 10)
}

function aujourdHui(): string {
  return new Date().toISOString().slice(0, 10)
}

export function ReversementScreen(): JSX.Element {
  const [periodeDebut, setPeriodeDebut] = useState(premierJourDuMois())
  const [periodeFin, setPeriodeFin] = useState(aujourdHui())
  const [etatCourant, setEtatCourant] = useState<Reversement | null>(null)
  const [historique, setHistorique] = useState<Reversement[]>([])
  const [montantVerse, setMontantVerse] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    window.api.reversement.lister().then((resultat) => {
      if (resultat.ok) setHistorique(resultat.data)
    })
  }, [])

  async function genererEtat(evenement: React.FormEvent): Promise<void> {
    evenement.preventDefault()
    setErreur(null)
    setMessage(null)

    const resultat = await window.api.reversement.genererEtat({ periodeDebut, periodeFin })
    if (!resultat.ok) {
      setErreur(resultat.error.message)
      return
    }

    setEtatCourant(resultat.data)
    setMontantVerse(String(resultat.data.montantDu))
  }

  async function cloturer(): Promise<void> {
    if (!etatCourant) return
    setErreur(null)
    setMessage(null)

    const resultat = await window.api.reversement.enregistrerVersement({
      reversementId: etatCourant.id,
      montantVerse: Number(montantVerse),
      dateVersement: aujourdHui()
    })

    if (!resultat.ok) {
      setErreur(resultat.error.message)
      return
    }

    setEtatCourant(resultat.data)
    setMessage('Versement enregistré, période clôturée.')
    const resultatListe = await window.api.reversement.lister()
    if (resultatListe.ok) setHistorique(resultatListe.data)
  }

  return (
    <section>
      <h2>Reversement à Supernova</h2>

      <form onSubmit={genererEtat}>
        <label>
          Du :
          <input
            type="date"
            value={periodeDebut}
            onChange={(e) => setPeriodeDebut(e.target.value)}
          />
        </label>
        <label>
          Au :
          <input type="date" value={periodeFin} onChange={(e) => setPeriodeFin(e.target.value)} />
        </label>
        <button type="submit">Générer l'état de la période</button>
      </form>

      {etatCourant && (
        <div>
          <h3>Détail par ouvrage</h3>
          <table>
            <thead>
              <tr>
                <th>Ouvrage</th>
                <th>Quantité vendue</th>
                <th>Prix d'achat unitaire</th>
                <th>Montant dû</th>
              </tr>
            </thead>
            <tbody>
              {etatCourant.lignes.map((ligne) => (
                <tr key={ligne.id}>
                  <td>{ligne.ouvrageId}</td>
                  <td>{ligne.quantiteVendue}</td>
                  <td>{ligne.prixAchatUnitaire.toLocaleString('fr-FR')} FCFA</td>
                  <td>{ligne.montantDu.toLocaleString('fr-FR')} FCFA</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p>
            <strong>Montant total dû : {etatCourant.montantDu.toLocaleString('fr-FR')} FCFA</strong>{' '}
            — statut : {etatCourant.statutReversement}
          </p>

          {etatCourant.statutReversement === 'OUVERT' && (
            <div>
              <input
                type="number"
                value={montantVerse}
                onChange={(e) => setMontantVerse(e.target.value)}
              />
              <button type="button" onClick={cloturer}>
                Enregistrer le versement et clôturer
              </button>
            </div>
          )}
        </div>
      )}

      {message && <p>{message}</p>}
      {erreur && <p role="alert">{erreur}</p>}

      <h3>Historique des reversements</h3>
      <table>
        <thead>
          <tr>
            <th>Période</th>
            <th>Montant dû</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {historique.map((reversement) => (
            <tr key={reversement.id}>
              <td>
                {new Date(reversement.periodeDebut).toLocaleDateString('fr-FR')} —{' '}
                {new Date(reversement.periodeFin).toLocaleDateString('fr-FR')}
              </td>
              <td>{reversement.montantDu.toLocaleString('fr-FR')} FCFA</td>
              <td>{reversement.statutReversement}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
