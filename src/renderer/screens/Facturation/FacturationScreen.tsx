import { useEffect, useState, type JSX } from 'react'
import type { BonLivraison, Client, Facture } from '../../../shared/types'

export function FacturationScreen(): JSX.Element {
  const [clients, setClients] = useState<Client[]>([])
  const [clientId, setClientId] = useState('')
  const [bonsLivraison, setBonsLivraison] = useState<BonLivraison[]>([])
  const [selection, setSelection] = useState<Set<string>>(new Set())
  const [remise, setRemise] = useState('0')
  const [factures, setFactures] = useState<Facture[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    window.api.referentiels.listerClients().then((resultat) => {
      if (resultat.ok) {
        setClients(resultat.data)
        if (resultat.data[0]) setClientId(resultat.data[0].id)
      }
    })
    window.api.facturation.lister().then((resultat) => {
      if (resultat.ok) setFactures(resultat.data)
    })
  }, [])

  useEffect(() => {
    if (!clientId) return
    window.api.ventes.listerBonsLivraison({ clientId, nonFactures: true }).then((resultat) => {
      if (resultat.ok) setBonsLivraison(resultat.data)
      setSelection(new Set())
    })
  }, [clientId])

  function basculerSelection(id: string): void {
    setSelection((precedent) => {
      const suivant = new Set(precedent)
      if (suivant.has(id)) suivant.delete(id)
      else suivant.add(id)
      return suivant
    })
  }

  async function soumettre(): Promise<void> {
    setErreur(null)
    setMessage(null)

    const resultat = await window.api.facturation.creer({
      clientId,
      bonsLivraisonIds: Array.from(selection),
      remise: Number(remise) || 0
    })

    if (!resultat.ok) {
      setErreur(resultat.error.message)
      return
    }

    setMessage(
      `Facture ${resultat.data.numeroFacture} créée — total ${resultat.data.montantTotal.toLocaleString('fr-FR')} FCFA.`
    )
    setFactures((precedent) => [resultat.data, ...precedent])
    const resultatBL = await window.api.ventes.listerBonsLivraison({ clientId, nonFactures: true })
    if (resultatBL.ok) setBonsLivraison(resultatBL.data)
    setSelection(new Set())
    setRemise('0')
  }

  async function imprimer(id: string): Promise<void> {
    const resultat = await window.api.facturation.imprimer({ id })
    if (resultat.ok) setMessage(`PDF généré : ${resultat.data.cheminPdf}`)
    else setErreur(resultat.error.message)
  }

  return (
    <section>
      <h2>Facturation</h2>

      <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.nom}
          </option>
        ))}
      </select>

      <h3>Bons de livraison non facturés</h3>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Numéro</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {bonsLivraison.map((bl) => (
            <tr key={bl.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selection.has(bl.id)}
                  onChange={() => basculerSelection(bl.id)}
                />
              </td>
              <td>{bl.numeroBL}</td>
              <td>{bl.statutBL}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <label>
        Remise (FCFA) :
        <input type="number" value={remise} onChange={(e) => setRemise(e.target.value)} />
      </label>
      <button type="button" disabled={selection.size === 0} onClick={soumettre}>
        Facturer la sélection
      </button>

      {message && <p>{message}</p>}
      {erreur && <p role="alert">{erreur}</p>}

      <h3>Factures</h3>
      <table>
        <thead>
          <tr>
            <th>Numéro</th>
            <th>Montant total</th>
            <th>Statut paiement</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {factures.map((facture) => (
            <tr key={facture.id}>
              <td>{facture.numeroFacture}</td>
              <td>{facture.montantTotal.toLocaleString('fr-FR')} FCFA</td>
              <td>{facture.statutPaiement}</td>
              <td>
                <button type="button" onClick={() => imprimer(facture.id)}>
                  Imprimer (PDF)
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
