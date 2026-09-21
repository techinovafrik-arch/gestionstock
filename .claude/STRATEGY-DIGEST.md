# Résumé stratégique — Gestion Stock & Facturation (Distribution Supernova)

> Condensé à lire en premier pour reprendre le contexte du projet en moins d'une minute.

## En une phrase

Une application desktop locale, en React/Electron, pour qu'une maison de distribution d'ouvrages scolaires à Abidjan gère son stock (entrepôt unique à Port-Bouët) et sa facturation client (Koumassi, Port-Bouët, Marcory), dans le cadre d'un partenariat de dépôt-vente avec Supernova, son fournisseur grossiste.

## Pourquoi ce projet existe

Le suivi du stock et l'édition des documents commerciaux sont aujourd'hui manuels (cahiers, tableurs), ce qui rend peu fiable le calcul des sommes dues à Supernova et le suivi des créances clients. L'application cible automatise ce cycle de bout en bout.

## Ce qui ne change jamais (invariants métier)

0. Supernova est un **fournisseur grossiste**, pas un éditeur — il distribue des ouvrages de maisons d'édition diverses. L'éditeur réel d'un ouvrage est une simple information de catalogue (`Ouvrage.editeurOrigine`), sans effet sur le contrat de dépôt-vente ni sur les calculs.
1. Le stock est **unique**, centralisé à l'entrepôt de Port-Bouët — jamais ventilé par commune.
2. Les trois communes (Koumassi, Port-Bouët, Marcory) qualifient uniquement le **client et la livraison**, jamais le stock.
3. Le montant dû à Supernova = quantité vendue × **prix d'achat au moment de la vente** — indépendant du prix pratiqué au client.
4. Aucun document déjà émis (bon de livraison, facture) n'est supprimable — seule l'annulation tracée existe.
5. Application **mono-poste, hors-ligne**, packagée avec Electron ; interface entièrement en **React**.

## Où trouver quoi

| Besoin | Fichier |
|---|---|
| Comprendre le métier en détail | Dossier d'analyse v1.0 (document source, hors dépôt) |
| Règles de gestion précises | `docs/BUSINESS_RULES.md` |
| Schéma de données | `docs/DATA_MODEL.md` |
| Découpage fonctionnel | `docs/FUNCTIONAL_SPEC.md` |
| Écrans à construire | `docs/UI_SCREENS.md` |
| Contrat IPC renderer/main | `docs/API_CONTRACT.md` |
| Architecture & choix techniques | `docs/ARCHITECTURE.md` |
| Plan de réalisation | `docs/ROADMAP.md` |
| Avancement réel | `.claude/state.md` |
| Historique des décisions | `.claude/memory.md` |
| Conventions et garde-fous de code | `CLAUDE.md` (racine projet) |

## Périmètre exclu (v1)

Facturation fiscale normalisée DGI, multi-poste réseau, interconnexion directe avec un système Supernova, vente en ligne, comptabilité générale — voir dossier d'analyse §3.2 pour le détail et les conditions de réévaluation.
