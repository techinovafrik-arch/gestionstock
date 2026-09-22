import type { PrismaClient } from '@prisma/client'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { connexion, deconnexion, sessionCourante } from '../../src/main/services/auth'
import { creerUtilisateur } from '../../src/main/services/administration'
import { hashMotDePasse } from '../../src/main/services/motDePasse'
import { ErreurMetier } from '../../src/main/services/erreurs'
import { creerBaseDeTest } from './testDb'

describe('services/auth — connexion, session, contrôle d’accès', () => {
  let db: PrismaClient
  let fermer: () => Promise<void>
  let administrateurId: string

  beforeAll(async () => {
    const base = creerBaseDeTest()
    db = base.db
    fermer = base.fermer

    const administrateur = await db.utilisateur.create({
      data: {
        nom: 'Admin Test',
        identifiant: 'admin-test',
        motDePasseHash: hashMotDePasse('motdepasse123'),
        role: 'ADMINISTRATEUR'
      }
    })
    administrateurId = administrateur.id

    await db.utilisateur.create({
      data: {
        nom: 'Opérateur Test',
        identifiant: 'operateur-test',
        motDePasseHash: hashMotDePasse('motdepasse123'),
        role: 'OPERATEUR'
      }
    })

    await db.utilisateur.create({
      data: {
        nom: 'Compte inactif',
        identifiant: 'inactif-test',
        motDePasseHash: hashMotDePasse('motdepasse123'),
        role: 'OPERATEUR',
        actif: false
      }
    })
  })

  afterAll(async () => {
    await fermer()
  })

  it('rejette un mot de passe incorrect', async () => {
    await expect(
      connexion(db, { identifiant: 'admin-test', motDePasse: 'mauvais' })
    ).rejects.toThrow(ErreurMetier)
  })

  it('rejette un compte inactif même avec le bon mot de passe', async () => {
    await expect(
      connexion(db, { identifiant: 'inactif-test', motDePasse: 'motdepasse123' })
    ).rejects.toThrow(ErreurMetier)
  })

  it('connecte un utilisateur valide, expose la session, puis la ferme à la déconnexion', async () => {
    const resultat = await connexion(db, { identifiant: 'admin-test', motDePasse: 'motdepasse123' })
    expect(resultat.utilisateur.identifiant).toBe('admin-test')
    expect('motDePasseHash' in resultat.utilisateur).toBe(false)
    expect(resultat.token).toBeTruthy()

    const courante = await sessionCourante(db)
    expect(courante?.identifiant).toBe('admin-test')

    deconnexion()
    expect(await sessionCourante(db)).toBeNull()
  })

  it('seul un administrateur peut créer un compte utilisateur', async () => {
    await connexion(db, { identifiant: 'operateur-test', motDePasse: 'motdepasse123' })
    const operateur = await db.utilisateur.findUniqueOrThrow({
      where: { identifiant: 'operateur-test' }
    })

    await expect(
      creerUtilisateur(db, operateur.id, {
        nom: 'Nouveau',
        identifiant: 'nouveau-test',
        motDePasse: 'abcdef',
        role: 'OPERATEUR'
      })
    ).rejects.toThrow(ErreurMetier)

    const cree = await creerUtilisateur(db, administrateurId, {
      nom: 'Nouveau',
      identifiant: 'nouveau-test',
      motDePasse: 'abcdef',
      role: 'OPERATEUR'
    })
    expect(cree.identifiant).toBe('nouveau-test')
    deconnexion()
  })
})
