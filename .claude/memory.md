# Journal des décisions — Gestion Stock & Facturation (Distribution Supernova)

> Journal chronologique des décisions actées. Objectif : ne jamais avoir à reconstituer un raisonnement déjà tenu. Une ligne par décision, avec sa justification courte.

## 2026-09 — Cadrage initial

- **Régime de stock** : décidé que le stock est géré en **dépôt-vente (consignation)** avec Supernova — le stock reste la propriété de Supernova jusqu'à la vente ; la maison reverse le prix d'achat convenu et conserve la marge. *(confirmé par le porteur du projet lors de la rédaction du dossier d'analyse)*

- **Correction — Supernova est un fournisseur grossiste, pas un éditeur** : le dossier d'analyse initial et le modèle de données désignaient Supernova comme « éditeur ». **Corrigé** : Supernova est un fournisseur grossiste qui agrège et distribue des ouvrages de maisons d'édition diverses ; c'est avec lui, et lui seul, que le contrat de dépôt-vente est passé, que les prix d'achat sont convenus et que les reversements sont effectués. L'entité de données `Editeur` a été renommée `Fournisseur`, et un champ informatif `Ouvrage.editeurOrigine` (libre, sans règle de gestion) a été ajouté pour tracer l'éditeur réel de chaque titre quand c'est utile. *(voir `docs/DATA_MODEL.md` §1 et `CLAUDE.md` §2)*

- **Correction majeure — stock centralisé** : le dossier d'analyse initial supposait un stock ventilé par commune (Koumassi, Port-Bouët, Marcory), avec transferts inter-communes. **Corrigé** : le stock est en réalité géré dans un **entrepôt unique situé à Port-Bouët**. Les trois communes ne qualifient que le client et la destination de livraison, sans aucun effet sur le niveau de stock. Cette correction a supprimé l'entité `Depot` multiple, la notion de transfert de stock, et a simplifié `Ouvrage.quantiteDisponible` en un champ unique. *(voir `docs/DATA_MODEL.md` §1 et `CLAUDE.md` §2 pour le détail normatif de cette décision)*

- **Stack technique** : choix d'une application **desktop Electron + React (TypeScript) + Node.js + Prisma/SQLite**, plutôt que .NET/WPF ou Python/PyQt. Justification : cohérence avec l'écosystème JS/TS déjà maîtrisé sur les autres projets TIAF (Next.js/NestJS), autonomie totale hors-ligne, sauvegarde simple (fichier SQLite unique), qualité d'impression PDF, chemin d'évolution clair vers PostgreSQL/multi-poste si besoin. *(voir `docs/ARCHITECTURE.md` §2 pour le comparatif complet)*

- **Pas d'API HTTP interne** : préférence pour des canaux IPC Electron typés plutôt qu'une API REST locale, l'application étant mono-poste sans client distant. Réévaluer ce choix si une version multi-poste réseau devient un besoin réel (voir `docs/ARCHITECTURE.md` §6).

- **Facturation** : pas de facturation normalisée DGI en v1 (documents internes simples) — à réévaluer si le régime fiscal de l'entreprise l'exige. *(cf. dossier d'analyse, périmètre §3.2)*

## 2026-09 — Unité monétaire de stockage

- **Décision** : tous les montants (prix, factures, reversements) sont stockés en **FCFA entier** (1 unité stockée = 1 FCFA), sans sous-unité.
- **Justification** : le FCFA n'a pas de centime circulant en usage courant en Afrique de l'Ouest ; un modèle « centimes » générique n'apporterait aucune valeur ici et complexifierait inutilement l'affichage et les calculs.
- **Impact** : `prisma/schema.prisma` (tous les champs monétaires en `Int`), `docs/DATA_MODEL.md`, services de calcul (`prixAchat`, `prixVente`, `montantDu`, remises).

## Modèle de décision à suivre pour les prochaines entrées

```
## AAAA-MM — <titre court de la décision>
- **Décision** : <ce qui a été décidé, en une phrase>
- **Justification** : <pourquoi, en une phrase ou deux>
- **Impact** : <fichiers/modules concernés>
```
