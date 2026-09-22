# État du projet — Gestion Stock & Facturation (Distribution Supernova)

> À tenir à jour au fil du développement. Ce fichier répond à la question « où en est-on, là, maintenant ? ». Les décisions et leur justification vont dans `memory.md`, pas ici.

## Phase courante

- **Phase** : Phase 4 — Rapports & administration
- **Statut** : **En cours (1/2)**. Authentification, journal d'audit, sauvegarde/restauration terminés et vérifiés (DoD backup/restore atteint). Tableau de bord (10.1) et rapports (10.9) restent à faire.

## Dernière action réalisée

- **Authentification réelle** : remplace le contournement provisoire de la Phase 1 (`services/auth.ts`, session en mémoire mono-poste). Le compte `admin`/`admin` seedé sert désormais de compte de démarrage légitime (première connexion), plus un contournement caché. Contrôle d'accès : seul un `ADMINISTRATEUR` crée des utilisateurs.
- **Journal d'audit** câblé sur les 3 actions listées par `CLAUDE.md` §6 (ajustement de stock, annulation de BL, modification de prix).
- **Sauvegarde/restauration** (`src/main/backup.ts`) : copie du fichier SQLite, rétention 15 jours, sauvegarde automatique au démarrage + toutes les 24h. Restauration = copie + redémarrage de l'app.
- Écrans **Login** et **Administration** (comptes, sauvegarde/restauration, journal d'audit). `App.tsx` gate désormais sur une session valide.
- 31/31 tests passent. **Vérifié avec le build de production réel** (`electron-vite build` + `electron.exe .`, pas juste le mode dev) : sauvegarde automatique confirmée sur deux redémarrages successifs de l'app, sauvegarde relue avec succès via Prisma.
- Découverte opérationnelle : `app.getPath('userData')` pointe vers `%APPDATA%\gestion-stock-supernova` pour l'app réelle (pas `%APPDATA%\Electron`, utilisé seulement par nos scripts de smoke test ad hoc) — voir `.claude/memory.md`.

## Prochaine action

- **Phase 4 (2/2)** : tableau de bord (10.1 — stock disponible, alertes, créances en cours, montant dû à Supernova) et rapports (10.9 — ventes/marge/créances par période, export CSV).
- Écran Ouvrages (10.2) : modification/désactivation depuis l'UI.
- Marquer un BL comme livré / l'annuler depuis l'écran Bon de livraison (services existants, pas encore reliés à cet écran).

## Blocages / décisions en attente

- Aucun blocage technique.
- Décision en attente côté métier : périodicité exacte de reversement à Supernova (hebdomadaire ou mensuelle) — non bloquante techniquement (période libre déjà supportée).
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
| Phase 4 — Rapports & administration | **En cours (1/2)** | 2026-09-22 |
| Phase 5 — Tests & recette | Non démarrée | — |
| Phase 6 — Packaging & mise en production | Non démarrée | — |
