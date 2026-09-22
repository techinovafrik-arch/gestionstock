# État du projet — Gestion Stock & Facturation (Distribution Supernova)

> À tenir à jour au fil du développement. Ce fichier répond à la question « où en est-on, là, maintenant ? ». Les décisions et leur justification vont dans `memory.md`, pas ici.

## Phase courante

- **Phase** : Phase 2 — Ventes & facturation
- **Statut** : **DoD atteint**. Parcours complet client → BL → facture → PDF vérifié de bout en bout.

## Dernière action réalisée

- Services `numerotation.ts` (RG-11, numéros séquentiels transactionnels), `ventes.ts` (RG-04 contrôle de stock, RG-06, RG-13 annulation tracée), `facturation.ts` (RG-07 regroupement de BL + remise) — 10 nouveaux tests unitaires (15/15 au total).
- Génération PDF (`src/main/documents/`) pour bon de livraison et facture, via le moteur d'impression d'Electron.
- IPC `ventes:*` / `facturation:*` + `preload.ts` étendu ; écrans **Nouveau bon de livraison** (10.5, avec création de client intégrée) et **Facturation** (10.6, sélection multi-BL + remise + impression).
- **Correctif critique découvert et corrigé** : `better-sqlite3` doit être recompilé pour l'ABI d'Electron (`@electron/rebuild`), sinon Prisma échoue silencieusement dans l'app réelle (l'IPC avale l'erreur). Scripts `predev`/`prebuild`/`pretest` ajoutés pour recompiler automatiquement le bon ABI selon le contexte — voir `.claude/memory.md`. **Ce piège existait déjà en Phase 0/1 sans avoir été détecté** (les listages IPC échouaient silencieusement) ; il est maintenant résolu partout.
- Vérification de bout en bout réalisée via un script exécuté sous le vrai binaire Electron (pas de mock) : client → ouvrage → réception → BL numéroté → PDF BL → facture (montant exact avec remise) → PDF facture → nettoyage. Voir commit `0ab47dc`.
- Note d'environnement : les captures d'écran automatisées de la fenêtre Electron dans cette session ont capturé le bureau réel de l'utilisateur (pas un environnement isolé) — cette pratique a été arrêtée à la demande de l'utilisateur ; toute vérification visuelle future doit être faite par l'utilisateur lui-même (`npm run dev`).

## Prochaine action

- Phase 3 (`docs/ROADMAP.md`) : écran Règlements (10.7, enregistrement, créances), écran Reversement Supernova (10.8, génération d'état RG-08, clôture RG-10).
- Écran Ouvrages (10.2) : ajouter modification/désactivation depuis l'UI (seule la création existe actuellement).
- Marquer un BL comme livré / l'annuler depuis l'écran (les services existent, pas encore reliés à l'UI Nouveau bon de livraison — actuellement seule la création est câblée côté écran).

## Blocages / décisions en attente

- Aucun blocage technique.
- Décision en attente côté métier : périodicité exacte de reversement à Supernova (hebdomadaire ou mensuelle) — à confirmer avant Phase 3.
- Risque connu et accepté : vulnérabilités npm high severity résiduelles, dev-only, dans des dépendances transitives de la CLI Prisma (support MySQL non utilisé).
- Point de vigilance Phase 4 : retirer/revoir le seed automatique du compte `admin` une fois l'authentification réelle implémentée.
- **Rappel opérationnel permanent** : après tout `npm install` touchant `better-sqlite3`, l'ABI native doit être recompilée selon l'usage (`npm run dev`/`build` le font automatiquement via `predev`/`prebuild` ; `npm test` via `pretest`). Ne jamais lancer `electron.exe` directement sans passer par ces scripts sans y penser.

## Historique des phases

| Phase | Statut | Date |
|---|---|---|
| Phase 0 — Cadrage technique | Terminée | 2026-09-21 |
| Phase 1 — Référentiels & stock | DoD atteint | 2026-09-21 |
| Phase 2 — Ventes & facturation | **DoD atteint** | 2026-09-22 |
| Phase 3 — Règlements & reversement | Non démarrée | — |
| Phase 4 — Rapports & administration | Non démarrée | — |
| Phase 5 — Tests & recette | Non démarrée | — |
| Phase 6 — Packaging & mise en production | Non démarrée | — |
