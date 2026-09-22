import { useState, type JSX } from 'react'
import type {
  FormatExport,
  GroupePar,
  LigneRapportMarge,
  LigneRapportVentes,
  TypeRapport
} from '../../../shared/types'

function premierJourDuMois(): string {
  const maintenant = new Date()
  return new Date(maintenant.getFullYear(), maintenant.getMonth(), 1).toISOString().slice(0, 10)
}

function aujourdHui(): string {
  return new Date().toISOString().slice(0, 10)
}

export function RapportsScreen(): JSX.Element {
  const [periodeDebut, setPeriodeDebut] = useState(premierJourDuMois())
  const [periodeFin, setPeriodeFin] = useState(aujourdHui())
  const [groupePar, setGroupePar] = useState<GroupePar>('ouvrage')
  const [ventes, setVentes] = useState<LigneRapportVentes[]>([])
  const [marge, setMarge] = useState<LigneRapportMarge[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  async function genererRapports(evenement: React.FormEvent): Promise<void> {
    evenement.preventDefault()
    setErreur(null)
    setMessage(null)

    const [resVentes, resMarge] = await Promise.all([
      window.api.rapports.ventes({ periodeDebut, periodeFin, groupePar }),
      window.api.rapports.marge({ periodeDebut, periodeFin })
    ])

    if (resVentes.ok) setVentes(resVentes.data)
    if (resMarge.ok) setMarge(resMarge.data)
    if (!resVentes.ok) setErreur(resVentes.error.message)
    else if (!resMarge.ok) setErreur(resMarge.error.message)
  }

  async function exporter(type: TypeRapport, format: FormatExport): Promise<void> {
    setErreur(null)
    setMessage(null)
    const resultat = await window.api.rapports.exporter({ type, format, periodeDebut, periodeFin })
    if (!resultat.ok) {
      setErreur(resultat.error.message)
      return
    }
    setMessage(`Export généré : ${resultat.data.cheminFichier}`)
  }

  return (
    <section>
      <h2>Rapports</h2>

      <form onSubmit={genererRapports}>
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
        <select value={groupePar} onChange={(e) => setGroupePar(e.target.value as GroupePar)}>
          <option value="ouvrage">Par ouvrage</option>
          <option value="commune">Par commune</option>
          <option value="jour">Par jour</option>
        </select>
        <button type="submit">Générer</button>
      </form>

      {erreur && <p role="alert">{erreur}</p>}
      {message && <p>{message}</p>}

      <h3>Ventes</h3>
      <button type="button" onClick={() => exporter('ventes', 'csv')}>
        Exporter en CSV
      </button>
      <button type="button" onClick={() => exporter('ventes', 'pdf')}>
        Exporter en PDF
      </button>
      <table>
        <thead>
          <tr>
            <th>
              {groupePar === 'ouvrage' ? 'Ouvrage' : groupePar === 'commune' ? 'Commune' : 'Jour'}
            </th>
            <th>Quantité</th>
            <th>Montant</th>
          </tr>
        </thead>
        <tbody>
          {ventes.map((ligne) => (
            <tr key={ligne.cle}>
              <td>{ligne.cle}</td>
              <td>{ligne.quantite}</td>
              <td>{ligne.montant.toLocaleString('fr-FR')} FCFA</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Marge par ouvrage</h3>
      <button type="button" onClick={() => exporter('marge', 'csv')}>
        Exporter en CSV
      </button>
      <button type="button" onClick={() => exporter('marge', 'pdf')}>
        Exporter en PDF
      </button>
      <table>
        <thead>
          <tr>
            <th>Ouvrage</th>
            <th>Quantité vendue</th>
            <th>Marge unitaire</th>
            <th>Marge totale</th>
          </tr>
        </thead>
        <tbody>
          {marge.map((ligne) => (
            <tr key={ligne.ouvrageId}>
              <td>{ligne.titre}</td>
              <td>{ligne.quantiteVendue}</td>
              <td>{ligne.margeUnitaire.toLocaleString('fr-FR')} FCFA</td>
              <td>{ligne.margeTotale.toLocaleString('fr-FR')} FCFA</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Créances clients</h3>
      <button type="button" onClick={() => exporter('creances', 'csv')}>
        Exporter en CSV
      </button>
      <button type="button" onClick={() => exporter('creances', 'pdf')}>
        Exporter en PDF
      </button>
    </section>
  )
}
