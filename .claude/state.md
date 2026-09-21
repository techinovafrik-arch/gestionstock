# État du projet — Gestion Stock & Facturation (Distribution Supernova)

> À tenir à jour au fil du développement. Ce fichier répond à la question « où en est-on, là, maintenant ? ». Les décisions et leur justification vont dans `memory.md`, pas ici.

## Phase courante

- **Phase** : Phase 1 — Référentiels & stock (démarrage)
- **Statut** : Phase 0 (cadrage technique) terminée — scaffolding Electron + React/TS + Vite + Prisma opérationnel et vérifié.

## Dernière action réalisée

- Scaffolding technique complet : shell Electron (main/preload minimal), renderer React vide, TypeScript strict, ESLint (flat config) + Prettier, `electron-vite` comme bundler. Vérifié par lancement réel : `npm run dev` ouvre une fenêtre Electron avec le renderer React (titre confirmé sur le bureau Windows).
- Initialisation Prisma : schéma vide (`prisma/schema.prisma`, datasource SQLite sans modèle métier), `prisma.config.ts` avec driver adapter (`@prisma/adapter-better-sqlite3`, imposé par Prisma 7 — voir `.claude/memory.md`). Vérifié : `npx prisma migrate dev` s'exécute sans erreur.
- Décision actée : unité monétaire = FCFA entier (voir `.claude/memory.md` et `docs/DATA_MODEL.md`).
- Deux commits Phase 0 poussés sur `origin/master`.

## Prochaine action

- Phase 1 (`docs/ROADMAP.md`) : écrire le modèle Prisma complet à partir de `docs/DATA_MODEL.md`, seed des 3 communes, CRUD ouvrages/clients/fournisseur/utilisateurs, écran Stock (10.4), service `stock.ts` couvrant RG-02, RG-03, RG-05, RG-12 avec tests unitaires Vitest.
- Point d'attention Phase 1 : instancier `PrismaClient` avec l'adapter (`new PrismaBetterSqlite3({ url }) ` puis `new PrismaClient({ adapter })`) dans `src/main/data` — ne pas utiliser le pattern Prisma < 7.

## Blocages / décisions en attente

- Aucun blocage technique identifié à ce stade.
- Décision en attente côté métier : confirmer avec le gérant la périodicité exacte de reversement à Supernova (hebdomadaire ou mensuelle) avant de fixer la valeur par défaut dans `Administration` (module 8.9).
- Risque connu et accepté : quelques vulnérabilités npm high severity résiduelles sur des dépendances transitives *dev-only* de la CLI Prisma (support MySQL non utilisé, cf. `npm audit`) — pas d'action requise, l'app ne les expose pas en production.

## Historique des phases

| Phase | Statut | Date |
|---|---|---|
| Phase 0 — Cadrage technique | **Terminée** | 2026-09-21 |
| Phase 1 — Référentiels & stock | En cours | — |
| Phase 2 — Ventes & facturation | Non démarrée | — |
| Phase 3 — Règlements & reversement | Non démarrée | — |
| Phase 4 — Rapports & administration | Non démarrée | — |
| Phase 5 — Tests & recette | Non démarrée | — |
| Phase 6 — Packaging & mise en production | Non démarrée | — |
