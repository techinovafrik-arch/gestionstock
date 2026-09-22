// Types partagés renderer/main — voir docs/API_CONTRACT.md et docs/DATA_MODEL.md.
// Ne contiennent aucune règle de gestion : uniquement des formes de données.

export type IpcResult<T> =
  { ok: true; data: T } | { ok: false; error: { code: string; message: string } }

export type TypeMouvement = 'RECEPTION' | 'VENTE' | 'RETOUR' | 'AJUSTEMENT'
export type RoleUtilisateur = 'ADMINISTRATEUR' | 'OPERATEUR'
export type StatutBonLivraison = 'EMIS' | 'LIVRE' | 'FACTURE' | 'ANNULE'
export type StatutPaiement = 'EMISE' | 'PARTIELLE' | 'REGLEE' | 'ANNULEE'

export interface Ouvrage {
  id: string
  isbn: string | null
  titre: string
  matiere: string | null
  niveau: string | null
  editeurOrigine: string | null
  prixAchat: number
  prixVente: number
  quantiteDisponible: number
  seuilAlerte: number
  actif: boolean
  fournisseurId: string
}

export interface Fournisseur {
  id: string
  nom: string
  adresse: string | null
  telephone: string | null
  contact: string | null
}

export interface Commune {
  id: string
  nom: string
}

export interface Client {
  id: string
  nom: string
  typeClient: string
  communeId: string
  telephone: string | null
  adresse: string | null
}

export interface UtilisateurPublic {
  id: string
  nom: string
  identifiant: string
  role: RoleUtilisateur
  actif: boolean
}

export interface MouvementStock {
  id: string
  typeMouvement: TypeMouvement
  ouvrageId: string
  quantite: number
  dateMouvement: Date
  idDocumentRef: string | null
  utilisateurId: string
  motif: string | null
}

// referentiels:*
export interface ListerOuvragesInput {
  recherche?: string
  actifSeulement?: boolean
}

export interface CreerOuvrageInput {
  titre: string
  isbn?: string
  matiere?: string
  niveau?: string
  editeurOrigine?: string
  prixAchat: number
  prixVente: number
  seuilAlerte?: number
  fournisseurId: string
}

export interface ModifierOuvrageInput {
  id: string
  titre?: string
  isbn?: string
  matiere?: string
  niveau?: string
  editeurOrigine?: string
  prixAchat?: number
  prixVente?: number
  seuilAlerte?: number
  actif?: boolean
}

export interface ListerClientsInput {
  recherche?: string
  communeId?: string
}

export interface CreerClientInput {
  nom: string
  typeClient: string
  communeId: string
  telephone?: string
  adresse?: string
}

// receptions:*
export interface CreerReceptionInput {
  dateReception?: string
  lignes: { ouvrageId: string; quantite: number; prixAchat: number }[]
}

export interface CreerReceptionOutput {
  mouvements: MouvementStock[]
}

// stock:*
export interface ConsulterStockInput {
  recherche?: string
}

export interface StockLigne {
  ouvrageId: string
  titre: string
  quantiteDisponible: number
  seuilAlerte: number
  enAlerte: boolean
}

export interface HistoriqueStockInput {
  ouvrageId?: string
  typeMouvement?: TypeMouvement
  periodeDebut?: string
  periodeFin?: string
}

export interface AjusterStockInput {
  ouvrageId: string
  quantite: number
  sens: 'PLUS' | 'MOINS'
  motif: string
}

// ventes:*
export interface LigneBonLivraison {
  id: string
  ouvrageId: string
  quantite: number
  prixVenteUnitaire: number
}

export interface BonLivraison {
  id: string
  numeroBL: string
  dateBL: Date
  clientId: string
  communeLivraisonId: string
  adresseLivraison: string | null
  statutBL: StatutBonLivraison
  utilisateurId: string
  motifAnnulation: string | null
  lignes: LigneBonLivraison[]
}

export interface CreerBonLivraisonInput {
  clientId: string
  communeLivraisonId: string
  adresseLivraison?: string
  lignes: { ouvrageId: string; quantite: number; prixVenteUnitaire: number }[]
}

export interface ListerBonsLivraisonInput {
  statut?: StatutBonLivraison
  clientId?: string
  periodeDebut?: string
  periodeFin?: string
  nonFactures?: boolean
}

export interface AnnulerBonLivraisonInput {
  id: string
  motif: string
}

// facturation:*
export interface LigneFacture {
  id: string
  ouvrageId: string
  quantite: number
  prixUnitaire: number
  montantLigne: number
}

export interface Facture {
  id: string
  numeroFacture: string
  dateFacture: Date
  clientId: string
  montantHT: number
  remise: number
  montantTotal: number
  statutPaiement: StatutPaiement
  lignes: LigneFacture[]
  reglements?: Reglement[]
}

export interface CreerFactureInput {
  clientId: string
  bonsLivraisonIds: string[]
  remise?: number
}

export interface ListerFacturesInput {
  statutPaiement?: StatutPaiement
  clientId?: string
  periodeDebut?: string
  periodeFin?: string
}

export interface ImprimerDocumentOutput {
  cheminPdf: string
}

// reglements:*
export interface Reglement {
  id: string
  factureId: string
  dateReglement: Date
  montant: number
  modePaiement: string
}

export interface EnregistrerReglementInput {
  factureId: string
  montant: number
  modePaiement: string
  dateReglement?: string
}

export interface EnregistrerReglementOutput {
  reglement: Reglement
  facture: Facture
}

export interface ListerCreancesInput {
  clientId?: string
}

export interface Creance {
  clientId: string
  nom: string
  montantDu: number
  ancienneteJours: number
}

// reversement:*
export type StatutReversement = 'OUVERT' | 'CLOTURE'

export interface LigneReversement {
  id: string
  ouvrageId: string
  quantiteVendue: number
  prixAchatUnitaire: number
  montantDu: number
}

export interface Reversement {
  id: string
  periodeDebut: Date
  periodeFin: Date
  montantDu: number
  montantVerse: number
  dateVersement: Date | null
  statutReversement: StatutReversement
  lignes: LigneReversement[]
}

export interface GenererEtatReversementInput {
  periodeDebut: string
  periodeFin: string
}

export interface EnregistrerVersementInput {
  reversementId: string
  montantVerse: number
  dateVersement: string
}
