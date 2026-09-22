# État du projet — Gestion Stock & Facturation (Distribution Supernova)

> À tenir à jour au fil du développement. Ce fichier répond à la question « où en est-on, là, maintenant ? ». Les décisions et leur justification vont dans `memory.md`, pas ici.

## Phase courante

- **Phase** : Phase 4 — Rapports & administration
- **Statut** : **Terminée**. Authentification, journal d'audit, sauvegarde/restauration, rapports (ventes/marge), exports CSV/PDF et tableau de bord sont tous implémentés et vérifiés.

## Dernière action réalisée

- `services/rapports.ts` (ventes par ouvrage/commune/jour, marge par ouvrage), export CSV et PDF (`administration`/`rapports:exporter`), écran **Tableau de bord** (10.1, devenu l'écran d'accueil par défaut) et écran **Rapports** (10.9).
- 36/36 tests passent. Vérifié de bout en bout sous Electron : calculs exacts, CSV et PDF générés avec succès.
- Clarification de diagnostic importante actée dans `.claude/memory.md` : le « faux plantage silencieux » observé pendant les tests de génération PDF était un artefact des scripts de smoke test autonomes (`window-all-closed` sans fenêtre principale), pas un bug de `genererPdf.ts` — non reproductible dans la vraie application.

## Prochaine action

Toutes les fonctionnalités métier du dossier d'analyse (modules 8.1 à 8.9) sont implémentées. Reste :

- **Phase 5 — Tests & recette** (`docs/ROADMAP.md`) : couverture de tests plus systématique sur `src/main/services` pour RG-01 à RG-14 (actuellement bien couvert mais pas revu ligne à ligne contre le tableau `docs/BUSINESS_RULES.md`), recette fonctionnelle avec le gérant, revue de sécurité minimale.
- **Phase 6 — Packaging & mise en production** : build `electron-builder`, procédure de première installation (changer le mot de passe admin par défaut !), sauvegarde initiale.
- Compléments d'UI non bloquants laissés de côté par choix de scope : modification/désactivation d'un ouvrage depuis l'écran Ouvrages (le service existe), marquer un BL livré / l'annuler depuis l'écran Bon de livraison (les services existent).

## Blocages / décisions en attente

- Aucun blocage technique.
- Décision en attente côté métier : périodicité exacte de reversement à Supernova (hebdomadaire ou mensuelle) — non bloquante techniquement.
- Risque connu et accepté : vulnérabilités npm high severity résiduelles, dev-only, dans des dépendances transitives de la CLI Prisma.
- **Avant mise en production (Phase 6)** : changer le mot de passe du compte `admin` seedé, ou forcer son changement au premier lancement.
- **Rappel opérationnel permanent** : après tout `npm install` touchant `better-sqlite3`, recompiler l'ABI native selon l'usage (`predev`/`prebuild`/`pretest` s'en chargent automatiquement).

## Historique des phases

| Phase | Statut | Date |
|---|---|---|
| Phase 0 — Cadrage technique | Terminée | 2026-09-21 |
| Phase 1 — Référentiels & stock | DoD atteint | 2026-09-21 |
| Phase 2 — Ventes & facturation | DoD atteint | 2026-09-22 |
| Phase 3 — Règlements & reversement | DoD atteint | 2026-09-22 |
| Phase 4 — Rapports & administration | **Terminée** | 2026-09-22 |
| Phase 5 — Tests & recette | Non démarrée | — |
| Phase 6 — Packaging & mise en production | Non démarrée | — |
