import type { PrismaClient } from '@prisma/client'
import type { EnregistrerReglementInput, ListerCreancesInput } from '../../shared/types'
import { ErreurMetier } from './erreurs'

function determinerStatutPaiement(
  montantTotal: number,
  montantVerseCumule: number
): 'EMISE' | 'PARTIELLE' | 'REGLEE' {
  if (montantVerseCumule <= 0) return 'EMISE'
  if (montantVerseCumule >= montantTotal) return 'REGLEE'
  return 'PARTIELLE'
}

export async function enregistrerReglement(db: PrismaClient, input: EnregistrerReglementInput) {
  if (input.montant <= 0) {
    throw new ErreurMetier(
      'MONTANT_INVALIDE',
      'Le montant du règlement doit être strictement positif.'
    )
  }

  return db.$transaction(async (tx) => {
    const facture = await tx.facture.findUniqueOrThrow({
      where: { id: input.factureId },
      include: { reglements: true }
    })

    if (facture.statutPaiement === 'ANNULEE') {
      throw new ErreurMetier(
        'FACTURE_ANNULEE',
        'Cette facture est annulée, aucun règlement ne peut y être rattaché.'
      )
    }

    const reglement = await tx.reglement.create({
      data: {
        factureId: input.factureId,
        montant: input.montant,
        modePaiement: input.modePaiement,
        dateReglement: input.dateReglement ? new Date(input.dateReglement) : undefined
      }
    })

    const montantVerseCumule =
      facture.reglements.reduce((total, r) => total + r.montant, 0) + input.montant
    const statutPaiement = determinerStatutPaiement(facture.montantTotal, montantVerseCumule)

    const factureMiseAJour = await tx.facture.update({
      where: { id: input.factureId },
      data: { statutPaiement },
      include: { reglements: true, lignes: true }
    })

    return { reglement, facture: factureMiseAJour }
  })
}

export async function listerCreances(db: PrismaClient, input: ListerCreancesInput = {}) {
  const factures = await db.facture.findMany({
    where: {
      clientId: input.clientId,
      statutPaiement: { in: ['EMISE', 'PARTIELLE'] }
    },
    include: { client: true, reglements: true }
  })

  const parClient = new Map<
    string,
    { clientId: string; nom: string; montantDu: number; factureLaPlusAncienne: Date }
  >()
  const maintenant = Date.now()

  for (const facture of factures) {
    const verse = facture.reglements.reduce((total, r) => total + r.montant, 0)
    const solde = facture.montantTotal - verse
    if (solde <= 0) continue

    const existant = parClient.get(facture.clientId)
    if (existant) {
      existant.montantDu += solde
      if (facture.dateFacture < existant.factureLaPlusAncienne)
        existant.factureLaPlusAncienne = facture.dateFacture
    } else {
      parClient.set(facture.clientId, {
        clientId: facture.clientId,
        nom: facture.client.nom,
        montantDu: solde,
        factureLaPlusAncienne: facture.dateFacture
      })
    }
  }

  return Array.from(parClient.values()).map(({ factureLaPlusAncienne, ...creance }) => ({
    ...creance,
    ancienneteJours: Math.floor(
      (maintenant - factureLaPlusAncienne.getTime()) / (1000 * 60 * 60 * 24)
    )
  }))
}
