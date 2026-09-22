import type { PrismaClient } from '@prisma/client'
import type {
  AjusterStockInput,
  ConsulterStockInput,
  CreerReceptionInput,
  HistoriqueStockInput,
  StockLigne
} from '../../shared/types'
import { ErreurMetier } from './erreurs'
import { journaliser } from './journalAudit'

// RG-02 : le stock est unique par ouvrage (Ouvrage.quantiteDisponible), jamais ventilé par
// commune ou par dépôt — ce service n'introduit et ne doit jamais introduire de dimension
// géographique dans le calcul du stock.

export async function enregistrerReception(
  db: PrismaClient,
  utilisateurId: string,
  input: CreerReceptionInput
) {
  if (input.lignes.length === 0) {
    throw new ErreurMetier('RECEPTION_VIDE', 'Une réception doit comporter au moins une ligne.')
  }

  return db.$transaction(async (tx) => {
    const mouvements = []

    for (const ligne of input.lignes) {
      const ouvrage = await tx.ouvrage.findUniqueOrThrow({ where: { id: ligne.ouvrageId } })

      if (ligne.prixAchat > 0 && ouvrage.prixVente <= ligne.prixAchat) {
        throw new ErreurMetier(
          'PRIX_VENTE_INVALIDE',
          `Le prix de vente actuel de "${ouvrage.titre}" ne serait plus supérieur au nouveau prix d'achat (RG-01).`
        )
      }

      await tx.ouvrage.update({
        where: { id: ligne.ouvrageId },
        data: {
          quantiteDisponible: { increment: ligne.quantite },
          prixAchat: ligne.prixAchat > 0 ? ligne.prixAchat : ouvrage.prixAchat
        }
      })

      // RG-05 : tout mouvement est horodaté, tracé et associé à un utilisateur.
      const mouvement = await tx.mouvementStock.create({
        data: {
          typeMouvement: 'RECEPTION',
          ouvrageId: ligne.ouvrageId,
          quantite: ligne.quantite,
          dateMouvement: input.dateReception ? new Date(input.dateReception) : undefined,
          utilisateurId
        }
      })
      mouvements.push(mouvement)
    }

    return { mouvements }
  })
}

export async function ajusterStock(
  db: PrismaClient,
  utilisateurId: string,
  input: AjusterStockInput
) {
  if (!input.motif.trim()) {
    // RG-05 : le motif est obligatoire pour un ajustement.
    throw new ErreurMetier(
      'MOTIF_OBLIGATOIRE',
      'Un ajustement de stock doit être justifié par un motif.'
    )
  }
  if (input.quantite <= 0) {
    throw new ErreurMetier(
      'QUANTITE_INVALIDE',
      'La quantité ajustée doit être strictement positive.'
    )
  }

  return db.$transaction(async (tx) => {
    const ouvrage = await tx.ouvrage.findUniqueOrThrow({ where: { id: input.ouvrageId } })
    const delta = input.sens === 'PLUS' ? input.quantite : -input.quantite
    const nouvelleQuantite = ouvrage.quantiteDisponible + delta

    if (nouvelleQuantite < 0) {
      throw new ErreurMetier(
        'STOCK_INSUFFISANT',
        `L'ajustement ferait passer le stock de "${ouvrage.titre}" en dessous de zéro.`
      )
    }

    await tx.ouvrage.update({
      where: { id: input.ouvrageId },
      data: { quantiteDisponible: nouvelleQuantite }
    })

    const mouvement = await tx.mouvementStock.create({
      data: {
        typeMouvement: 'AJUSTEMENT',
        ouvrageId: input.ouvrageId,
        quantite: input.quantite,
        utilisateurId,
        motif: input.motif
      }
    })

    await journaliser(tx, {
      utilisateurId,
      action: 'AJUSTEMENT_STOCK',
      cible: `Ouvrage:${input.ouvrageId}`,
      detail: `${input.sens} ${input.quantite} — ${input.motif}`
    })

    return mouvement
  })
}

export async function consulterStock(
  db: PrismaClient,
  input: ConsulterStockInput = {}
): Promise<StockLigne[]> {
  const ouvrages = await db.ouvrage.findMany({
    where: input.recherche ? { titre: { contains: input.recherche } } : undefined,
    orderBy: { titre: 'asc' }
  })

  // RG-12 : signalement des ouvrages dont le stock est descendu sous le seuil d'alerte.
  return ouvrages.map((ouvrage) => ({
    ouvrageId: ouvrage.id,
    titre: ouvrage.titre,
    quantiteDisponible: ouvrage.quantiteDisponible,
    seuilAlerte: ouvrage.seuilAlerte,
    enAlerte: ouvrage.quantiteDisponible <= ouvrage.seuilAlerte
  }))
}

export async function historiqueMouvements(db: PrismaClient, input: HistoriqueStockInput = {}) {
  return db.mouvementStock.findMany({
    where: {
      ouvrageId: input.ouvrageId,
      typeMouvement: input.typeMouvement,
      dateMouvement: {
        gte: input.periodeDebut ? new Date(input.periodeDebut) : undefined,
        lte: input.periodeFin ? new Date(input.periodeFin) : undefined
      }
    },
    orderBy: { dateMouvement: 'desc' }
  })
}
