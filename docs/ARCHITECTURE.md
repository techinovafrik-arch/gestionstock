# Architecture technique

## 1. Vue d'ensemble

Application **desktop, locale, mono-poste**, packagée avec **Electron**, sans dépendance à un serveur distant. L'interface est développée entièrement en **React** (TypeScript). La logique métier et l'accès aux données vivent dans le processus principal Electron (Node.js), et communiquent avec l'interface via des canaux **IPC** typés — jamais via une API HTTP exposée.

```
┌───────────────────────────────────────────────────────────┐
│                        Application Electron                │
│                                                             │
│  ┌───────────────────────┐        IPC        ┌──────────┐ │
│  │   Renderer (React)     │ ◄───────────────► │   Main   │ │
│  │   - Écrans (10.x)      │   invoke/handle   │  process │ │
│  │   - Composants UI      │                   │ (Node.js)│ │
│  │   - État local (UI)    │                   └────┬─────┘ │
│  └───────────────────────┘                        │       │
│                                                     ▼       │
│                                    ┌─────────────────────┐ │
│                                    │  Couche services      │ │
│                                    │  (règles de gestion)  │ │
│                                    └──────────┬────────────┘│
│                                               ▼              │
│                                    ┌─────────────────────┐ │
│                                    │  Prisma ORM           │ │
│                                    └──────────┬────────────┘│
│                                               ▼              │
│                                    ┌─────────────────────┐ │
│                                    │  SQLite (fichier)     │ │
│                                    └─────────────────────┘ │
│                                                             │
│                                    ┌─────────────────────┐ │
│                                    │  Génération PDF        │ │
│                                    │  (gabarits HTML/CSS)   │ │
│                                    └─────────────────────┘ │
└───────────────────────────────────────────────────────────┘
```

## 2. Pourquoi cette architecture

- **React** : cohérence avec l'écosystème JS/TS déjà maîtrisé sur les autres projets TIAF (Next.js/NestJS) ; large écosystème de composants, productivité élevée pour des écrans de gestion (tableaux, formulaires).
- **Electron** : packaging en application Windows autonome (`.exe`), fonctionnement 100 % hors-ligne, pas de navigateur ni d'URL à gérer par l'utilisateur final.
- **Node.js/TypeScript côté `main`** : partage du même langage que le renderer (un seul écosystème à maintenir pour un développeur solo), accès direct au système de fichiers pour la base SQLite et l'impression PDF.
- **Prisma + SQLite** : SQLite est un fichier unique — sauvegarde = copie de fichier, pas de serveur de base à administrer. Prisma fournit des migrations versionnées et un chemin d'évolution propre vers PostgreSQL si le projet doit devenir multi-poste (voir §6).
- **Pas d'API REST/HTTP** : inutile pour une application mono-poste sans client distant ; les canaux IPC évitent la complexité (authentification réseau, CORS, sérialisation HTTP) pour un gain nul dans ce contexte.

## 3. Architecture logique en couches

1. **Présentation (`src/renderer`)** — composants React, écrans (voir `docs/UI_SCREENS.md`), état local d'interface (formulaires, filtres). Ne contient **aucune** règle de gestion. Appelle exclusivement les fonctions exposées par le pont IPC (`src/renderer/api/*`, elles-mêmes définies par `docs/API_CONTRACT.md`).
2. **Services métier (`src/main/services`)** — implémente les règles de gestion RG-01 à RG-14 (`docs/BUSINESS_RULES.md`) : calcul du stock disponible, contrôle avant vente, calcul du reversement, numérotation des documents, calcul de marge. C'est la couche à tester en priorité (tests unitaires Vitest/Jest).
3. **Accès aux données (`src/main/data`)** — gérée par Prisma, responsable de la lecture/écriture dans la base SQLite selon le schéma défini dans `docs/DATA_MODEL.md`. Aucune requête Prisma directe depuis les handlers IPC ou depuis le renderer.
4. **Impression / export (`src/main/documents`)** — génère les documents PDF (bons de livraison, factures, rapports) à partir de gabarits HTML/CSS, et les exports CSV/Excel des rapports.
5. **Pont IPC (`src/main/ipc`)** — expose la couche services au renderer via des canaux nommés et typés (`docs/API_CONTRACT.md`), gère la validation des entrées avant appel aux services.

