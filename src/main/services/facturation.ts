import type { PrismaClient } from '@prisma/client'
import type { CreerFactureInput, ListerFacturesInput } from '../../shared/types'
import { ErreurMetier } from './erreurs'
import { genererNumeroFacture } from './numerotation'

// RG-07 : une facture regroupe un ou plusieurs BL d'un même client, reprend leurs lignes et
// calcule le montant total, diminué d'une remise éventuelle (montant absolu en FCFA).
export async function creerFacture(db: PrismaClient, input: CreerFactureInput) {
  if (input.bonsLivraisonIds.length === 0) {
    throw new ErreurMetier(
      'FACTURE_VIDE',
      'Une facture doit regrouper au moins un bon de livraison.'
    )
  }

  return db.$transaction(async (tx) => {
    const bonsLivraison = await tx.bonLivraison.findMany({
      where: { id: { in: input.bonsLivraisonIds } },
      include: { lignes: true, factures: true }
    })

    if (bonsLivraison.length !== input.bonsLivraisonIds.length) {
      throw new ErreurMetier(
        'BON_LIVRAISON_INTROUVABLE',
        'Un ou plusieurs bons de livraison sont introuvables.'
      )
    }
    for (const bonLivraison of bonsLivraison) {
      if (bonLivraison.clientId !== input.clientId) {
        throw new ErreurMetier(
          'CLIENT_INCOHERENT',
          `Le bon de livraison ${bonLivraison.numeroBL} n'appartient pas au client sélectionné.`
        )
      }
      if (bonLivraison.statutBL === 'ANNULE') {
        throw new ErreurMetier(
          'BON_LIVRAISON_ANNULE',
          `Le bon de livraison ${bonLivraison.numeroBL} est annulé.`
        )
      }
      if (bonLivraison.factures.length > 0) {
        throw new ErreurMetier(
          'DEJA_FACTURE',
          `Le bon de livraison ${bonLivraison.numeroBL} est déjà facturé.`
        )
      }
    }

    const lignes = bonsLivraison.flatMap((bonLivraison) =>
      bonLivraison.lignes.map((ligne) => ({
        ouvrageId: ligne.ouvrageId,
        quantite: ligne.quantite,
        prixUnitaire: ligne.prixVenteUnitaire,
        montantLigne: ligne.quantite * ligne.prixVenteUnitaire
      }))
    )

    const montantHT = lignes.reduce((total, ligne) => total + ligne.montantLigne, 0)
    const remise = input.remise ?? 0
    if (remise < 0 || remise > montantHT) {
      throw new ErreurMetier(
        'REMISE_INVALIDE',
        'La remise doit être comprise entre 0 et le montant hors remise.'
      )
    }
    const montantTotal = montantHT - remise

    const numeroFacture = await genererNumeroFacture(tx)

    const facture = await tx.facture.create({
      data: {
        numeroFacture,
        clientId: input.clientId,
        montantHT,
        remise,
        montantTotal,
        lignes: { create: lignes },
        bonsLivraison: {
          create: input.bonsLivraisonIds.map((bonLivraisonId) => ({ bonLivraisonId }))
        }
      },
      include: { lignes: true }
    })

    await tx.bonLivraison.updateMany({
      where: { id: { in: input.bonsLivraisonIds } },
      data: { statutBL: 'FACTURE' }
    })

    return facture
  })
}

export async function listerFactures(db: PrismaClient, input: ListerFacturesInput = {}) {
  return db.facture.findMany({
    where: {
      statutPaiement: input.statutPaiement,
      clientId: input.clientId,
      dateFacture: {
        gte: input.periodeDebut ? new Date(input.periodeDebut) : undefined,
        lte: input.periodeFin ? new Date(input.periodeFin) : undefined
      }
    },
    include: { lignes: true },
    orderBy: { dateFacture: 'desc' }
  })
}

export async function obtenirFacturePourImpression(db: PrismaClient, id: string) {
  return db.facture.findUniqueOrThrow({
    where: { id },
    include: { client: true, lignes: { include: { ouvrage: true } } }
  })
}

export async function consulterFacture(db: PrismaClient, id: string) {
  return db.facture.findUniqueOrThrow({
    where: { id },
    include: { lignes: true, reglements: true, bonsLivraison: { include: { bonLivraison: true } } }
  })
}
