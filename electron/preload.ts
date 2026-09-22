import { contextBridge, ipcRenderer } from 'electron'
import type {
  AjusterStockInput,
  AnnulerBonLivraisonInput,
  ConnexionInput,
  ConsulterStockInput,
  CreerBonLivraisonInput,
  CreerClientInput,
  CreerFactureInput,
  CreerOuvrageInput,
  CreerReceptionInput,
  CreerUtilisateurInput,
  EnregistrerReglementInput,
  EnregistrerVersementInput,
  ExporterRapportInput,
  GenererEtatReversementInput,
  HistoriqueStockInput,
  ListerBonsLivraisonInput,
  ListerClientsInput,
  ListerCreancesInput,
  ListerFacturesInput,
  ListerJournalAuditInput,
  ListerOuvragesInput,
  ModifierOuvrageInput,
  RapportMargeInput,
  RapportVentesInput,
  RestaurerInput
} from '../src/shared/types'
import type { Api } from '../src/shared/api'

// Pont IPC typé exposé au renderer (voir docs/API_CONTRACT.md).
// Le renderer n'accède jamais à Node.js ou à Prisma directement : tout passe par ici.
const api: Api = {
  referentiels: {
    listerOuvrages: (input: ListerOuvragesInput = {}) =>
      ipcRenderer.invoke('referentiels:listerOuvrages', input),
    creerOuvrage: (input: CreerOuvrageInput) =>
      ipcRenderer.invoke('referentiels:creerOuvrage', input),
    modifierOuvrage: (input: ModifierOuvrageInput) =>
      ipcRenderer.invoke('referentiels:modifierOuvrage', input),
    listerFournisseurs: () => ipcRenderer.invoke('referentiels:listerFournisseurs'),
    listerCommunes: () => ipcRenderer.invoke('referentiels:listerCommunes'),
    listerClients: (input: ListerClientsInput = {}) =>
      ipcRenderer.invoke('referentiels:listerClients', input),
    creerClient: (input: CreerClientInput) => ipcRenderer.invoke('referentiels:creerClient', input),
    listerUtilisateurs: () => ipcRenderer.invoke('referentiels:listerUtilisateurs')
  },
  receptions: {
    creer: (input: CreerReceptionInput) => ipcRenderer.invoke('receptions:creer', input)
  },
  stock: {
    consulter: (input: ConsulterStockInput = {}) => ipcRenderer.invoke('stock:consulter', input),
    historique: (input: HistoriqueStockInput = {}) => ipcRenderer.invoke('stock:historique', input),
    ajuster: (input: AjusterStockInput) => ipcRenderer.invoke('stock:ajuster', input)
  },
  ventes: {
    creerBonLivraison: (input: CreerBonLivraisonInput) =>
      ipcRenderer.invoke('ventes:creerBonLivraison', input),
    listerBonsLivraison: (input: ListerBonsLivraisonInput = {}) =>
      ipcRenderer.invoke('ventes:listerBonsLivraison', input),
    marquerLivre: (input: { id: string }) => ipcRenderer.invoke('ventes:marquerLivre', input),
    annulerBonLivraison: (input: AnnulerBonLivraisonInput) =>
      ipcRenderer.invoke('ventes:annulerBonLivraison', input),
    imprimerBonLivraison: (input: { id: string }) =>
      ipcRenderer.invoke('ventes:imprimerBonLivraison', input)
  },
  facturation: {
    creer: (input: CreerFactureInput) => ipcRenderer.invoke('facturation:creer', input),
    lister: (input: ListerFacturesInput = {}) => ipcRenderer.invoke('facturation:lister', input),
    imprimer: (input: { id: string }) => ipcRenderer.invoke('facturation:imprimer', input)
  },
  reglements: {
    enregistrer: (input: EnregistrerReglementInput) =>
      ipcRenderer.invoke('reglements:enregistrer', input),
    creances: (input: ListerCreancesInput = {}) => ipcRenderer.invoke('reglements:creances', input)
  },
  reversement: {
    genererEtat: (input: GenererEtatReversementInput) =>
      ipcRenderer.invoke('reversement:genererEtat', input),
    enregistrerVersement: (input: EnregistrerVersementInput) =>
      ipcRenderer.invoke('reversement:enregistrerVersement', input),
    lister: () => ipcRenderer.invoke('reversement:lister')
  },
  auth: {
    connexion: (input: ConnexionInput) => ipcRenderer.invoke('auth:connexion', input),
    deconnexion: () => ipcRenderer.invoke('auth:deconnexion'),
    sessionCourante: () => ipcRenderer.invoke('auth:sessionCourante')
  },
  administration: {
    creerUtilisateur: (input: CreerUtilisateurInput) =>
      ipcRenderer.invoke('administration:creerUtilisateur', input),
    sauvegarderMaintenant: () => ipcRenderer.invoke('administration:sauvegarderMaintenant'),
    listerSauvegardes: () => ipcRenderer.invoke('administration:listerSauvegardes'),
    restaurer: (input: RestaurerInput) => ipcRenderer.invoke('administration:restaurer', input),
    journalAudit: (input: ListerJournalAuditInput = {}) =>
      ipcRenderer.invoke('administration:journalAudit', input)
  },
  rapports: {
    ventes: (input: RapportVentesInput) => ipcRenderer.invoke('rapports:ventes', input),
    marge: (input: RapportMargeInput) => ipcRenderer.invoke('rapports:marge', input),
    exporter: (input: ExporterRapportInput) => ipcRenderer.invoke('rapports:exporter', input)
  }
}

contextBridge.exposeInMainWorld('api', api)
