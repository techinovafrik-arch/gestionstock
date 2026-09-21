# État du projet — Gestion Stock & Facturation (Distribution Supernova)

> À tenir à jour au fil du développement. Ce fichier répond à la question « où en est-on, là, maintenant ? ». Les décisions et leur justification vont dans `memory.md`, pas ici.

## Phase courante

- **Phase** : Phase 1 — Référentiels & stock
- **Statut** : **DoD atteint**. Modèle de données complet, services RG-01/02/03/05/12 testés, IPC + UI fonctionnels pour Ouvrages/Réceptions/Stock.

## Dernière action réalisée

- Modèle Prisma complet (toutes les entités de `docs/DATA_MODEL.md`) + seed (3 communes, fournisseur Supernova, utilisateur admin).
- Services `ouvrages.ts` (RG-01) et `stock.ts` (réception RG-03, ajustement avec motif obligatoire RG-05, seuil d'alerte RG-12) + `referentiels.ts` (communes, clients, fournisseurs, utilisateurs) — 8 tests unitaires Vitest passent, contre une base SQLite de test isolée migrée avec les vraies migrations Prisma.
- Couche IPC (`src/main/ipc/*`) + `preload.ts` typé contre `src/shared/api.ts` (le contrat renderer ↔ main est vérifié au typecheck).
- Écrans React : Ouvrages (10.2, création + liste), Réceptions (10.3, formulaire multi-lignes), Stock (10.4, liste + ajustement + historique). Navigation par onglets simple dans `App.tsx`.
- Vérification de bout en bout : capture d'écran de l'app réellement lancée (fenêtre + écran Ouvrages) et rejeu complet du parcours métier (créer ouvrage → réception +100 → ajustement -5 → stock final 95) contre la base de développement réelle.
- Lacune de contrat comblée : `referentiels:listerFournisseurs` ajouté à `docs/API_CONTRACT.md` (creerOuvrage exigeait déjà `fournisseurId` sans canal pour le lister).
- 6 commits Phase 1 (modèle, services, IPC, écrans) — non encore poussés sur `origin/master` au moment de la rédaction de ce fichier.

## Prochaine action

- Compléter le CRUD ouvrages (modification/désactivation depuis l'écran, pas seulement création) si besoin avant la Phase 2.
- Phase 2 (`docs/ROADMAP.md`) : écran Nouveau bon de livraison (10.5) avec contrôle de stock RG-04 et numérotation RG-11, génération PDF, écran Facturation (10.6).
- Écrans Clients/Utilisateurs (services et IPC déjà prêts côté référentiels) restent à construire quand un module en aura l'usage direct (Ventes pour Clients, Administration pour Utilisateurs).

## Blocages / décisions en attente

- Aucun blocage technique.
- Décision en attente côté métier : périodicité exacte de reversement à Supernova (hebdomadaire ou mensuelle) — à confirmer avant Phase 3.
- Risque connu et accepté : vulnérabilités npm high severity résiduelles, dev-only, dans des dépendances transitives de la CLI Prisma (support MySQL non utilisé) — voir `npm audit`.
- Point de vigilance Phase 4 : retirer/revoir le seed automatique du compte `admin` une fois l'authentification réelle implémentée (voir `.claude/memory.md`).

## Historique des phases

| Phase | Statut | Date |
|---|---|---|
| Phase 0 — Cadrage technique | Terminée | 2026-09-21 |
| Phase 1 — Référentiels & stock | **DoD atteint** | 2026-09-21 |
| Phase 2 — Ventes & facturation | Non démarrée | — |
| Phase 3 — Règlements & reversement | Non démarrée | — |
| Phase 4 — Rapports & administration | Non démarrée | — |
| Phase 5 — Tests & recette | Non démarrée | — |
| Phase 6 — Packaging & mise en production | Non démarrée | — |
