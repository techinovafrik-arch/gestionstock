import type { PrismaClient } from '@prisma/client'
import type {
  LigneRapportMarge,
  LigneRapportVentes,
  RapportMargeInput,
  RapportVentesInput
} from '../../shared/types'

export async function rapportVentes(
  db: PrismaClient,
  input: RapportVentesInput
): Promise<LigneRapportVentes[]> {
  const lignes = await db.ligneBonLivraison.findMany({
    where: {
      bonLivraison: {
        statutBL: { not: 'ANNULE' },
        dateBL: { gte: new Date(input.periodeDebut), lte: new Date(input.periodeFin) }
      }
    },
    include: { bonLivraison: { include: { communeLivraison: true } }, ouvrage: true }
  })

  const regroupement = new Map<string, { quantite: number; montant: number }>()
  for (const ligne of lignes) {
    const cle =
      input.groupePar === 'ouvrage'
        ? ligne.ouvrage.titre
        : input.groupePar === 'commune'
          ? ligne.bonLivraison.communeLivraison.nom
          : ligne.bonLivraison.dateBL.toISOString().slice(0, 10)

    const montantLigne = ligne.quantite * ligne.prixVenteUnitaire
    const existant = regroupement.get(cle)
    if (existant) {
      existant.quantite += ligne.quantite
      existant.montant += montantLigne
    } else {
      regroupement.set(cle, { quantite: ligne.quantite, montant: montantLigne })
    }
  }

  return Array.from(regroupement.entries()).map(([cle, valeurs]) => ({ cle, ...valeurs }))
}

// Marge = prix de vente − prix d'achat, sur les prix figés par ligne de BL (RG-08). Comme pour
// le reversement, le prix d'achat peut varier en cours de période : margeUnitaire est ici une
// moyenne dérivée de margeTotale/quantiteVendue (usage reporting, pas de contrainte d'exactitude
// transactionnelle comme pour RG-08 — voir docs/DATA_MODEL.md §5).
export async function rapportMarge(
  db: PrismaClient,
  input: RapportMargeInput
): Promise<LigneRapportMarge[]> {
  const lignes = await db.ligneBonLivraison.findMany({
    where: {
      bonLivraison: {
        statutBL: { not: 'ANNULE' },
        dateBL: { gte: new Date(input.periodeDebut), lte: new Date(input.periodeFin) }
      }
    },
    include: { ouvrage: true }
  })

  const parOuvrage = new Map<
    string,
    { titre: string; quantiteVendue: number; margeTotale: number }
  >()
  for (const ligne of lignes) {
    const marge = (ligne.prixVenteUnitaire - ligne.prixAchatUnitaire) * ligne.quantite
    const existant = parOuvrage.get(ligne.ouvrageId)
    if (existant) {
      existant.quantiteVendue += ligne.quantite
      existant.margeTotale += marge
    } else {
      parOuvrage.set(ligne.ouvrageId, {
        titre: ligne.ouvrage.titre,
        quantiteVendue: ligne.quantite,
        margeTotale: marge
      })
    }
  }

  return Array.from(parOuvrage.entries()).map(([ouvrageId, valeurs]) => ({
    ouvrageId,
    titre: valeurs.titre,
    quantiteVendue: valeurs.quantiteVendue,
    margeTotale: valeurs.margeTotale,
    margeUnitaire: Math.round(valeurs.margeTotale / valeurs.quantiteVendue)
  }))
}
