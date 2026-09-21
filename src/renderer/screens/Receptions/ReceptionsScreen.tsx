import { useEffect, useState, type JSX } from 'react'
import type { Ouvrage } from '../../../shared/types'

interface LigneFormulaire {
  ouvrageId: string
  quantite: string
  prixAchat: string
}

function ligneVide(premierOuvrageId: string): LigneFormulaire {
  return { ouvrageId: premierOuvrageId, quantite: '', prixAchat: '' }
}

export function ReceptionsScreen(): JSX.Element {
  const [ouvrages, setOuvrages] = useState<Ouvrage[]>([])
  const [lignes, setLignes] = useState<LigneFormulaire[]>([ligneVide('')])
  const [message, setMessage] = useState<string | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    window.api.referentiels.listerOuvrages().then((resultat) => {
      if (resultat.ok) {
        setOuvrages(resultat.data)
        if (resultat.data[0]) setLignes([ligneVide(resultat.data[0].id)])
      }
    })
  }, [])

  function modifierLigne(index: number, champ: keyof LigneFormulaire, valeur: string): void {
    setLignes((precedent) =>
      precedent.map((ligne, i) => (i === index ? { ...ligne, [champ]: valeur } : ligne))
    )
  }

  function ajouterLigne(): void {
    setLignes((precedent) => [...precedent, ligneVide(ouvrages[0]?.id ?? '')])
  }

  function retirerLigne(index: number): void {
    setLignes((precedent) => precedent.filter((_, i) => i !== index))
  }

  async function soumettre(evenement: React.FormEvent): Promise<void> {
    evenement.preventDefault()
    setErreur(null)
    setMessage(null)

    const resultat = await window.api.receptions.creer({
      lignes: lignes.map((ligne) => ({
        ouvrageId: ligne.ouvrageId,
        quantite: Number(ligne.quantite),
        prixAchat: Number(ligne.prixAchat)
      }))
    })

    if (!resultat.ok) {
      setErreur(resultat.error.message)
      return
    }

    setMessage(`${resultat.data.mouvements.length} mouvement(s) de réception enregistré(s).`)
    setLignes([ligneVide(ouvrages[0]?.id ?? '')])
  }

  return (
    <section>
      <h2>Réception de stock</h2>

      <form onSubmit={soumettre}>
        {lignes.map((ligne, index) => (
          <div key={index}>
            <select
              value={ligne.ouvrageId}
              onChange={(e) => modifierLigne(index, 'ouvrageId', e.target.value)}
            >
              {ouvrages.map((ouvrage) => (
                <option key={ouvrage.id} value={ouvrage.id}>
                  {ouvrage.titre}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Quantité reçue"
              value={ligne.quantite}
              onChange={(e) => modifierLigne(index, 'quantite', e.target.value)}
              required
            />
            <input
              type="number"
              placeholder="Prix d'achat (FCFA)"
              value={ligne.prixAchat}
              onChange={(e) => modifierLigne(index, 'prixAchat', e.target.value)}
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
        <button type="submit">Valider la réception</button>
      </form>

      {message && <p>{message}</p>}
      {erreur && <p role="alert">{erreur}</p>}
    </section>
  )
}
