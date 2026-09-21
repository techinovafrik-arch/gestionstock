// Types partagés renderer/main — voir docs/API_CONTRACT.md et docs/DATA_MODEL.md.
// Ne contiennent aucune règle de gestion : uniquement des formes de données.

export type IpcResult<T> =
  { ok: true; data: T } | { ok: false; error: { code: string; message: string } }

export type TypeMouvement = 'RECEPTION' | 'VENTE' | 'RETOUR' | 'AJUSTEMENT'
export type RoleUtilisateur = 'ADMINISTRATEUR' | 'OPERATEUR'

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