## 4. Structure de dossiers proposée

```
gestion-stock-supernova/
├── CLAUDE.md
├── README.md
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DATA_MODEL.md
│   ├── BUSINESS_RULES.md
│   ├── FUNCTIONAL_SPEC.md
│   ├── UI_SCREENS.md
│   ├── API_CONTRACT.md
│   └── ROADMAP.md
├── .claude/
│   ├── state.md
│   ├── memory.md
│   └── STRATEGY-DIGEST.md
├── electron/
│   ├── main.ts                # point d'entrée Electron (fenêtre, menus, cycle de vie)
│   └── preload.ts              # pont contextBridge exposant l'API IPC typée au renderer
├── src/
│   ├── renderer/
│   │   ├── screens/            # un dossier par écran (10.1 à 10.9)
│   │   ├── components/         # composants UI réutilisables (tables, formulaires, badges de statut)
│   │   ├── api/                # wrappers typés autour de window.api.* (IPC)
│   │   └── app.tsx
│   ├── main/
│   │   ├── ipc/                # handlers IPC, un fichier par domaine (stock, ventes, factures, reversement…)
│   │   ├── services/            # logique métier pure, testable sans Electron ni IPC
│   │   ├── data/                 # client Prisma, requêtes, mapping
│   │   └── documents/            # gabarits HTML/CSS + génération PDF (bons, factures, rapports)
│   └── shared/
│       ├── types.ts              # types partagés renderer/main (DTO, enums RG-xx)
│       └── constants.ts          # constantes métier (communes, formats de numérotation, seuils par défaut)
├── prisma/
│   ├── schema.prisma            # schéma de la base de données (issu de docs/DATA_MODEL.md)
│   └── migrations/               # historique des évolutions du schéma
├── backups/                      # sauvegardes automatiques du fichier SQLite
├── tests/
│   ├── services/                  # tests unitaires des règles de gestion (RG-01 à RG-14)
│   └── e2e/                        # tests de bout en bout (Playwright pour Electron, optionnel v1)
└── package.json
```

## 5. Sécurité et sauvegarde des données

- Accès à l'application protégé par identifiant/mot de passe (comptes gérés dans le module Administration, `docs/FUNCTIONAL_SPEC.md` §8.9).
- Sauvegarde automatique quotidienne du fichier SQLite vers `backups/`, avec rétention glissante (ex. 15 jours), exécutée en tâche de fond au démarrage de l'application ou à heure fixe.
- Sauvegarde manuelle à la demande, exportable vers une clé USB ou un espace de stockage en ligne.
- Journal des actions sensibles (annulations, ajustements de stock, modifications de prix) stocké dans une table dédiée (`JournalAudit`, voir `docs/DATA_MODEL.md`).

## 6. Perspectives d'évolution

- **Multi-poste réseau local** : remplacer SQLite par PostgreSQL. Grâce à Prisma, l'essentiel de la couche `src/main/data` et `src/main/services` est réutilisable sans réécriture ; seul le processus `main` change de rôle (client réseau plutôt qu'accès fichier direct), ou évolue vers un petit serveur Node local partagé.
- **Facturation normalisée (DGI)** : ajout d'un module complémentaire dans `src/main/documents` et `src/main/services`, sans impact sur le cœur du système (stock, ventes, reversement).
- **Bascule web/cloud** : la couche `src/renderer` (React) et `src/main/services` (logique métier pure, indépendante d'Electron) sont conçues pour être réutilisables derrière une véritable API HTTP si le produit devait un jour devenir une application web.

## 7. Outils de build et qualité

- **Bundler** : Vite (rapide, bon support Electron + React + TS).
- **Lint/format** : ESLint + Prettier, configuration partagée à la racine.
- **Tests** : Vitest pour `src/main/services` (règles de gestion) et les utilitaires ; tests de composants React avec React Testing Library pour les écrans critiques (facturation, bon de livraison).
- **Packaging** : `electron-builder`, cible `nsis` (installeur Windows `.exe`).
