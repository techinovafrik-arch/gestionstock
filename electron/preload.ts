import { contextBridge, ipcRenderer } from 'electron'
import type {
  AjusterStockInput,
  ConsulterStockInput,
  CreerClientInput,
  CreerOuvrageInput,
  CreerReceptionInput,
  HistoriqueStockInput,
  ListerClientsInput,
  ListerOuvragesInput,
  ModifierOuvrageInput
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
  }
}

contextBridge.exposeInMainWorld('api', api)
