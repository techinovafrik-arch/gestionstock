import type { PrismaClient } from '@prisma/client'
import type {
  AnnulerBonLivraisonInput,
  CreerBonLivraisonInput,
  ListerBonsLivraisonInput
} from '../../shared/types'
import { ErreurMetier } from './erreurs'
import { genererNumeroBonLivraison } from './numerotation'

// RG-06 : un bon de livraison est obligatoire pour toute sortie de stock ; la commune de
// livraison est purement descriptive et n'intervient jamais dans le calcul du stock (RG-02).
export async function creerBonLivraison(
  db: PrismaClient,
  utilisateurId: string,
  input: CreerBonLivraisonInput
) {
  if (input.lignes.length === 0) {
    throw new ErreurMetier(
      'BON_LIVRAISON_VIDE',
      'Un bon de livraison doit comporter au moins une ligne.'
    )
  }

  return db.$transaction(async (tx) => {
    // RG-04 : aucune vente ne peut faire passer le stock disponible d'un ouvrage sous zéro,
    // quelle que soit la commune de livraison — vérifié avant toute écriture.
    for (const ligne of input.lignes) {
      const ouvrage = await tx.ouvrage.findUniqueOrThrow({ where: { id: ligne.ouvrageId } })
      if (ouvrage.quantiteDisponible < ligne.quantite) {
        throw new ErreurMetier(
          'STOCK_INSUFFISANT',
          `Stock insuffisant pour "${ouvrage.titre}" (disponible : ${ouvrage.quantiteDisponible}, demandé : ${ligne.quantite}).`
        )
      }
    }

    const numeroBL = await genererNumeroBonLivraison(tx)

    const bonLivraison = await tx.bonLivraison.create({
      data: {
        numeroBL,
        clientId: input.clientId,
        communeLivraisonId: input.communeLivraisonId,
        adresseLivraison: input.adresseLivraison,
        utilisateurId,
        lignes: {
          create: input.lignes.map((ligne) => ({
            ouvrageId: ligne.ouvrageId,
            quantite: ligne.quantite,
            prixVenteUnitaire: ligne.prixVenteUnitaire
          }))
        }
      },
      include: { lignes: true }
    })

    for (const ligne of input.lignes) {
      await tx.ouvrage.update({
        where: { id: ligne.ouvrageId },
        data: { quantiteDisponible: { decrement: ligne.quantite } }
      })
      // RG-05 : mouvement tracé, associé au document et à l'utilisateur.
      await tx.mouvementStock.create({
        data: {
          typeMouvement: 'VENTE',
          ouvrageId: ligne.ouvrageId,
          quantite: ligne.quantite,
          idDocumentRef: bonLivraison.id,
          utilisateurId
        }
      })
    }

    return bonLivraison
  })
}

export async function listerBonsLivraison(db: PrismaClient, input: ListerBonsLivraisonInput = {}) {
  return db.bonLivraison.findMany({
    where: {
      statutBL: input.statut,
      clientId: input.clientId,
      factures: input.nonFactures ? { none: {} } : undefined,
      dateBL: {
        gte: input.periodeDebut ? new Date(input.periodeDebut) : undefined,
        lte: input.periodeFin ? new Date(input.periodeFin) : undefined
      }
    },
    include: { lignes: true },
    orderBy: { dateBL: 'desc' }
  })
}

export async function obtenirBonLivraisonPourImpression(db: PrismaClient, id: string) {
  return db.bonLivraison.findUniqueOrThrow({
    where: { id },
    include: { client: true, communeLivraison: true, lignes: { include: { ouvrage: true } } }
  })
}

export async function marquerLivre(db: PrismaClient, id: string) {
  const bonLivraison = await db.bonLivraison.findUniqueOrThrow({ where: { id } })
  if (bonLivraison.statutBL === 'ANNULE') {
    throw new ErreurMetier('BON_LIVRAISON_ANNULE', 'Ce bon de livraison est annulé.')
  }
  return db.bonLivraison.update({
    where: { id },
    data: { statutBL: 'LIVRE' },
    include: { lignes: true }
  })
}

// RG-13 : ni le BL ni ses lignes ne sont supprimés — seule une annulation tracée est permise,
// qui génère les mouvements de stock inverses nécessaires (le stock était décrémenté dès
// l'émission du BL, cf. RG-04 ci-dessus).
export async function annulerBonLivraison(
  db: PrismaClient,
  utilisateurId: string,
  input: AnnulerBonLivraisonInput
) {
  if (!input.motif.trim()) {
    throw new ErreurMetier(
      'MOTIF_OBLIGATOIRE',
      "L'annulation d'un bon de livraison doit être justifiée par un motif."
    )
  }

  return db.$transaction(async (tx) => {
    const bonLivraison = await tx.bonLivraison.findUniqueOrThrow({
      where: { id: input.id },
      include: { lignes: true, factures: true }
    })

    if (bonLivraison.statutBL === 'ANNULE') {
      throw new ErreurMetier('DEJA_ANNULE', 'Ce bon de livraison est déjà annulé.')
    }
    if (bonLivraison.factures.length > 0) {
      throw new ErreurMetier(
        'DEJA_FACTURE',
        'Ce bon de livraison est déjà facturé et ne peut plus être annulé.'
      )
    }

    for (const ligne of bonLivraison.lignes) {
      await tx.ouvrage.update({
        where: { id: ligne.ouvrageId },
        data: { quantiteDisponible: { increment: ligne.quantite } }
      })
      await tx.mouvementStock.create({
        data: {
          typeMouvement: 'AJUSTEMENT',
          ouvrageId: ligne.ouvrageId,
          quantite: ligne.quantite,
          idDocumentRef: bonLivraison.id,
          utilisateurId,
          motif: `Annulation du bon de livraison ${bonLivraison.numeroBL} : ${input.motif}`
        }
      })
    }

    return tx.bonLivraison.update({
      where: { id: input.id },
      data: { statutBL: 'ANNULE', motifAnnulation: input.motif },
      include: { lignes: true }
    })
  })
}
