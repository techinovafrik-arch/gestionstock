# Gestion Stock & Facturation — Distribution Supernova

Application desktop locale (mono-poste) de gestion de stock et de facturation pour une maison de distribution d'ouvrages et manuels scolaires travaillant en dépôt-vente avec la maison d'édition **Supernova**, livrant des clients situés à Koumassi, Port-Bouët et Marcory depuis un **entrepôt unique** basé à Port-Bouët.

Ce dépôt de documentation traduit le `Dossier d'analyse — Gestion de stock et facturation (Distribution Supernova)` en artefacts exploitables directement pour le développement (spécifications, modèle de données, contrat d'API interne, planning). Il est conçu pour être lu par un développeur humain et par un agent Claude Code travaillant sur ce dépôt.

## Sommaire de la documentation

| Fichier | Contenu |
|---|---|
| [`CLAUDE.md`](./CLAUDE.md) | Règles de développement du projet, conventions de code, stack imposée, garde-fous |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Architecture technique détaillée (Electron + React + Node + Prisma/SQLite), structure de dossiers |
| [`docs/DATA_MODEL.md`](./docs/DATA_MODEL.md) | Modèle de données (MCD/MPD), schéma Prisma de référence |
| [`docs/BUSINESS_RULES.md`](./docs/BUSINESS_RULES.md) | Règles de gestion RG-01 à RG-14, à respecter dans la couche services |
| [`docs/FUNCTIONAL_SPEC.md`](./docs/FUNCTIONAL_SPEC.md) | Spécification fonctionnelle par module (9 modules) |
| [`docs/UI_SCREENS.md`](./docs/UI_SCREENS.md) | Spécification écran par écran pour l'implémentation des composants React |
| [`docs/API_CONTRACT.md`](./docs/API_CONTRACT.md) | Contrat des canaux IPC entre l'interface React et le processus principal Electron |
| [`docs/ROADMAP.md`](./docs/ROADMAP.md) | Plan de réalisation par phases, jalons, définition de fini |
| [`.claude/state.md`](./.claude/state.md) | État courant du projet (phase, avancement, prochaine action) |
| [`.claude/memory.md`](./.claude/memory.md) | Journal des décisions techniques et fonctionnelles actées |
| [`.claude/STRATEGY-DIGEST.md`](./.claude/STRATEGY-DIGEST.md) | Résumé stratégique condensé du projet (contexte, objectifs, périmètre) |

## Résumé du produit

- **Utilisateur** : gérant/opérateur unique, sur un poste Windows, sans connexion internet obligatoire.
- **Cœur métier** : dépôt-vente avec Supernova — le stock appartient à Supernova jusqu'à la vente ; la maison reverse le prix d'achat convenu et conserve la marge.
- **Stock** : **entrepôt unique** à Port-Bouët. Aucune ventilation de stock par commune. Les communes (Koumassi, Port-Bouët, Marcory) qualifient uniquement le client et la destination de livraison.
- **Cycle** : réception (Supernova → entrepôt) → vente / bon de livraison → livraison client → facturation → règlement → (éventuel retour vers Supernova) → reversement périodique à Supernova.

## Stack technique retenue

Application **desktop packagée**, exécutée localement, sans serveur :

- **Electron** (shell natif Windows, un seul exécutable installable)
- **React** (TypeScript) pour l'intégralité de l'interface (`renderer`)
- **Node.js / TypeScript** pour la couche de services métier (`main` process)
- **Prisma ORM** + **SQLite** (fichier unique local) pour la persistance
- Génération PDF (bons de livraison, factures, rapports) à partir de gabarits HTML/CSS

Voir [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) pour le détail et la justification de ces choix.

## Comment utiliser ces documents

1. Commencer par `CLAUDE.md` et `.claude/STRATEGY-DIGEST.md` pour le contexte général.
2. Lire `docs/ARCHITECTURE.md` puis `docs/DATA_MODEL.md` avant d'initialiser le projet (scaffolding, schéma Prisma).
3. Implémenter module par module en suivant `docs/FUNCTIONAL_SPEC.md`, `docs/UI_SCREENS.md` et `docs/API_CONTRACT.md` en parallèle.
4. Vérifier chaque fonctionnalité livrée contre `docs/BUSINESS_RULES.md` (RG-01 à RG-14) avant de la considérer terminée.
5. Suivre l'avancement dans `docs/ROADMAP.md` et tenir `.claude/state.md` / `.claude/memory.md` à jour au fil du développement.

Ces fichiers font référence au `Dossier d'analyse — Gestion de stock et facturation (Distribution Supernova)` (version 1.0, corrigée pour un entrepôt unique) comme document source faisant autorité sur les besoins métier.
