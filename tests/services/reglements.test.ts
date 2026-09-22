import type { PrismaClient } from '@prisma/client'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { creerOuvrage } from '../../src/main/services/ouvrages'
import { enregistrerReception } from '../../src/main/services/stock'
import { creerBonLivraison } from '../../src/main/services/ventes'
import { creerFacture } from '../../src/main/services/facturation'
import { enregistrerReglement, listerCreances } from '../../src/main/services/reglements'
import { ErreurMetier } from '../../src/main/services/erreurs'
import { creerBaseDeTest, creerFixturesDeBase } from './testDb'

describe('services/reglements — module 8.6', () => {
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

  async function creerFactureDeTest(montantParUnite: number, quantite: number) {
    const ouvrage = await creerOuvrage(db, {
      titre: `Manuel règlement ${Date.now()}-${Math.random()}`,
      prixAchat: 500,
      prixVente: montantParUnite,
      fournisseurId
    })
    await enregistrerReception(db, utilisateurId, {
      lignes: [{ ouvrageId: ouvrage.id, quantite: 100, prixAchat: 500 }]
    })
    const bonLivraison = await creerBonLivraison(db, utilisateurId, {
      clientId,
      communeLivraisonId: communeId,
      lignes: [{ ouvrageId: ouvrage.id, quantite, prixVenteUnitaire: montantParUnite }]
    })
    return creerFacture(db, { clientId, bonsLivraisonIds: [bonLivraison.id] })
  }

  it('un règlement partiel passe la facture en PARTIELLE, un règlement complémentaire la passe en REGLEE', async () => {
    const facture = await creerFactureDeTest(1000, 10) // montantTotal = 10 000

    const { facture: apresPremier } = await enregistrerReglement(db, {
      factureId: facture.id,
      montant: 4000,
      modePaiement: 'especes'
    })
    expect(apresPremier.statutPaiement).toBe('PARTIELLE')

    const { facture: apresSecond } = await enregistrerReglement(db, {
      factureId: facture.id,
      montant: 6000,
      modePaiement: 'mobile_money'
    })
    expect(apresSecond.statutPaiement).toBe('REGLEE')
  })

  it('rejette un montant de règlement négatif ou nul', async () => {
    const facture = await creerFactureDeTest(1200, 5)
    await expect(
      enregistrerReglement(db, { factureId: facture.id, montant: 0, modePaiement: 'especes' })
    ).rejects.toThrow(ErreurMetier)
  })

  it('liste les créances avec le solde restant dû', async () => {
    const facture = await creerFactureDeTest(2000, 5) // montantTotal = 10 000
    await enregistrerReglement(db, {
      factureId: facture.id,
      montant: 3000,
      modePaiement: 'especes'
    })

    const creances = await listerCreances(db, { clientId })
    const creanceClient = creances.find((c) => c.clientId === clientId)

    expect(creanceClient).toBeDefined()
    expect(creanceClient!.montantDu).toBeGreaterThanOrEqual(7000)
  })
})
