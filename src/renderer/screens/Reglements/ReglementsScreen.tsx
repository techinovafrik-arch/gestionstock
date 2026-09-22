import { useEffect, useState, type JSX } from 'react'
import type { Creance, Facture } from '../../../shared/types'

export function ReglementsScreen(): JSX.Element {
  const [factures, setFactures] = useState<Facture[]>([])
  const [creances, setCreances] = useState<Creance[]>([])
  const [factureId, setFactureId] = useState('')
  const [montant, setMontant] = useState('')
  const [modePaiement, setModePaiement] = useState('especes')
  const [message, setMessage] = useState<string | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  async function rafraichir(): Promise<void> {
    const [resFactures, resCreances] = await Promise.all([
      window.api.facturation.lister(),
      window.api.reglements.creances()
    ])
    if (resFactures.ok) {
      setFactures(resFactures.data)
      if (!factureId && resFactures.data[0]) setFactureId(resFactures.data[0].id)
    }
    if (resCreances.ok) setCreances(resCreances.data)
  }

  useEffect(() => {
    window.api.facturation.lister().then((resultat) => {
      if (resultat.ok) {
        setFactures(resultat.data)
        if (resultat.data[0]) setFactureId(resultat.data[0].id)
      }
    })
    window.api.reglements.creances().then((resultat) => {
      if (resultat.ok) setCreances(resultat.data)
    })
  }, [])

  function soldeRestant(facture: Facture): number {
    const verse = (facture.reglements ?? []).reduce((total, r) => total + r.montant, 0)
    return facture.montantTotal - verse
  }

  async function soumettre(evenement: React.FormEvent): Promise<void> {
    evenement.preventDefault()
    setErreur(null)
    setMessage(null)

    const resultat = await window.api.reglements.enregistrer({
      factureId,
      montant: Number(montant),
      modePaiement
    })

    if (!resultat.ok) {
      setErreur(resultat.error.message)
      return
    }

    setMessage(`Règlement enregistré — statut facture : ${resultat.data.facture.statutPaiement}.`)
    setMontant('')
    await rafraichir()
  }

  return (
    <section>
      <h2>Règlements clients</h2>

      <table>
        <thead>
          <tr>
            <th>Facture</th>
            <th>Total</th>
            <th>Solde dû</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {factures.map((facture) => (
            <tr key={facture.id}>
              <td>{facture.numeroFacture}</td>
              <td>{facture.montantTotal.toLocaleString('fr-FR')} FCFA</td>
              <td>{soldeRestant(facture).toLocaleString('fr-FR')} FCFA</td>
              <td>{facture.statutPaiement}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Enregistrer un règlement</h3>
      <form onSubmit={soumettre}>
        <select value={factureId} onChange={(e) => setFactureId(e.target.value)} required>
          {factures.map((facture) => (
            <option key={facture.id} value={facture.id}>
              {facture.numeroFacture} (solde : {soldeRestant(facture).toLocaleString('fr-FR')} FCFA)
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Montant"
          value={montant}
          onChange={(e) => setMontant(e.target.value)}
          required
        />
        <select value={modePaiement} onChange={(e) => setModePaiement(e.target.value)}>
          <option value="especes">Espèces</option>
          <option value="mobile_money">Mobile money</option>
          <option value="cheque">Chèque</option>
          <option value="virement">Virement</option>
        </select>
        <button type="submit">Enregistrer</button>
      </form>

      {message && <p>{message}</p>}
      {erreur && <p role="alert">{erreur}</p>}

      <h3>État des créances par client</h3>
      <table>
        <thead>
          <tr>
            <th>Client</th>
            <th>Montant dû</th>
            <th>Ancienneté</th>
          </tr>
        </thead>
        <tbody>
          {creances.map((creance) => (
            <tr key={creance.clientId}>
              <td>{creance.nom}</td>
              <td>{creance.montantDu.toLocaleString('fr-FR')} FCFA</td>
              <td>{creance.ancienneteJours} jour(s)</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
