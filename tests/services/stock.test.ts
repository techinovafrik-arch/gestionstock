import type { PrismaClient } from '@prisma/client'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  ajusterStock,
  consulterStock,
  enregistrerReception,
  historiqueMouvements
} from '../../src/main/services/stock'
import { creerOuvrage } from '../../src/main/services/ouvrages'
import { ErreurMetier } from '../../src/main/services/erreurs'
import { creerBaseDeTest, creerFixturesDeBase } from './testDb'

describe('services/stock — RG-03, RG-05, RG-12', () => {
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

  it('une réception augmente le stock disponible et trace un mouvement (RG-03, RG-05)', async () => {
    const ouvrage = await creerOuvrage(db, {
      titre: 'Manuel de sciences 5e',
      prixAchat: 800,
      prixVente: 1200,
      fournisseurId
    })

    const { mouvements } = await enregistrerReception(db, utilisateurId, {
      lignes: [{ ouvrageId: ouvrage.id, quantite: 50, prixAchat: 800 }]
    })

    const ouvrageMisAJour = await db.ouvrage.findUniqueOrThrow({ where: { id: ouvrage.id } })
    expect(ouvrageMisAJour.quantiteDisponible).toBe(50)
    expect(mouvements).toHaveLength(1)
    expect(mouvements[0]?.typeMouvement).toBe('RECEPTION')
    expect(mouvements[0]?.utilisateurId).toBe(utilisateurId)
    expect(mouvements[0]?.dateMouvement).toBeTruthy()
  })

  it('un ajustement exige un motif non vide', async () => {
    const ouvrage = await creerOuvrage(db, {
      titre: 'Manuel d’histoire-géo 4e',
      prixAchat: 900,
      prixVente: 1300,
      fournisseurId
    })

    await expect(
      ajusterStock(db, utilisateurId, {
        ouvrageId: ouvrage.id,
        quantite: 5,
        sens: 'PLUS',
        motif: '   '
      })
    ).rejects.toThrow(ErreurMetier)
  })

  it('un ajustement ne peut pas faire passer le stock sous zéro', async () => {
    const ouvrage = await creerOuvrage(db, {
      titre: 'Manuel de physique-chimie 3e',
      prixAchat: 1000,
      prixVente: 1500,
      fournisseurId
    })
    await enregistrerReception(db, utilisateurId, {
      lignes: [{ ouvrageId: ouvrage.id, quantite: 3, prixAchat: 1000 }]
    })

    await expect(
      ajusterStock(db, utilisateurId, {
        ouvrageId: ouvrage.id,
        quantite: 10,
        sens: 'MOINS',
        motif: 'Inventaire physique'
      })
    ).rejects.toThrow(ErreurMetier)
  })

  it('signale les ouvrages en alerte de seuil (RG-12)', async () => {
    const ouvrage = await creerOuvrage(db, {
      titre: 'Manuel d’anglais 5e',
      prixAchat: 700,
      prixVente: 1100,
      seuilAlerte: 10,
      fournisseurId
    })
    await enregistrerReception(db, utilisateurId, {
      lignes: [{ ouvrageId: ouvrage.id, quantite: 5, prixAchat: 700 }]
    })

    const lignes = await consulterStock(db, { recherche: ouvrage.titre })
    expect(lignes).toHaveLength(1)
    expect(lignes[0]?.enAlerte).toBe(true)
  })

  it('filtre l’historique des mouvements par type', async () => {
    const ouvrage = await creerOuvrage(db, {
      titre: 'Manuel de SVT 6e',
      prixAchat: 600,
      prixVente: 1000,
      fournisseurId
    })
    await enregistrerReception(db, utilisateurId, {
      lignes: [{ ouvrageId: ouvrage.id, quantite: 20, prixAchat: 600 }]
    })
    await ajusterStock(db, utilisateurId, {
      ouvrageId: ouvrage.id,
      quantite: 2,
      sens: 'MOINS',
      motif: 'Casse constatée'
    })

    const ajustements = await historiqueMouvements(db, {
      ouvrageId: ouvrage.id,
      typeMouvement: 'AJUSTEMENT'
    })
    expect(ajustements).toHaveLength(1)
    expect(ajustements[0]?.motif).toBe('Casse constatée')
  })
})
