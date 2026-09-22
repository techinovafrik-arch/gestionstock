import type { PrismaClient } from '@prisma/client'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { creerOuvrage, modifierOuvrage } from '../../src/main/services/ouvrages'
import { enregistrerReception } from '../../src/main/services/stock'
import { annulerBonLivraison, creerBonLivraison } from '../../src/main/services/ventes'
import { creerFacture } from '../../src/main/services/facturation'
import { enregistrerVersement, genererEtatReversement } from '../../src/main/services/reversement'
import { ErreurMetier } from '../../src/main/services/erreurs'
import { creerBaseDeTest, creerFixturesDeBase } from './testDb'

describe('services/reversement — RG-08, RG-09, RG-10', () => {
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

  // Large plage couvrant la date réelle d'exécution des tests (les ventes sont horodatées "maintenant").
  const periodeDebut = '2020-01-01'
  const periodeFin = '2099-12-31'

  it('calcule le montant dû = Σ(quantité × prixAchat au moment de la vente), indépendant du prix de vente et de la remise (RG-08)', async () => {
    const ouvrage = await creerOuvrage(db, {
      titre: 'Manuel reversement A',
      prixAchat: 1000,
      prixVente: 1800,
      fournisseurId
    })
    await enregistrerReception(db, utilisateurId, {
      lignes: [{ ouvrageId: ouvrage.id, quantite: 100, prixAchat: 1000 }]
    })

    // Vente à un prix de vente remisé côté client : ne doit rien changer au montant dû Supernova.
    const bonLivraison = await creerBonLivraison(db, utilisateurId, {
      clientId,
      communeLivraisonId: communeId,
      lignes: [{ ouvrageId: ouvrage.id, quantite: 10, prixVenteUnitaire: 1500 }]
    })
    await creerFacture(db, { clientId, bonsLivraisonIds: [bonLivraison.id], remise: 2000 })

    const etat = await genererEtatReversement(db, { periodeDebut, periodeFin })
    const ligne = etat.lignes.find((l) => l.ouvrageId === ouvrage.id)

    expect(ligne).toBeDefined()
    expect(ligne!.prixAchatUnitaire).toBe(1000)
    expect(ligne!.quantiteVendue).toBe(10)
    expect(ligne!.montantDu).toBe(10 * 1000)
  })

  it('produit deux lignes distinctes si le prix d’achat a changé en cours de période pour le même ouvrage', async () => {
    const ouvrage = await creerOuvrage(db, {
      titre: 'Manuel reversement B',
      prixAchat: 800,
      prixVente: 1300,
      fournisseurId
    })
    await enregistrerReception(db, utilisateurId, {
      lignes: [{ ouvrageId: ouvrage.id, quantite: 50, prixAchat: 800 }]
    })
    const bl1 = await creerBonLivraison(db, utilisateurId, {
      clientId,
      communeLivraisonId: communeId,
      lignes: [{ ouvrageId: ouvrage.id, quantite: 5, prixVenteUnitaire: 1300 }]
    })

    // Nouvelle réception à un prix d'achat différent avant la seconde vente.
    await modifierOuvrage(db, utilisateurId, { id: ouvrage.id, prixVente: 1600 })
    await enregistrerReception(db, utilisateurId, {
      lignes: [{ ouvrageId: ouvrage.id, quantite: 50, prixAchat: 950 }]
    })
    const bl2 = await creerBonLivraison(db, utilisateurId, {
      clientId,
      communeLivraisonId: communeId,
      lignes: [{ ouvrageId: ouvrage.id, quantite: 5, prixVenteUnitaire: 1600 }]
    })

    const etat = await genererEtatReversement(db, { periodeDebut, periodeFin })
    const lignesOuvrage = etat.lignes.filter((l) => l.ouvrageId === ouvrage.id)

    expect(lignesOuvrage).toHaveLength(2)
    const montantTotalOuvrage = lignesOuvrage.reduce((t, l) => t + l.montantDu, 0)
    expect(montantTotalOuvrage).toBe(5 * 800 + 5 * 950)

    // Sanity : les deux BL existent bien (évite un faux positif si l'un des deux a échoué).
    expect(bl1.numeroBL).not.toBe(bl2.numeroBL)
  })

  it('exclut les mouvements hors-vente (réceptions, ajustements) du calcul (RG-09)', async () => {
    const ouvrage = await creerOuvrage(db, {
      titre: 'Manuel reversement C (jamais vendu)',
      prixAchat: 400,
      prixVente: 700,
      fournisseurId
    })
    await enregistrerReception(db, utilisateurId, {
      lignes: [{ ouvrageId: ouvrage.id, quantite: 30, prixAchat: 400 }]
    })

    const etat = await genererEtatReversement(db, { periodeDebut, periodeFin })
    const ligne = etat.lignes.find((l) => l.ouvrageId === ouvrage.id)

    expect(ligne).toBeUndefined()
  })

  it('verrouille les ventes de la période une fois le reversement clôturé (RG-10)', async () => {
    const ouvrage = await creerOuvrage(db, {
      titre: 'Manuel reversement D',
      prixAchat: 600,
      prixVente: 1000,
      fournisseurId
    })
    await enregistrerReception(db, utilisateurId, {
      lignes: [{ ouvrageId: ouvrage.id, quantite: 20, prixAchat: 600 }]
    })
    const bonLivraison = await creerBonLivraison(db, utilisateurId, {
      clientId,
      communeLivraisonId: communeId,
      lignes: [{ ouvrageId: ouvrage.id, quantite: 3, prixVenteUnitaire: 1000 }]
    })

    const etat = await genererEtatReversement(db, { periodeDebut, periodeFin })
    await expect(
      enregistrerVersement(db, {
        reversementId: etat.id,
        montantVerse: 0,
        dateVersement: '2030-06-01'
      })
    ).rejects.toThrow(ErreurMetier)

    const cloture = await enregistrerVersement(db, {
      reversementId: etat.id,
      montantVerse: etat.montantDu,
      dateVersement: '2030-06-01'
    })
    expect(cloture.statutReversement).toBe('CLOTURE')

    await expect(
      annulerBonLivraison(db, utilisateurId, { id: bonLivraison.id, motif: 'Test post-clôture' })
    ).rejects.toThrow(ErreurMetier)
  })
})
