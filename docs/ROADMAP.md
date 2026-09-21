# Plan de réalisation

Reprend et détaille, pour l'implémentation, le planning indicatif du dossier d'analyse (section 12). Chaque phase liste une définition de fini (DoD) vérifiable.

## Phase 0 — Cadrage technique (précède le développement)

- Validation de ce jeu de documents (`docs/*.md`) avec le porteur du projet.
- Initialisation du dépôt : scaffolding Electron + React + TypeScript + Vite, ESLint/Prettier, Prisma.
- Choix définitif de l'unité monétaire mineure de stockage (ex. FCFA entier, pas de centimes si non pertinent localement) — à trancher avant toute migration Prisma.

**DoD** : `npm run dev` lance une fenêtre Electron vide avec le renderer React ; `prisma migrate dev` exécute une migration initiale vide sans erreur.

## Phase 1 — Référentiels & stock (module 8.1, 8.2, 8.3)

- Modèle Prisma complet (`docs/DATA_MODEL.md`) + seed des 3 communes.
- CRUD ouvrages, clients, fournisseur, utilisateurs.
- Réception de stock, écran Stock (10.4), historique des mouvements.
- Services `stock.ts` couvrant RG-02, RG-03, RG-05, RG-12 avec tests unitaires.

**DoD** : on peut créer un ouvrage, enregistrer une réception, voir le stock augmenter, et un ajustement manuel fonctionne avec motif obligatoire.

## Phase 2 — Ventes & facturation (module 8.4, 8.5)

- Écran Nouveau bon de livraison (10.5) avec contrôle de stock (RG-04) et numérotation (RG-11).
- Génération PDF du bon de livraison.
- Écran Facturation (10.6) : regroupement de BL, calcul du total, remise, numérotation, PDF.

**DoD** : un parcours complet client → BL → facture → PDF fonctionne de bout en bout sans intervention manuelle sur les numéros ou les montants.

## Phase 3 — Règlements & reversement Supernova (module 8.6, 8.7)

- Écran Règlements (10.7) : enregistrement, règlements partiels, état des créances.
- Écran Reversement (10.8) : génération de l'état par période, calcul RG-08, clôture RG-10.

**DoD** : sur un jeu de données de test, l'état de reversement généré correspond exactement à `Σ (quantité vendue × prixAchat au moment de la vente)` sur la période, quelles que soient les remises clients appliquées.

## Phase 4 — Rapports, tableau de bord & administration (module 8.8, 8.9)

- Tableau de bord (10.1) avec les indicateurs clés.
- Rapports ventes/marge/créances, export PDF/CSV.
- Gestion utilisateurs et rôles, sauvegarde/restauration, journal d'audit.

**DoD** : sauvegarde automatique planifiée fonctionnelle et testée (arrêt/redémarrage de l'app), restauration testée sur une copie de la base.

## Phase 5 — Tests, recette, durcissement

- Couverture des tests unitaires sur `src/main/services` pour RG-01 à RG-14 (`docs/BUSINESS_RULES.md`).
- Recette fonctionnelle avec le gérant sur un scénario réel (un cycle complet réception → reversement).
- Revue de sécurité minimale : hash des mots de passe, protection contre suppression physique des documents émis (RG-13).

**DoD** : liste de recette signée off ; aucun test unitaire des règles de gestion en échec.

## Phase 6 — Packaging & mise en production

- Build `electron-builder` (installeur Windows `.exe`).
- Procédure d'installation et de première configuration documentée (création du premier compte administrateur, saisie de la fiche Supernova, seed des communes).
- Sauvegarde initiale réalisée juste après mise en production.

**DoD** : installation testée sur un poste Windows vierge (ou VM), premier lancement fonctionnel sans dépendance réseau.

## Suivi

L'avancement réel (phase courante, tâches en cours, blocages) est tenu dans `.claude/state.md`, pas dans ce fichier — ce document décrit le plan cible, pas son état d'exécution.
