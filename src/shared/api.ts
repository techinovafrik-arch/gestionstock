// Forme du pont IPC exposé par electron/preload.ts sur `window.api` — voir docs/API_CONTRACT.md.
// Source de vérité du contrat renderer ↔ main : preload.ts est vérifié contre cette interface.
import type {
  AjusterStockInput,
  Client,
  Commune,
  ConsulterStockInput,
  CreerClientInput,
  CreerOuvrageInput,
  CreerReceptionInput,
  CreerReceptionOutput,
  HistoriqueStockInput,
  IpcResult,
  ListerClientsInput,
  ListerOuvragesInput,
  ModifierOuvrageInput,
  MouvementStock,
  Ouvrage,
  StockLigne,
  UtilisateurPublic
} from './types'

export interface Api {
  referentiels: {
    listerOuvrages(input?: ListerOuvragesInput): Promise<IpcResult<Ouvrage[]>>
    creerOuvrage(input: CreerOuvrageInput): Promise<IpcResult<Ouvrage>>
    modifierOuvrage(input: ModifierOuvrageInput): Promise<IpcResult<Ouvrage>>
    listerCommunes(): Promise<IpcResult<Commune[]>>
    listerClients(input?: ListerClientsInput): Promise<IpcResult<Client[]>>
    creerClient(input: CreerClientInput): Promise<IpcResult<Client>>
    listerUtilisateurs(): Promise<IpcResult<UtilisateurPublic[]>>
  }
  receptions: {
    creer(input: CreerReceptionInput): Promise<IpcResult<CreerReceptionOutput>>
  }
  stock: {
    consulter(input?: ConsulterStockInput): Promise<IpcResult<StockLigne[]>>
    historique(input?: HistoriqueStockInput): Promise<IpcResult<MouvementStock[]>>
    ajuster(input: AjusterStockInput): Promise<IpcResult<MouvementStock>>
  }
}
