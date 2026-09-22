import { useEffect, useState, type JSX } from 'react'
import type { Client, Commune, Ouvrage } from '../../../../shared/types'

interface LigneFormulaire {
  ouvrageId: string
  quantite: string
  prixVenteUnitaire: string
}

function ligneVide(premierOuvrage: Ouvrage | undefined): LigneFormulaire {
  return {
    ouvrageId: premierOuvrage?.id ?? '',
    quantite: '',
    prixVenteUnitaire: premierOuvrage ? String(premierOuvrage.prixVente) : ''
  }
}

export function NouveauBonLivraisonScreen(): JSX.Element {
  const [ouvrages, setOuvrages] = useState<Ouvrage[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [communes, setCommunes] = useState<Commune[]>([])
  const [clientId, setClientId] = useState('')
  const [communeLivraisonId, setCommuneLivraisonId] = useState('')
  const [adresseLivraison, setAdresseLivraison] = useState('')
  const [lignes, setLignes] = useState<LigneFormulaire[]>([ligneVide(undefined)])
  const [nouveauClientNom, setNouveauClientNom] = useState('')
  const [afficherNouveauClient, setAfficherNouveauClient] = useState(false)
  const [dernierBonLivraisonId, setDernierBonLivraisonId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    window.api.referentiels.listerOuvrages({ actifSeulement: true }).then((resultat) => {
      if (resultat.ok) {
        setOuvrages(resultat.data)
        setLignes([ligneVide(resultat.data[0])])
      }
    })
    window.api.referentiels.listerClients().then((resultat) => {
      if (resultat.ok) {
        setClients(resultat.data)
        if (resultat.data[0]) setClientId(resultat.data[0].id)
      }
    })
    window.api.referentiels.listerCommunes().then((resultat) => {
      if (resultat.ok) {
        setCommunes(resultat.data)
        if (resultat.data[0]) setCommuneLivraisonId(resultat.data[0].id)
      }
    })
  }, [])

  function modifierLigne(index: number, champ: keyof LigneFormulaire, valeur: string): void {
    setLignes((precedent) =>
      precedent.map((ligne, i) => (i === index ? { ...ligne, [champ]: valeur } : ligne))
    )
  }

  function ajouterLigne(): void {
    setLignes((precedent) => [...precedent, ligneVide(ouvrages[0])])
  }

  function retirerLigne(index: number): void {
    setLignes((precedent) => precedent.filter((_, i) => i !== index))
  }

  async function creerNouveauClient(): Promise<void> {
    if (!nouveauClientNom.trim() || !communeLivraisonId) return
    const resultat = await window.api.referentiels.creerClient({
      nom: nouveauClientNom,
      typeClient: 'etablissement_scolaire',
      communeId: communeLivraisonId
    })
    if (resultat.ok) {
      setClients((precedent) => [...precedent, resultat.data])
      setClientId(resultat.data.id)
      setNouveauClientNom('')
      setAfficherNouveauClient(false)
    }
  }

  const totalIndicatif = lignes.reduce(
    (total, ligne) =>
      total + (Number(ligne.quantite) || 0) * (Number(ligne.prixVenteUnitaire) || 0),
    0
  )

  async function soumettre(evenement: React.FormEvent): Promise<void> {
    evenement.preventDefault()
    setErreur(null)
    setMessage(null)

    const resultat = await window.api.ventes.creerBonLivraison({
      clientId,
      communeLivraisonId,
      adresseLivraison: adresseLivraison || undefined,
      lignes: lignes.map((ligne) => ({
        ouvrageId: ligne.ouvrageId,
        quantite: Number(ligne.quantite),
        prixVenteUnitaire: Number(ligne.prixVenteUnitaire)
      }))
    })

    if (!resultat.ok) {
      setErreur(resultat.error.message)
      return
    }

    setMessage(`Bon de livraison ${resultat.data.numeroBL} créé.`)
    setDernierBonLivraisonId(resultat.data.id)
    setLignes([ligneVide(ouvrages[0])])
    const resultatOuvrages = await window.api.referentiels.listerOuvrages({ actifSeulement: true })
    if (resultatOuvrages.ok) setOuvrages(resultatOuvrages.data)
  }

  async function imprimer(): Promise<void> {
    if (!dernierBonLivraisonId) return
    const resultat = await window.api.ventes.imprimerBonLivraison({ id: dernierBonLivraisonId })
    if (resultat.ok) setMessage(`PDF généré : ${resultat.data.cheminPdf}`)
    else setErreur(resultat.error.message)
  }

  return (
    <section>
      <h2>Nouveau bon de livraison</h2>

      <form onSubmit={soumettre}>
        <div>
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} required>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.nom}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => setAfficherNouveauClient((v) => !v)}>
            + Nouveau client
          </button>
        </div>

        {afficherNouveauClient && (
          <div>
            <input
              placeholder="Nom du client"
              value={nouveauClientNom}
              onChange={(e) => setNouveauClientNom(e.target.value)}
            />
            <button type="button" onClick={creerNouveauClient}>
              Créer le client
            </button>
          </div>
        )}

        <div>
          <select
            value={communeLivraisonId}
            onChange={(e) => setCommuneLivraisonId(e.target.value)}
            required
          >
            {communes.map((commune) => (
              <option key={commune.id} value={commune.id}>
                {commune.nom}
              </option>
            ))}
          </select>
          <input
            placeholder="Adresse de livraison (facultatif)"
            value={adresseLivraison}
            onChange={(e) => setAdresseLivraison(e.target.value)}
          />
        </div>

        {lignes.map((ligne, index) => (
          <div key={index}>
            <select
              value={ligne.ouvrageId}
              onChange={(e) => modifierLigne(index, 'ouvrageId', e.target.value)}
            >
              {ouvrages.map((ouvrage) => (
                <option key={ouvrage.id} value={ouvrage.id}>
                  {ouvrage.titre} (stock : {ouvrage.quantiteDisponible})
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Quantité"
              value={ligne.quantite}
              onChange={(e) => modifierLigne(index, 'quantite', e.target.value)}
              required
            />
            <input
              type="number"
              placeholder="Prix de vente unitaire"
              value={ligne.prixVenteUnitaire}
              onChange={(e) => modifierLigne(index, 'prixVenteUnitaire', e.target.value)}
              required
            />
            {lignes.length > 1 && (
              <button type="button" onClick={() => retirerLigne(index)}>
                Retirer
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={ajouterLigne}>
          Ajouter une ligne
        </button>

        <p>Total indicatif : {totalIndicatif.toLocaleString('fr-FR')} FCFA</p>

        <button type="submit">Valider le bon de livraison</button>
      </form>

      {dernierBonLivraisonId && (
        <button type="button" onClick={imprimer}>
          Imprimer le dernier bon de livraison (PDF)
        </button>
      )}

      {message && <p>{message}</p>}
      {erreur && <p role="alert">{erreur}</p>}
    </section>
  )
}
