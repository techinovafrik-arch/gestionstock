import { useEffect, useState, type JSX } from 'react'
import type { LigneRapportVentes, Reversement, StockLigne } from '../../../shared/types'

interface DashboardScreenProps {
  onNaviguer: (onglet: 'stock' | 'bonLivraison' | 'reversement') => void
}

function ilYA(jours: number): string {
  const date = new Date()
  date.setDate(date.getDate() - jours)
  return date.toISOString().slice(0, 10)
}

function aujourdHui(): string {
  return new Date().toISOString().slice(0, 10)
}

export function DashboardScreen({ onNaviguer }: DashboardScreenProps): JSX.Element {
  const [stock, setStock] = useState<StockLigne[]>([])
  const [creancesTotal, setCreancesTotal] = useState(0)
  const [montantDuSupernova, setMontantDuSupernova] = useState(0)
  const [ventesSemaine, setVentesSemaine] = useState<LigneRapportVentes[]>([])

  useEffect(() => {
    window.api.stock.consulter().then((resultat) => {
      if (resultat.ok) setStock(resultat.data)
    })
    window.api.reglements.creances().then((resultat) => {
      if (resultat.ok) setCreancesTotal(resultat.data.reduce((total, c) => total + c.montantDu, 0))
    })
    window.api.reversement.lister().then((resultat) => {
      if (resultat.ok) {
        const total = resultat.data
          .filter((r: Reversement) => r.statutReversement === 'OUVERT')
          .reduce((total, r) => total + r.montantDu, 0)
        setMontantDuSupernova(total)
      }
    })
    window.api.rapports
      .ventes({ periodeDebut: ilYA(7), periodeFin: aujourdHui(), groupePar: 'commune' })
      .then((resultat) => {
        if (resultat.ok) setVentesSemaine(resultat.data)
      })
  }, [])

  const ouvragesEnAlerte = stock.filter((s) => s.enAlerte)
  const stockTotal = stock.reduce((total, s) => total + s.quantiteDisponible, 0)

  return (
    <section>
      <h2>Tableau de bord</h2>

      <div>
        <div>
          <strong>Stock disponible (toutes références)</strong>
          <p>
            {stockTotal.toLocaleString('fr-FR')}{' '}
            <button type="button" onClick={() => onNaviguer('stock')}>
              Voir le stock
            </button>
          </p>
        </div>

        <div>
          <strong>Ouvrages en alerte de seuil</strong>
          <p>{ouvragesEnAlerte.length}</p>
          <ul>
            {ouvragesEnAlerte.map((o) => (
              <li key={o.ouvrageId}>
                {o.titre} — {o.quantiteDisponible} / seuil {o.seuilAlerte}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <strong>Créances clients en cours</strong>
          <p>{creancesTotal.toLocaleString('fr-FR')} FCFA</p>
        </div>

        <div>
          <strong>Montant dû à Supernova (reversements ouverts)</strong>
          <p>
            {montantDuSupernova.toLocaleString('fr-FR')} FCFA{' '}
            <button type="button" onClick={() => onNaviguer('reversement')}>
              Gérer le reversement
            </button>
          </p>
        </div>
      </div>

      <h3>Ventes des 7 derniers jours, par commune</h3>
      <table>
        <thead>
          <tr>
            <th>Commune</th>
            <th>Quantité</th>
            <th>Montant</th>
          </tr>
        </thead>
        <tbody>
          {ventesSemaine.map((ligne) => (
            <tr key={ligne.cle}>
              <td>{ligne.cle}</td>
              <td>{ligne.quantite}</td>
              <td>{ligne.montant.toLocaleString('fr-FR')} FCFA</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" onClick={() => onNaviguer('bonLivraison')}>
        Nouveau bon de livraison
      </button>
    </section>
  )
}
