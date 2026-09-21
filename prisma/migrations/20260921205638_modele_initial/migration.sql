-- CreateTable
CREATE TABLE "Fournisseur" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "adresse" TEXT,
    "telephone" TEXT,
    "contact" TEXT
);

-- CreateTable
CREATE TABLE "Ouvrage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "isbn" TEXT,
    "titre" TEXT NOT NULL,
    "matiere" TEXT,
    "niveau" TEXT,
    "editeurOrigine" TEXT,
    "prixAchat" INTEGER NOT NULL,
    "prixVente" INTEGER NOT NULL,
    "quantiteDisponible" INTEGER NOT NULL DEFAULT 0,
    "seuilAlerte" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "fournisseurId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Ouvrage_fournisseurId_fkey" FOREIGN KEY ("fournisseurId") REFERENCES "Fournisseur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MouvementStock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "typeMouvement" TEXT NOT NULL,
    "ouvrageId" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "dateMouvement" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idDocumentRef" TEXT,
    "utilisateurId" TEXT NOT NULL,
    "motif" TEXT,
    CONSTRAINT "MouvementStock_ouvrageId_fkey" FOREIGN KEY ("ouvrageId") REFERENCES "Ouvrage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MouvementStock_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Commune" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "typeClient" TEXT NOT NULL,
    "communeId" TEXT NOT NULL,
    "telephone" TEXT,
    "adresse" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Client_communeId_fkey" FOREIGN KEY ("communeId") REFERENCES "Commune" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BonLivraison" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numeroBL" TEXT NOT NULL,
    "dateBL" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT NOT NULL,
    "communeLivraisonId" TEXT NOT NULL,
    "adresseLivraison" TEXT,
    "statutBL" TEXT NOT NULL DEFAULT 'EMIS',
    "utilisateurId" TEXT NOT NULL,
    "motifAnnulation" TEXT,
    CONSTRAINT "BonLivraison_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BonLivraison_communeLivraisonId_fkey" FOREIGN KEY ("communeLivraisonId") REFERENCES "Commune" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BonLivraison_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LigneBonLivraison" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bonLivraisonId" TEXT NOT NULL,
    "ouvrageId" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prixVenteUnitaire" INTEGER NOT NULL,
    CONSTRAINT "LigneBonLivraison_bonLivraisonId_fkey" FOREIGN KEY ("bonLivraisonId") REFERENCES "BonLivraison" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LigneBonLivraison_ouvrageId_fkey" FOREIGN KEY ("ouvrageId") REFERENCES "Ouvrage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Facture" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numeroFacture" TEXT NOT NULL,
    "dateFacture" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT NOT NULL,
    "montantHT" INTEGER NOT NULL,
    "remise" INTEGER NOT NULL DEFAULT 0,
    "montantTotal" INTEGER NOT NULL,
    "statutPaiement" TEXT NOT NULL DEFAULT 'EMISE',
    CONSTRAINT "Facture_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FactureBonLivraison" (
    "factureId" TEXT NOT NULL,
    "bonLivraisonId" TEXT NOT NULL,

    PRIMARY KEY ("factureId", "bonLivraisonId"),
    CONSTRAINT "FactureBonLivraison_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "Facture" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FactureBonLivraison_bonLivraisonId_fkey" FOREIGN KEY ("bonLivraisonId") REFERENCES "BonLivraison" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LigneFacture" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "factureId" TEXT NOT NULL,
    "ouvrageId" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prixUnitaire" INTEGER NOT NULL,
    "montantLigne" INTEGER NOT NULL,
    CONSTRAINT "LigneFacture_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "Facture" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LigneFacture_ouvrageId_fkey" FOREIGN KEY ("ouvrageId") REFERENCES "Ouvrage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reglement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "factureId" TEXT NOT NULL,
    "dateReglement" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "montant" INTEGER NOT NULL,
    "modePaiement" TEXT NOT NULL,
    CONSTRAINT "Reglement_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "Facture" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reversement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "periodeDebut" DATETIME NOT NULL,
    "periodeFin" DATETIME NOT NULL,
    "montantDu" INTEGER NOT NULL,
    "montantVerse" INTEGER NOT NULL DEFAULT 0,
    "dateVersement" DATETIME,
    "statutReversement" TEXT NOT NULL DEFAULT 'OUVERT'
);

-- CreateTable
CREATE TABLE "LigneReversement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reversementId" TEXT NOT NULL,
    "ouvrageId" TEXT NOT NULL,
    "quantiteVendue" INTEGER NOT NULL,
    "prixAchatUnitaire" INTEGER NOT NULL,
    "montantDu" INTEGER NOT NULL,
    CONSTRAINT "LigneReversement_reversementId_fkey" FOREIGN KEY ("reversementId") REFERENCES "Reversement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LigneReversement_ouvrageId_fkey" FOREIGN KEY ("ouvrageId") REFERENCES "Ouvrage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Utilisateur" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "identifiant" TEXT NOT NULL,
    "motDePasseHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'OPERATEUR',
    "actif" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "JournalAudit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "utilisateurId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "cible" TEXT NOT NULL,
    "detail" TEXT,
    "dateAction" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JournalAudit_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Ouvrage_isbn_key" ON "Ouvrage"("isbn");

-- CreateIndex
CREATE UNIQUE INDEX "Commune_nom_key" ON "Commune"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "BonLivraison_numeroBL_key" ON "BonLivraison"("numeroBL");

-- CreateIndex
CREATE UNIQUE INDEX "Facture_numeroFacture_key" ON "Facture"("numeroFacture");

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_identifiant_key" ON "Utilisateur"("identifiant");
