# État du projet — Gestion Stock & Facturation (Distribution Supernova)

> À tenir à jour au fil du développement. Ce fichier répond à la question « où en est-on, là, maintenant ? ». Les décisions et leur justification vont dans `memory.md`, pas ici.

## Phase courante

- **Phase** : Phase 3 — Règlements & reversement
- **Statut** : **DoD atteint**. Le reversement généré correspond exactement à Σ(quantité × prixAchat au moment de la vente), vérifié indépendamment de la remise facture appliquée.

## Dernière action réalisée

- **Correction de modèle importante** : `LigneBonLivraison.prixAchatUnitaire` ajouté pour figer le prix d'achat au moment de la vente (RG-08 l'exige explicitement — le prix d'achat courant de l'ouvrage peut avoir changé depuis via une nouvelle réception). Migration appliquée, `docs/DATA_MODEL.md` mis à jour.
- Services `reglements.ts` (règlements partiels/complets, transition de statut, état des créances) et `reversement.ts` (génération d'état par période regroupé par ouvrage+prix, clôture RG-10).
- RG-10 : `annulerBonLivraison` refuse désormais toute annulation dont la date tombe dans une période de reversement clôturée.
- IPC + écrans Règlements (10.7) et Reversement (10.8).
- 7 nouveaux tests unitaires (22/22 au total). Vérification de bout en bout sous le vrai binaire Electron (client → BL → facture → règlements partiels/complets → génération reversement exact → clôture → verrou RG-10 confirmé).

## Prochaine action

- Phase 4 (`docs/ROADMAP.md`) : tableau de bord (10.1), rapports ventes/marge/créances (10.9), gestion utilisateurs et **authentification réelle** (10.10 — remplacer le compte admin seedé automatiquement, voir `.claude/memory.md`), sauvegarde/restauration, journal d'audit.
- Écran Ouvrages (10.2) : modification/désactivation depuis l'UI.
- Marquer un BL comme livré / l'annuler depuis l'écran Bon de livraison (services existants, pas encore reliés à cet écran).

## Blocages / décisions en attente

- Aucun blocage technique.
- Décision en attente côté métier : périodicité exacte de reversement à Supernova (hebdomadaire ou mensuelle) — la génération d'état est déjà paramétrable par période libre, donc cette décision ne bloque pas techniquement ; elle fixera juste la valeur par défaut suggérée à l'écran Reversement.
- Risque connu et accepté : vulnérabilités npm high severity résiduelles, dev-only, dans des dépendances transitives de la CLI Prisma (support MySQL non utilisé).
- Point de vigilance Phase 4 : retirer/revoir le seed automatique du compte `admin` une fois l'authentification réelle implémentée.
- **Rappel opérationnel permanent** : après tout `npm install` touchant `better-sqlite3`, l'ABI native doit être recompilée selon l'usage (`npm run dev`/`build` le font automatiquement via `predev`/`prebuild` ; `npm test` via `pretest`).

## Historique des phases

| Phase | Statut | Date |
|---|---|---|
| Phase 0 — Cadrage technique | Terminée | 2026-09-21 |
| Phase 1 — Référentiels & stock | DoD atteint | 2026-09-21 |
| Phase 2 — Ventes & facturation | DoD atteint | 2026-09-22 |
| Phase 3 — Règlements & reversement | **DoD atteint** | 2026-09-22 |
| Phase 4 — Rapports & administration | Non démarrée | — |
| Phase 5 — Tests & recette | Non démarrée | — |
| Phase 6 — Packaging & mise en production | Non démarrée | — |
