import type { PrismaClient } from '@prisma/client'
import type { EnregistrerVersementInput, GenererEtatReversementInput } from '../../shared/types'
import { ErreurMetier } from './erreurs'

// RG-08 : le montant dû à Supernova = Σ (quantité vendue × prix d'achat AU MOMENT DE LA VENTE),
// indépendant du prix de vente, de la remise accordée et de la commune de livraison.
// RG-09 : les retours vers Supernova sont exclus par construction — on ne parcourt que les
// lignes de BonLivraison (des ventes), jamais les mouvements RETOUR.
export async function genererEtatReversement(db: PrismaClient, input: GenererEtatReversementInput) {
  const periodeDebut = new Date(input.periodeDebut)
  const periodeFin = new Date(input.periodeFin)

  return db.$transaction(async (tx) => {
    const lignesBL = await tx.ligneBonLivraison.findMany({
      where: {
        bonLivraison: {
          statutBL: { not: 'ANNULE' },
          dateBL: { gte: periodeDebut, lte: periodeFin }
        }
      }
    })

    // Regroupement par (ouvrage, prixAchatUnitaire) : si le prix d'achat a varié en cours de
    // période (nouvelle réception), on produit plusieurs lignes pour le même ouvrage plutôt
    // qu'un prix moyen — chaque ligne reste ainsi exacte (voir docs/DATA_MODEL.md §5).
    const regroupement = new Map<
      string,
      { ouvrageId: string; prixAchatUnitaire: number; quantiteVendue: number }
    >()
    for (const ligne of lignesBL) {
      const cle = `${ligne.ouvrageId}::${ligne.prixAchatUnitaire}`
      const existant = regroupement.get(cle)
      if (existant) {
        existant.quantiteVendue += ligne.quantite
      } else {
        regroupement.set(cle, {
          ouvrageId: ligne.ouvrageId,
          prixAchatUnitaire: ligne.prixAchatUnitaire,
          quantiteVendue: ligne.quantite
        })
      }
    }

    const lignesReversement = Array.from(regroupement.values()).map((ligne) => ({
      ouvrageId: ligne.ouvrageId,
      prixAchatUnitaire: ligne.prixAchatUnitaire,
      quantiteVendue: ligne.quantiteVendue,
      montantDu: ligne.quantiteVendue * ligne.prixAchatUnitaire
    }))

    const montantDu = lignesReversement.reduce((total, ligne) => total + ligne.montantDu, 0)

    return tx.reversement.create({
      data: {
        periodeDebut,
        periodeFin,
        montantDu,
        lignes: { create: lignesReversement }
      },
      include: { lignes: true }
    })
  })
}

export async function listerReversements(db: PrismaClient) {
  return db.reversement.findMany({ include: { lignes: true }, orderBy: { periodeDebut: 'desc' } })
}

// RG-10 : passage à CLOTURE, qui verrouille les ventes de la période (cf. services/ventes.ts,
// annulerBonLivraison).
export async function enregistrerVersement(db: PrismaClient, input: EnregistrerVersementInput) {
  const reversement = await db.reversement.findUniqueOrThrow({ where: { id: input.reversementId } })

  if (reversement.statutReversement === 'CLOTURE') {
    throw new ErreurMetier('DEJA_CLOTURE', 'Ce reversement est déjà clôturé.')
  }
  if (input.montantVerse <= 0) {
    throw new ErreurMetier('MONTANT_INVALIDE', 'Le montant versé doit être strictement positif.')
  }

  return db.reversement.update({
    where: { id: input.reversementId },
    data: {
      montantVerse: input.montantVerse,
      dateVersement: new Date(input.dateVersement),
      statutReversement: 'CLOTURE'
    },
    include: { lignes: true }
  })
}
