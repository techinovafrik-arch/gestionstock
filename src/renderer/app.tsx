import { useState, type JSX } from 'react'
import { OuvragesScreen } from './screens/Ouvrages/OuvragesScreen'
import { ReceptionsScreen } from './screens/Receptions/ReceptionsScreen'
import { StockScreen } from './screens/Stock/StockScreen'
import { NouveauBonLivraisonScreen } from './screens/BonLivraison/Nouveau/NouveauBonLivraisonScreen'
import { FacturationScreen } from './screens/Facturation/FacturationScreen'

type Onglet = 'ouvrages' | 'receptions' | 'stock' | 'bonLivraison' | 'facturation'

export function App(): JSX.Element {
  const [onglet, setOnglet] = useState<Onglet>('ouvrages')

  return (
    <main>
      <h1>Gestion Stock &amp; Facturation — Distribution Supernova</h1>

      <nav>
        <button onClick={() => setOnglet('ouvrages')} disabled={onglet === 'ouvrages'}>
          Ouvrages
        </button>
        <button onClick={() => setOnglet('receptions')} disabled={onglet === 'receptions'}>
          Réceptions
        </button>
        <button onClick={() => setOnglet('stock')} disabled={onglet === 'stock'}>
          Stock
        </button>
        <button onClick={() => setOnglet('bonLivraison')} disabled={onglet === 'bonLivraison'}>
          Bon de livraison
        </button>
        <button onClick={() => setOnglet('facturation')} disabled={onglet === 'facturation'}>
          Facturation
        </button>
      </nav>

      {onglet === 'ouvrages' && <OuvragesScreen />}
      {onglet === 'receptions' && <ReceptionsScreen />}
      {onglet === 'stock' && <StockScreen />}
      {onglet === 'bonLivraison' && <NouveauBonLivraisonScreen />}
      {onglet === 'facturation' && <FacturationScreen />}
    </main>
  )
}
