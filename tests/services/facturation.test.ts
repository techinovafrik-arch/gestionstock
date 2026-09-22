import type { PrismaClient } from '@prisma/client'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { creerOuvrage } from '../../src/main/services/ouvrages'
import { enregistrerReception } from '../../src/main/services/stock'
import { annulerBonLivraison, creerBonLivraison } from '../../src/main/services/ventes'
import { creerFacture } from '../../src/main/services/facturation'
import { ErreurMetier } from '../../src/main/services/erreurs'
import { creerBaseDeTest, creerFixturesDeBase } from './testDb'

describe('services/facturation — RG-07, RG-11, RG-13', () => {
  let db: PrismaClient
  let fermer: () => Promise<void>
  let fournisseurId: string
  let communeId: string
  let clientId: string
  let utilisateurId: string

  beforeAll(async () => {
    const base = creerBaseDeTest()
    db = base.db
    fermer = base.fermer
    const fixtures = await creerFixturesDeBase(db)
    fournisseurId = fixtures.fournisseur.id
    communeId = fixtures.commune.id
    clientId = fixtures.client.id
    utilisateurId = fixtures.utilisateur.id
  })

  afterAll(async () => {
    await fermer()
  })

  it('regroupe deux BL du même client, calcule le total et applique la remise (RG-07, RG-11)', async () => {
    const ouvrage = await creerOuvrage(db, {
      titre: 'Manuel de chimie 2nde',
      prixAchat: 800,
      prixVente: 1300,
      fournisseurId
    })
    await enregistrerReception(db, utilisateurId, {
      lignes: [{ ouvrageId: ouvrage.id, quantite: 30, prixAchat: 800 }]
    })

    const bl1 = await creerBonLivraison(db, utilisateurId, {
      clientId,
      communeLivraisonId: communeId,
      lignes: [{ ouvrageId: ouvrage.id, quantite: 3, prixVenteUnitaire: 1300 }]
    })
    const bl2 = await creerBonLivraison(db, utilisateurId, {
      clientId,
      communeLivraisonId: communeId,
      lignes: [{ ouvrageId: ouvrage.id, quantite: 2, prixVenteUnitaire: 1300 }]
    })

    const facture = await creerFacture(db, {
      clientId,
      bonsLivraisonIds: [bl1.id, bl2.id],
      remise: 500
    })

    expect(facture.numeroFacture).toMatch(/^FAC-\d{4}-\d{6}$/)
    expect(facture.montantHT).toBe(3 * 1300 + 2 * 1300)
    expect(facture.montantTotal).toBe(facture.montantHT - 500)
    expect(facture.lignes).toHaveLength(2)

    const bl1MisAJour = await db.bonLivraison.findUniqueOrThrow({ where: { id: bl1.id } })
    expect(bl1MisAJour.statutBL).toBe('FACTURE')
  })

  it('rejette la facturation d’un BL déjà facturé', async () => {
    const ouvrage = await creerOuvrage(db, {
      titre: 'Manuel d’économie Tle',
      prixAchat: 1000,
      prixVente: 1600,
      fournisseurId
    })
    await enregistrerReception(db, utilisateurId, {
      lignes: [{ ouvrageId: ouvrage.id, quantite: 10, prixAchat: 1000 }]
    })

    const bonLivraison = await creerBonLivraison(db, utilisateurId, {
      clientId,
      communeLivraisonId: communeId,
      lignes: [{ ouvrageId: ouvrage.id, quantite: 2, prixVenteUnitaire: 1600 }]
    })

    await creerFacture(db, { clientId, bonsLivraisonIds: [bonLivraison.id] })

    await expect(
      creerFacture(db, { clientId, bonsLivraisonIds: [bonLivraison.id] })
    ).rejects.toThrow(ErreurMetier)
  })

  it('empêche d’annuler un bon de livraison déjà facturé (RG-13)', async () => {
    const ouvrage = await creerOuvrage(db, {
      titre: 'Manuel d’allemand 4e',
      prixAchat: 600,
      prixVente: 1000,
      fournisseurId
    })
    await enregistrerReception(db, utilisateurId, {
      lignes: [{ ouvrageId: ouvrage.id, quantite: 10, prixAchat: 600 }]
    })

    const bonLivraison = await creerBonLivraison(db, utilisateurId, {
      clientId,
      communeLivraisonId: communeId,
      lignes: [{ ouvrageId: ouvrage.id, quantite: 2, prixVenteUnitaire: 1000 }]
    })
    await creerFacture(db, { clientId, bonsLivraisonIds: [bonLivraison.id] })

    await expect(
      annulerBonLivraison(db, utilisateurId, {
        id: bonLivraison.id,
        motif: 'Tentative après facturation'
      })
    ).rejects.toThrow(ErreurMetier)
  })
})
