import { useEffect, useState, type JSX } from 'react'
import type { UtilisateurPublic } from '../shared/types'
import { LoginScreen } from './screens/Login/LoginScreen'
import { DashboardScreen } from './screens/Dashboard/DashboardScreen'
import { OuvragesScreen } from './screens/Ouvrages/OuvragesScreen'
import { ReceptionsScreen } from './screens/Receptions/ReceptionsScreen'
import { StockScreen } from './screens/Stock/StockScreen'
import { NouveauBonLivraisonScreen } from './screens/BonLivraison/Nouveau/NouveauBonLivraisonScreen'
import { FacturationScreen } from './screens/Facturation/FacturationScreen'
import { ReglementsScreen } from './screens/Reglements/ReglementsScreen'
import { ReversementScreen } from './screens/Reversement/ReversementScreen'
import { RapportsScreen } from './screens/Rapports/RapportsScreen'
import { AdministrationScreen } from './screens/Administration/AdministrationScreen'

type Onglet =
  | 'dashboard'
  | 'ouvrages'
  | 'receptions'
  | 'stock'
  | 'bonLivraison'
  | 'facturation'
  | 'reglements'
  | 'reversement'
  | 'rapports'
  | 'administration'

export function App(): JSX.Element {
  const [utilisateur, setUtilisateur] = useState<UtilisateurPublic | null>(null)
  const [chargementSession, setChargementSession] = useState(true)
  const [onglet, setOnglet] = useState<Onglet>('dashboard')

  useEffect(() => {
    window.api.auth.sessionCourante().then((resultat) => {
      if (resultat.ok) setUtilisateur(resultat.data)
      setChargementSession(false)
    })
  }, [])

  async function deconnecter(): Promise<void> {
    await window.api.auth.deconnexion()
    setUtilisateur(null)
  }

  if (chargementSession) return <main>Chargement…</main>

  if (!utilisateur) return <LoginScreen onConnecte={setUtilisateur} />

  return (
    <main>
      <h1>Gestion Stock &amp; Facturation — Distribution Supernova</h1>
      <p>
        Connecté : {utilisateur.nom} ({utilisateur.role}) —{' '}
        <button type="button" onClick={deconnecter}>
          Déconnexion
        </button>
      </p>

      <nav>
        <button onClick={() => setOnglet('dashboard')} disabled={onglet === 'dashboard'}>
          Tableau de bord
        </button>
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
        <button onClick={() => setOnglet('reglements')} disabled={onglet === 'reglements'}>
          Règlements
        </button>
        <button onClick={() => setOnglet('reversement')} disabled={onglet === 'reversement'}>
          Reversement
        </button>
        <button onClick={() => setOnglet('rapports')} disabled={onglet === 'rapports'}>
          Rapports
        </button>
        <button onClick={() => setOnglet('administration')} disabled={onglet === 'administration'}>
          Administration
        </button>
      </nav>

      {onglet === 'dashboard' && <DashboardScreen onNaviguer={setOnglet} />}
      {onglet === 'ouvrages' && <OuvragesScreen />}
      {onglet === 'receptions' && <ReceptionsScreen />}
      {onglet === 'stock' && <StockScreen />}
      {onglet === 'bonLivraison' && <NouveauBonLivraisonScreen />}
      {onglet === 'facturation' && <FacturationScreen />}
      {onglet === 'reglements' && <ReglementsScreen />}
      {onglet === 'reversement' && <ReversementScreen />}
      {onglet === 'rapports' && <RapportsScreen />}
      {onglet === 'administration' && <AdministrationScreen />}
    </main>
  )
}
