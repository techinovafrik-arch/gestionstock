/*
  Warnings:

  - Added the required column `prixAchatUnitaire` to the `LigneBonLivraison` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LigneBonLivraison" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bonLivraisonId" TEXT NOT NULL,
    "ouvrageId" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prixVenteUnitaire" INTEGER NOT NULL,
    "prixAchatUnitaire" INTEGER NOT NULL,
    CONSTRAINT "LigneBonLivraison_bonLivraisonId_fkey" FOREIGN KEY ("bonLivraisonId") REFERENCES "BonLivraison" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LigneBonLivraison_ouvrageId_fkey" FOREIGN KEY ("ouvrageId") REFERENCES "Ouvrage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_LigneBonLivraison" ("bonLivraisonId", "id", "ouvrageId", "prixVenteUnitaire", "quantite") SELECT "bonLivraisonId", "id", "ouvrageId", "prixVenteUnitaire", "quantite" FROM "LigneBonLivraison";
DROP TABLE "LigneBonLivraison";
ALTER TABLE "new_LigneBonLivraison" RENAME TO "LigneBonLivraison";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
