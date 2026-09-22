import type { PrismaClient } from '@prisma/client'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { creerOuvrage } from '../../src/main/services/ouvrages'
import { enregistrerReception } from '../../src/main/services/stock'
import { annulerBonLivraison, creerBonLivraison } from '../../src/main/services/ventes'
import { ErreurMetier } from '../../src/main/services/erreurs'
import { creerBaseDeTest, creerFixturesDeBase } from './testDb'

describe('services/ventes — RG-04, RG-06, RG-11, RG-13', () => {
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

  it('décrémente le stock, trace le mouvement et numérote le BL (RG-04, RG-05, RG-06, RG-11)', async () => {
    const ouvrage = await creerOuvrage(db, {
      titre: 'Manuel de géographie 5e',
      prixAchat: 700,
      prixVente: 1200,
      fournisseurId
    })
    await enregistrerReception(db, utilisateurId, {
      lignes: [{ ouvrageId: ouvrage.id, quantite: 20, prixAchat: 700 }]
    })

    const bonLivraison = await creerBonLivraison(db, utilisateurId, {
      clientId,
      communeLivraisonId: communeId,
      lignes: [{ ouvrageId: ouvrage.id, quantite: 5, prixVenteUnitaire: 1200 }]
    })

    expect(bonLivraison.numeroBL).toMatch(/^BL-\d{4}-\d{6}$/)
    expect(bonLivraison.statutBL).toBe('EMIS')

    const ouvrageMisAJour = await db.ouvrage.findUniqueOrThrow({ where: { id: ouvrage.id } })
    expect(ouvrageMisAJour.quantiteDisponible).toBe(15)
  })

  it('rejette la vente si le stock est insuffisant, sans créer de BL ni de mouvement (RG-04)', async () => {
    const ouvrage = await creerOuvrage(db, {
      titre: 'Manuel de biologie 3e',
      prixAchat: 900,
      prixVente: 1400,
      fournisseurId
    })
    await enregistrerReception(db, utilisateurId, {
      lignes: [{ ouvrageId: ouvrage.id, quantite: 3, prixAchat: 900 }]
    })

    await expect(
      creerBonLivraison(db, utilisateurId, {
        clientId,
        communeLivraisonId: communeId,
        lignes: [{ ouvrageId: ouvrage.id, quantite: 10, prixVenteUnitaire: 1400 }]
      })
    ).rejects.toThrow(ErreurMetier)

    const ouvrageInchange = await db.ouvrage.findUniqueOrThrow({ where: { id: ouvrage.id } })
    expect(ouvrageInchange.quantiteDisponible).toBe(3)
    const mouvements = await db.mouvementStock.findMany({
      where: { ouvrageId: ouvrage.id, typeMouvement: 'VENTE' }
    })
    expect(mouvements).toHaveLength(0)
  })

  it('attribue des numéros de BL distincts à des créations concurrentes (RG-11)', async () => {
    const ouvrage = await creerOuvrage(db, {
      titre: 'Manuel de technologie 4e',
      prixAchat: 500,
      prixVente: 900,
      fournisseurId
    })
    await enregistrerReception(db, utilisateurId, {
      lignes: [{ ouvrageId: ouvrage.id, quantite: 50, prixAchat: 500 }]
    })

    const [bl1, bl2] = await Promise.all([
      creerBonLivraison(db, utilisateurId, {
        clientId,
        communeLivraisonId: communeId,
        lignes: [{ ouvrageId: ouvrage.id, quantite: 1, prixVenteUnitaire: 900 }]
      }),
      creerBonLivraison(db, utilisateurId, {
        clientId,
        communeLivraisonId: communeId,
        lignes: [{ ouvrageId: ouvrage.id, quantite: 1, prixVenteUnitaire: 900 }]
      })
    ])

    expect(bl1.numeroBL).not.toBe(bl2.numeroBL)
  })

  it('une annulation restitue le stock et exige un motif (RG-13)', async () => {
    const ouvrage = await creerOuvrage(db, {
      titre: 'Manuel de philosophie Tle',
      prixAchat: 1100,
      prixVente: 1700,
      fournisseurId
    })
    await enregistrerReception(db, utilisateurId, {
      lignes: [{ ouvrageId: ouvrage.id, quantite: 10, prixAchat: 1100 }]
    })

    const bonLivraison = await creerBonLivraison(db, utilisateurId, {
      clientId,
      communeLivraisonId: communeId,
      lignes: [{ ouvrageId: ouvrage.id, quantite: 4, prixVenteUnitaire: 1700 }]
    })

    await expect(
      annulerBonLivraison(db, utilisateurId, { id: bonLivraison.id, motif: '' })
    ).rejects.toThrow(ErreurMetier)

    const annule = await annulerBonLivraison(db, utilisateurId, {
      id: bonLivraison.id,
      motif: 'Erreur de saisie client'
    })
    expect(annule.statutBL).toBe('ANNULE')

    const ouvrageRestitue = await db.ouvrage.findUniqueOrThrow({ where: { id: ouvrage.id } })
    expect(ouvrageRestitue.quantiteDisponible).toBe(10)
  })
})
