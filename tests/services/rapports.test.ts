import type { PrismaClient } from '@prisma/client'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { creerOuvrage } from '../../src/main/services/ouvrages'
import { enregistrerReception } from '../../src/main/services/stock'
import { creerBonLivraison } from '../../src/main/services/ventes'
import { rapportMarge, rapportVentes } from '../../src/main/services/rapports'
import { creerBaseDeTest, creerFixturesDeBase } from './testDb'

describe('services/rapports — module 8.8', () => {
  let db: PrismaClient
  let fermer: () => Promise<void>
  let fournisseurId: string
  let communeId: string
  let clientId: string
  let utilisateurId: string

  const periodeDebut = '2020-01-01'
  const periodeFin = '2099-12-31'

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

  it('regroupe le rapport des ventes par ouvrage', async () => {
    const ouvrage = await creerOuvrage(db, {
      titre: 'Manuel rapport ventes',
      prixAchat: 500,
      prixVente: 900,
      fournisseurId
    })
    await enregistrerReception(db, utilisateurId, {
      lignes: [{ ouvrageId: ouvrage.id, quantite: 20, prixAchat: 500 }]
    })
    await creerBonLivraison(db, utilisateurId, {
      clientId,
      communeLivraisonId: communeId,
      lignes: [{ ouvrageId: ouvrage.id, quantite: 3, prixVenteUnitaire: 900 }]
    })
    await creerBonLivraison(db, utilisateurId, {
      clientId,
      communeLivraisonId: communeId,
      lignes: [{ ouvrageId: ouvrage.id, quantite: 2, prixVenteUnitaire: 900 }]
    })

    const rapport = await rapportVentes(db, { periodeDebut, periodeFin, groupePar: 'ouvrage' })
    const ligne = rapport.find((l) => l.cle === ouvrage.titre)

    expect(ligne).toBeDefined()
    expect(ligne!.quantite).toBe(5)
    expect(ligne!.montant).toBe(5 * 900)
  })

  it('calcule la marge par ouvrage à partir des prix figés (achat et vente)', async () => {
    const ouvrage = await creerOuvrage(db, {
      titre: 'Manuel rapport marge',
      prixAchat: 700,
      prixVente: 1200,
      fournisseurId
    })
    await enregistrerReception(db, utilisateurId, {
      lignes: [{ ouvrageId: ouvrage.id, quantite: 10, prixAchat: 700 }]
    })
    await creerBonLivraison(db, utilisateurId, {
      clientId,
      communeLivraisonId: communeId,
      lignes: [{ ouvrageId: ouvrage.id, quantite: 4, prixVenteUnitaire: 1200 }]
    })

    const rapport = await rapportMarge(db, { periodeDebut, periodeFin })
    const ligne = rapport.find((l) => l.ouvrageId === ouvrage.id)

    expect(ligne).toBeDefined()
    expect(ligne!.quantiteVendue).toBe(4)
    expect(ligne!.margeTotale).toBe(4 * (1200 - 700))
    expect(ligne!.margeUnitaire).toBe(1200 - 700)
  })
})
