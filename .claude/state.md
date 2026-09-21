# État du projet — Gestion Stock & Facturation (Distribution Supernova)

> À tenir à jour au fil du développement. Ce fichier répond à la question « où en est-on, là, maintenant ? ». Les décisions et leur justification vont dans `memory.md`, pas ici.

## Phase courante

- **Phase** : Phase 0 — Cadrage technique
- **Statut** : documentation de cadrage livrée (README, CLAUDE.md, docs/*, présent fichier) ; scaffolding technique non démarré

## Dernière action réalisée

- Génération du jeu complet de documentation projet à partir du `Dossier d'analyse — Gestion de stock et facturation (Distribution Supernova)` v1.0 (entrepôt unique, corrigé), en respectant la convention TIAF (`CLAUDE.md` projet + `.claude/`).

## Prochaine action

- Initialiser le dépôt de code (scaffolding Electron + React + TypeScript + Vite + Prisma), conformément à `docs/ARCHITECTURE.md` §4.
- Trancher l'unité monétaire mineure de stockage avant la première migration Prisma (voir `docs/ROADMAP.md`, Phase 0).

## Blocages / décisions en attente

- Aucun blocage technique identifié à ce stade.
- Décision en attente côté métier : confirmer avec le gérant la périodicité exacte de reversement à Supernova (hebdomadaire ou mensuelle) avant de fixer la valeur par défaut dans `Administration` (module 8.9).

## Historique des phases

| Phase | Statut | Date |
|---|---|---|
| Phase 0 — Cadrage technique | En cours | — |
| Phase 1 — Référentiels & stock | Non démarrée | — |
| Phase 2 — Ventes & facturation | Non démarrée | — |
| Phase 3 — Règlements & reversement | Non démarrée | — |
| Phase 4 — Rapports & administration | Non démarrée | — |
| Phase 5 — Tests & recette | Non démarrée | — |
| Phase 6 — Packaging & mise en production | Non démarrée | — |
