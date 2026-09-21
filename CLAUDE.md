# CLAUDE.md — Gestion Stock & Facturation (Distribution Supernova)

Ce fichier est le CLAUDE.md **de niveau projet**. Conformément à la convention TIAF (configuration en cascade), il **surcharge** le CLAUDE.md global du dossier de développement (`developpement/CLAUDE.md`) pour tout ce qui concerne ce projet précis. En cas de conflit, ce fichier fait foi.

## 1. Identité du projet

- **Nom** : Gestion Stock & Facturation — Distribution Supernova
- **Type** : application desktop locale, mono-poste, installable sur PC Windows
- **Domaine métier** : distribution d'ouvrages scolaires en dépôt-vente pour le compte de la maison d'édition Supernova
- **Document de référence métier** : `Dossier d'analyse — Gestion de stock et facturation (Distribution Supernova)`, v1.0 (entrepôt unique à Port-Bouët, livraison vers Koumassi / Port-Bouët / Marcory)
- **Documentation technique dérivée** : voir `README.md` et le dossier `docs/`

## 2. Faits non négociables du domaine

> **Le stock est unique, centralisé dans l'entrepôt de Port-Bouët. Il n'est jamais ventilé par commune.**
> Les communes (Koumassi, Port-Bouët, Marcory) ne qualifient que le client et la destination de livraison — elles n'ont **aucun** effet sur le niveau de stock.

Tout code, migration de schéma, ou fonctionnalité qui réintroduirait une notion de stock par dépôt/commune (table `Stock` liée à une entité `Depot` multiple, champ `idDepot` sur un bon de livraison agissant comme source de stock, etc.) est une régression fonctionnelle et doit être refusé en revue, sauf décision explicite et documentée dans `.claude/memory.md`.

> **Supernova est un fournisseur grossiste, pas un éditeur.** Il agrège et distribue des ouvrages de maisons d'édition diverses, potentiellement changeantes.
> L'entité de données est `Fournisseur` (jamais `Editeur`) : c'est le partenaire unique du contrat de dépôt-vente, celui avec qui les prix d'achat sont convenus et à qui les reversements sont dus. L'éditeur réel d'un ouvrage est une donnée de catalogue libre (`Ouvrage.editeurOrigine`), **sans aucune règle de gestion associée** — ne jamais l'utiliser dans un calcul de stock, de prix ou de reversement.

## 3. Stack imposée

| Couche | Technologie | Remarque |
|---|---|---|
| Shell applicatif | Electron | packaging via `electron-builder`, cible Windows (`.exe`) |
| Interface (renderer) | React + TypeScript | seule UI du projet ; pas de framework SSR (pas de Next.js ici, l'app est locale et hors-ligne) |
| Logique métier / IPC (main) | Node.js + TypeScript | contient la couche services (règles de gestion) et les handlers IPC |
| Accès aux données | Prisma ORM | schéma unique de référence : `docs/DATA_MODEL.md` |
| Base de données | SQLite (fichier local) | un seul fichier, sauvegardable par simple copie |
| Génération de documents | Gabarits HTML/CSS → PDF | bons de livraison, factures, rapports |

Ne pas introduire de framework web supplémentaire (pas de serveur HTTP exposé, pas d'API REST) : toute communication UI ↔ métier passe par les canaux IPC définis dans `docs/API_CONTRACT.md`.

## 4. Règles de gestion — source de vérité

Les règles de gestion RG-01 à RG-14 (`docs/BUSINESS_RULES.md`) sont normatives. Toute implémentation d'une fonctionnalité touchant au stock, aux ventes, à la facturation ou au reversement Supernova doit :

1. Citer explicitement la ou les RG concernées dans la description de la tâche / du commit.
2. Être couverte par un test unitaire dans la couche services (`src/services/`) qui vérifie cette règle.
3. Ne jamais contourner un contrôle de stock négatif (RG-04) ni recalculer le montant dû à Supernova autrement qu'à partir du prix d'achat au moment de la vente (RG-08).

## 5. Conventions de code

- TypeScript strict (`strict: true`) sur l'ensemble du monorepo (`main`, `renderer`, `shared`).
- Aucune règle de gestion dans la couche présentation (`src/renderer`) : les composants React affichent et saisissent, ils ne décident pas (pas de calcul de stock, de marge ou de reversement dans un composant).
- Toute mutation de données passe par la couche `src/services/`, jamais directement du renderer vers Prisma.
- Nommage des entités et champs aligné sur `docs/DATA_MODEL.md` (camelCase, français métier conservé pour les noms d'entités : `Ouvrage`, `MouvementStock`, `BonLivraison`, etc.).
- Numérotation des documents (bons de livraison, factures) générée exclusivement côté services, jamais côté UI (RG-11).
- Les montants sont stockés en entier (centimes de FCFA ou unité mineure définie au démarrage du projet) pour éviter les erreurs d'arrondi flottant.

## 6. Garde-fous spécifiques à ce projet

- **Ne jamais modifier le schéma Prisma sans mettre à jour `docs/DATA_MODEL.md` dans le même commit.**
- **Ne jamais supprimer un bon de livraison ou une facture déjà émis** — seule une annulation tracée est autorisée (RG-13). Aucune opération `DELETE` sur ces tables dans le code applicatif (hors script de maintenance explicitement documenté).
- **Ne jamais reconstruire un système d'authentification ou de gestion des rôles existant** sans revue explicite — s'il existe déjà un middleware d'accès (comptes utilisateurs, rôles), il ne doit pas être modifié de façon autonome par un agent, conformément à la règle globale TIAF sur les middlewares d'auth.
- Toute sauvegarde automatique de la base SQLite (voir `docs/ARCHITECTURE.md` §Sécurité) doit rester non-bloquante pour l'utilisateur (opération asynchrone en tâche de fond).

## 7. Méthode de travail

Ce projet suit la méthodologie TIAF standard en phases (cadrage → conception → développement → tests/recette → mise en production), détaillée dans `docs/ROADMAP.md`. L'état courant de la phase et de l'avancement est tenu dans `.claude/state.md` ; les décisions prises en cours de route sont journalisées dans `.claude/memory.md` plutôt que reconstituées à chaque session.

## 8. Hiérarchie des documents en cas de doute

1. Ce fichier (`CLAUDE.md`) — conventions et garde-fous techniques.
2. `docs/BUSINESS_RULES.md` — vérité métier (RG-01 à RG-14).
3. `docs/DATA_MODEL.md` et `docs/API_CONTRACT.md` — vérité structurelle (schéma, contrats).
4. `docs/FUNCTIONAL_SPEC.md` et `docs/UI_SCREENS.md` — vérité fonctionnelle et d'interface.
5. Dossier d'analyse original (hors dépôt) — contexte et justification, non normatif pour l'implémentation en cas d'écart avec les fichiers ci-dessus (qui ont vocation à être tenus à jour en priorité).
