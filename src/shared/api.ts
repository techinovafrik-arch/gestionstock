// Forme du pont IPC exposé par electron/preload.ts sur `window.api` — voir docs/API_CONTRACT.md.
// Source de vérité du contrat renderer ↔ main : preload.ts est vérifié contre cette interface.
import type {
  AjusterStockInput,
  AnnulerBonLivraisonInput,
  BonLivraison,
  Client,
  Commune,
  ConnexionInput,
  ConnexionOutput,
  ConsulterStockInput,
  Creance,
  CreerBonLivraisonInput,
  CreerClientInput,
  CreerFactureInput,
  CreerOuvrageInput,
  CreerReceptionInput,
  CreerReceptionOutput,
  CreerUtilisateurInput,
  EnregistrerReglementInput,
  EnregistrerReglementOutput,
  EnregistrerVersementInput,
  Facture,
  Fournisseur,
  GenererEtatReversementInput,
  HistoriqueStockInput,
  ImprimerDocumentOutput,
  IpcResult,
  JournalAudit,
  ListerBonsLivraisonInput,
  ListerClientsInput,
  ListerCreancesInput,
  ListerFacturesInput,
  ListerJournalAuditInput,
  ListerOuvragesInput,
  ModifierOuvrageInput,
  MouvementStock,
  Ouvrage,
  RestaurerInput,
  Reversement,
  SauvegarderMaintenantOutput,
  StockLigne,
  UtilisateurPublic
} from './types'

export interface Api {
  referentiels: {
    listerOuvrages(input?: ListerOuvragesInput): Promise<IpcResult<Ouvrage[]>>
    creerOuvrage(input: CreerOuvrageInput): Promise<IpcResult<Ouvrage>>
    modifierOuvrage(input: ModifierOuvrageInput): Promise<IpcResult<Ouvrage>>
    listerFournisseurs(): Promise<IpcResult<Fournisseur[]>>
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
  ventes: {
    creerBonLivraison(input: CreerBonLivraisonInput): Promise<IpcResult<BonLivraison>>
    listerBonsLivraison(input?: ListerBonsLivraisonInput): Promise<IpcResult<BonLivraison[]>>
    marquerLivre(input: { id: string }): Promise<IpcResult<BonLivraison>>
    annulerBonLivraison(input: AnnulerBonLivraisonInput): Promise<IpcResult<BonLivraison>>
    imprimerBonLivraison(input: { id: string }): Promise<IpcResult<ImprimerDocumentOutput>>
  }
  facturation: {
    creer(input: CreerFactureInput): Promise<IpcResult<Facture>>
    lister(input?: ListerFacturesInput): Promise<IpcResult<Facture[]>>
    imprimer(input: { id: string }): Promise<IpcResult<ImprimerDocumentOutput>>
  }
  reglements: {
    enregistrer(input: EnregistrerReglementInput): Promise<IpcResult<EnregistrerReglementOutput>>
    creances(input?: ListerCreancesInput): Promise<IpcResult<Creance[]>>
  }
  reversement: {
    genererEtat(input: GenererEtatReversementInput): Promise<IpcResult<Reversement>>
    enregistrerVersement(input: EnregistrerVersementInput): Promise<IpcResult<Reversement>>
    lister(): Promise<IpcResult<Reversement[]>>
  }
  auth: {
    connexion(input: ConnexionInput): Promise<IpcResult<ConnexionOutput>>
    deconnexion(): Promise<IpcResult<{ ok: true }>>
    sessionCourante(): Promise<IpcResult<UtilisateurPublic | null>>
  }
  administration: {
    creerUtilisateur(input: CreerUtilisateurInput): Promise<IpcResult<UtilisateurPublic>>
    sauvegarderMaintenant(): Promise<IpcResult<SauvegarderMaintenantOutput>>
    listerSauvegardes(): Promise<IpcResult<string[]>>
    restaurer(input: RestaurerInput): Promise<IpcResult<{ ok: true }>>
    journalAudit(input?: ListerJournalAuditInput): Promise<IpcResult<JournalAudit[]>>
  }
}
