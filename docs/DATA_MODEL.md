# Modèle de données

Ce document est la source de vérité structurelle du projet. Toute modification du schéma Prisma (`prisma/schema.prisma`) doit être répercutée ici dans le même commit.

**Rappel du fait non négociable (voir `CLAUDE.md`) : le stock est unique par ouvrage, non ventilé par commune ou par dépôt.**

**Second rappel : Supernova est un fournisseur grossiste, pas un éditeur.** Il agrège et distribue des ouvrages de maisons d'édition diverses. L'entité `Fournisseur` représente ce partenaire commercial unique (contrat de dépôt-vente, prix d'achat convenus, reversements) ; l'éditeur réel d'un ouvrage n'est qu'une information de catalogue (`Ouvrage.editeurOrigine`), sans règle de gestion associée et sans lien structurel avec `Fournisseur`.

## 1. Entités (MCD)

| Entité | Rôle |
|---|---|
| `Fournisseur` | Fournisseur grossiste en dépôt-vente (Supernova) — partenaire commercial unique, destinataire des reversements |
| `Ouvrage` | Catalogue ; porte directement le stock disponible (`quantiteDisponible`) et une information libre d'éditeur d'origine (`editeurOrigine`) |
| `MouvementStock` | Trace tout événement affectant le stock d'un ouvrage |
| `Commune` | Référentiel des 3 communes de livraison (Koumassi, Port-Bouët, Marcory) — n'a aucun lien avec le stock |
| `Client` | Établissement scolaire, librairie ou particulier |
| `BonLivraison` | Sortie de stock vers un client, à livrer dans une commune |
| `LigneBonLivraison` | Détail d'un bon de livraison |
| `Facture` | Document de facturation, regroupe un ou plusieurs bons de livraison |
| `FactureBonLivraison` | Table de liaison Facture ↔ BonLivraison |
| `LigneFacture` | Détail d'une facture |
| `Reglement` | Encaissement client sur une facture |
| `Reversement` | État de reversement périodique dû à Supernova |
| `LigneReversement` | Détail par ouvrage d'un reversement |
| `Utilisateur` | Compte d'accès à l'application |
| `JournalAudit` | Trace des actions sensibles (annulations, ajustements, modifications de prix) |

## 2. Associations et cardinalités

```
Fournisseur  (1,1) ──approvisionne──    (0,n) Ouvrage
Ouvrage      (1,1) ──concerné par──     (0,n) MouvementStock ──réalisé par── (1,1) Utilisateur
Commune      (1,1) ──situe──            (0,n) Client
Commune      (1,1) ──dessert (livraison)── (0,n) BonLivraison
Client       (1,1) ──passe──            (0,n) BonLivraison
BonLivraison (1,1) ──contient──         (1,n) LigneBonLivraison ──porte sur── (1,1) Ouvrage
Client       (1,1) ──règle──            (0,n) Facture
Facture      (1,1) ──détaille──         (1,n) LigneFacture ──porte sur── (1,1) Ouvrage
Facture      (1,n) ──regroupe──         (1,n) BonLivraison   [via FactureBonLivraison]
Facture      (1,1) ──encaisse──         (0,n) Reglement
Reversement  (1,1) ──détaille──         (1,n) LigneReversement ──porte sur── (1,1) Ouvrage
Utilisateur  (1,1) ──journalisé dans──  (0,n) JournalAudit
```

## 3. Schéma Prisma de référence

```prisma
// prisma/schema.prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL") // file:./data/gestion-stock.db
}

generator client {
  provider = "prisma-client-js"
}

enum TypeMouvement {
  RECEPTION
  VENTE
  RETOUR
  AJUSTEMENT
}

enum StatutBonLivraison {
  EMIS
  LIVRE
  FACTURE
  ANNULE
}

enum StatutPaiement {
  EMISE
  PARTIELLE
  REGLEE
  ANNULEE
}

enum StatutReversement {
  OUVERT
  CLOTURE
}

enum RoleUtilisateur {
  ADMINISTRATEUR
  OPERATEUR
}

model Fournisseur {
  id        String    @id @default(cuid())
  nom       String    // Supernova
  adresse   String?
  telephone String?
  contact   String?
  ouvrages  Ouvrage[]
}

model Ouvrage {
  id                 String            @id @default(cuid())
  isbn               String?           @unique
  titre              String
  matiere            String?
  niveau             String?
  editeurOrigine     String?           // éditeur réel de l'ouvrage — simple info de catalogue, sans lien avec Fournisseur
  prixAchat          Int               // en unité mineure (ex. centimes de FCFA) — RG-01
  prixVente          Int               // doit être > prixAchat — RG-01
  quantiteDisponible Int               @default(0) // stock unique, entrepôt de Port-Bouët — RG-02
  seuilAlerte        Int               @default(0)
  actif              Boolean           @default(true)
  fournisseurId      String
  fournisseur        Fournisseur       @relation(fields: [fournisseurId], references: [id])
  mouvements         MouvementStock[]
  lignesBL           LigneBonLivraison[]
  lignesFacture      LigneFacture[]
  lignesReversement  LigneReversement[]
  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt
}

model MouvementStock {
  id             String         @id @default(cuid())
  typeMouvement  TypeMouvement
  ouvrageId      String
  ouvrage        Ouvrage        @relation(fields: [ouvrageId], references: [id])
  quantite       Int            // toujours positif ; le sens (+/-) est déduit de typeMouvement
  dateMouvement  DateTime       @default(now())
  idDocumentRef  String?        // ex. id du BonLivraison, du bon de réception, du retour
  utilisateurId  String
  utilisateur    Utilisateur    @relation(fields: [utilisateurId], references: [id])
  motif          String?        // obligatoire pour AJUSTEMENT — RG-05
}

model Commune {
  id            String          @id @default(cuid())
  nom           String          @unique // Koumassi | Port-Bouët | Marcory
  clients       Client[]
  bonsLivraison BonLivraison[]
}

model Client {
  id            String          @id @default(cuid())
  nom           String
  typeClient    String          // etablissement_scolaire | librairie | particulier
  communeId     String
  commune       Commune         @relation(fields: [communeId], references: [id])
  telephone     String?
  adresse       String?
  bonsLivraison BonLivraison[]
  factures      Facture[]
  createdAt     DateTime        @default(now())
}

model BonLivraison {
  id                  String              @id @default(cuid())
  numeroBL            String              @unique // BL-AAAA-NNNNNN — RG-11
  dateBL              DateTime            @default(now())
  clientId            String
  client              Client              @relation(fields: [clientId], references: [id])
  communeLivraisonId  String
  communeLivraison    Commune             @relation(fields: [communeLivraisonId], references: [id])
  adresseLivraison    String?
  statutBL            StatutBonLivraison  @default(EMIS)
  utilisateurId       String
  utilisateur         Utilisateur         @relation(fields: [utilisateurId], references: [id])
  lignes              LigneBonLivraison[]
  factures            FactureBonLivraison[]
  motifAnnulation     String?
}

model LigneBonLivraison {
  id                String        @id @default(cuid())
  bonLivraisonId    String
  bonLivraison      BonLivraison  @relation(fields: [bonLivraisonId], references: [id])
  ouvrageId         String
  ouvrage           Ouvrage       @relation(fields: [ouvrageId], references: [id])
  quantite          Int
  prixVenteUnitaire Int
}

model Facture {
  id             String                @id @default(cuid())
  numeroFacture  String                @unique // FAC-AAAA-NNNNNN — RG-11
  dateFacture    DateTime              @default(now())
  clientId       String
  client         Client                @relation(fields: [clientId], references: [id])
  montantHT      Int
  remise         Int                   @default(0)
  montantTotal   Int
  statutPaiement StatutPaiement        @default(EMISE)
  lignes         LigneFacture[]
  bonsLivraison  FactureBonLivraison[]
  reglements     Reglement[]
}

model FactureBonLivraison {
  factureId      String
  facture        Facture      @relation(fields: [factureId], references: [id])
  bonLivraisonId String
  bonLivraison   BonLivraison @relation(fields: [bonLivraisonId], references: [id])

  @@id([factureId, bonLivraisonId])
}

model LigneFacture {
  id            String   @id @default(cuid())
  factureId     String
  facture       Facture  @relation(fields: [factureId], references: [id])
  ouvrageId     String
  ouvrage       Ouvrage  @relation(fields: [ouvrageId], references: [id])
  quantite      Int
  prixUnitaire  Int
  montantLigne  Int
}

model Reglement {
  id             String   @id @default(cuid())
  factureId      String
  facture        Facture  @relation(fields: [factureId], references: [id])
  dateReglement  DateTime @default(now())
  montant        Int
  modePaiement   String   // especes | mobile_money | cheque | virement
}

model Reversement {
  id                String              @id @default(cuid())
  periodeDebut      DateTime
  periodeFin        DateTime
  montantDu         Int
  montantVerse      Int                 @default(0)
  dateVersement     DateTime?
  statutReversement StatutReversement   @default(OUVERT) // RG-10
  lignes            LigneReversement[]
}

model LigneReversement {
  id                 String       @id @default(cuid())
  reversementId      String
  reversement        Reversement  @relation(fields: [reversementId], references: [id])
  ouvrageId          String
  ouvrage            Ouvrage      @relation(fields: [ouvrageId], references: [id])
  quantiteVendue     Int
  prixAchatUnitaire  Int          // figé au moment du calcul — RG-08
  montantDu          Int
}

model Utilisateur {
  id             String            @id @default(cuid())
  nom            String
  identifiant    String            @unique
  motDePasseHash String
  role           RoleUtilisateur   @default(OPERATEUR)
  actif          Boolean           @default(true)
  mouvements     MouvementStock[]
  bonsLivraison  BonLivraison[]
  journal        JournalAudit[]
}

model JournalAudit {
  id            String       @id @default(cuid())
  utilisateurId String
  utilisateur   Utilisateur  @relation(fields: [utilisateurId], references: [id])
  action        String       // ex. "ANNULATION_BL", "AJUSTEMENT_STOCK", "MODIFICATION_PRIX"
  cible         String       // type + id de l'entité concernée
  detail        String?
  dateAction    DateTime     @default(now())
}
```

## 4. Dictionnaire de données (attributs sensibles)

| Champ | Entité | Règle |
|---|---|---|
| `editeurOrigine` | `Ouvrage` | libre, informatif uniquement ; distinct de `Fournisseur` (Supernova), sans règle de gestion |
| `prixAchat` | `Ouvrage` | > 0 ; base du calcul de reversement (RG-08) |
| `prixVente` | `Ouvrage` | doit être > `prixAchat` (RG-01) |
| `quantiteDisponible` | `Ouvrage` | ≥ 0 en permanence (RG-02, RG-04) ; jamais dupliqué par commune |
| `typeMouvement` | `MouvementStock` | `RECEPTION`, `VENTE`, `RETOUR`, `AJUSTEMENT` uniquement |
| `numeroBL` / `numeroFacture` | `BonLivraison` / `Facture` | séquentiel, unique, non modifiable après création (RG-11) |
| `communeLivraisonId` | `BonLivraison` | destination logistique uniquement — sans effet sur le stock (RG-06) |
| `prixAchatUnitaire` | `LigneReversement` | figé à la valeur du moment de la vente, indépendant du prix de vente pratiqué (RG-08) |
| `statutReversement` | `Reversement` | passage à `CLOTURE` verrouille les ventes de la période (RG-10) |

## 5. Notes d'implémentation

- Les montants (`prixAchat`, `prixVente`, `montantHT`, etc.) sont stockés en **entier** (unité mineure) pour éviter les erreurs d'arrondi flottant — cf. `CLAUDE.md` §5.
- `quantiteDisponible` sur `Ouvrage` doit être recalculée/mise à jour **dans la même transaction Prisma** que la création du `MouvementStock` correspondant, jamais de façon découplée.
- Toute contrainte « pas de vente à découvert » (RG-04) est vérifiée dans `src/main/services`, avant l'écriture en base — ne pas se reposer uniquement sur une contrainte SQL.
- Les entités `Commune` sont pré-remplies par une migration de seed (`prisma/seed.ts`) avec les trois occurrences : Koumassi, Port-Bouët, Marcory.
