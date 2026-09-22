import type { PrismaClient } from '@prisma/client'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { creerOuvrage, modifierOuvrage } from '../../src/main/services/ouvrages'
import { ErreurMetier } from '../../src/main/services/erreurs'
import { creerBaseDeTest, creerFixturesDeBase } from './testDb'

describe('services/ouvrages — RG-01', () => {
  let db: PrismaClient
  let fermer: () => Promise<void>
  let fournisseurId: string
  let utilisateurId: string

  beforeAll(async () => {
    const base = creerBaseDeTest()
    db = base.db
    fermer = base.fermer
    const fixtures = await creerFixturesDeBase(db)
    fournisseurId = fixtures.fournisseur.id
    utilisateurId = fixtures.utilisateur.id
  })

  afterAll(async () => {
    await fermer()
  })

  it('crée un ouvrage quand le prix de vente est supérieur au prix d’achat', async () => {
    const ouvrage = await creerOuvrage(db, {
      titre: 'Manuel de mathématiques CM2',
      prixAchat: 1000,
      prixVente: 1500,
      fournisseurId
    })

    expect(ouvrage.id).toBeTruthy()
    expect(ouvrage.prixVente).toBeGreaterThan(ouvrage.prixAchat)
  })

  it('rejette la création si le prix de vente est inférieur ou égal au prix d’achat', async () => {
    await expect(
      creerOuvrage(db, {
        titre: 'Manuel invalide',
        prixAchat: 1000,
        prixVente: 1000,
        fournisseurId
      })
    ).rejects.toThrow(ErreurMetier)
  })

  it('rejette la modification si elle rendrait le prix de vente incohérent', async () => {
    const ouvrage = await creerOuvrage(db, {
      titre: 'Manuel de français 6e',
      prixAchat: 1200,
      prixVente: 1800,
      fournisseurId
    })

    await expect(
      modifierOuvrage(db, utilisateurId, { id: ouvrage.id, prixAchat: 2000 })
    ).rejects.toThrow(ErreurMetier)
  })
})
