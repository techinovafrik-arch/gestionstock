import type { PrismaClient } from '@prisma/client'
import type {
  CreerOuvrageInput,
  ListerOuvragesInput,
  ModifierOuvrageInput
} from '../../shared/types'
import { ErreurMetier } from './erreurs'
import { journaliser } from './journalAudit'

function verifierCoherencePrix(prixAchat: number, prixVente: number): void {
  // RG-01 : le prix de vente doit toujours être strictement supérieur au prix d'achat.
  if (prixVente <= prixAchat) {
    throw new ErreurMetier(
      'PRIX_VENTE_INVALIDE',
      "Le prix de vente doit être strictement supérieur au prix d'achat (RG-01)."
    )
  }
}

export async function creerOuvrage(db: PrismaClient, input: CreerOuvrageInput) {
  verifierCoherencePrix(input.prixAchat, input.prixVente)

  return db.ouvrage.create({
    data: {
      titre: input.titre,
      isbn: input.isbn,
      matiere: input.matiere,
      niveau: input.niveau,
      editeurOrigine: input.editeurOrigine,
      prixAchat: input.prixAchat,
      prixVente: input.prixVente,
      seuilAlerte: input.seuilAlerte ?? 0,
      fournisseurId: input.fournisseurId
    }
  })
}

export async function modifierOuvrage(
  db: PrismaClient,
  utilisateurId: string,
  input: ModifierOuvrageInput
) {
  const existant = await db.ouvrage.findUniqueOrThrow({ where: { id: input.id } })

  const prixAchat = input.prixAchat ?? existant.prixAchat
  const prixVente = input.prixVente ?? existant.prixVente
  verifierCoherencePrix(prixAchat, prixVente)

  const ouvrage = await db.ouvrage.update({
    where: { id: input.id },
    data: {
      titre: input.titre,
      isbn: input.isbn,
      matiere: input.matiere,
      niveau: input.niveau,
      editeurOrigine: input.editeurOrigine,
      prixAchat,
      prixVente,
      seuilAlerte: input.seuilAlerte,
      actif: input.actif
    }
  })

  // CLAUDE.md §6 : toute modification de prix est tracée.
  if (prixAchat !== existant.prixAchat || prixVente !== existant.prixVente) {
    await journaliser(db, {
      utilisateurId,
      action: 'MODIFICATION_PRIX',
      cible: `Ouvrage:${input.id}`,
      detail: `prixAchat ${existant.prixAchat}→${prixAchat}, prixVente ${existant.prixVente}→${prixVente}`
    })
  }

  return ouvrage
}

export async function listerOuvrages(db: PrismaClient, input: ListerOuvragesInput = {}) {
  return db.ouvrage.findMany({
    where: {
      actif: input.actifSeulement ? true : undefined,
      titre: input.recherche ? { contains: input.recherche } : undefined
    },
    orderBy: { titre: 'asc' }
  })
}
