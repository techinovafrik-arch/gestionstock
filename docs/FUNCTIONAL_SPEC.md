# Spécification fonctionnelle par module

Neuf modules. Chaque module correspond à un dossier logique dans `src/main/services` (+ `src/main/ipc`) et à un ou plusieurs écrans dans `docs/UI_SCREENS.md`.

## 8.1 Référentiels

Données de base utilisées par tous les autres modules.

- Catalogue des ouvrages : titre, ISBN/référence, matière, niveau/classe, éditeur d'origine (information de catalogue, libre), prix d'achat convenu avec le fournisseur (Supernova), prix de vente, seuil d'alerte.
- Communes de livraison : Koumassi, Port-Bouët, Marcory — utilisées uniquement pour qualifier clients et livraisons, sans lien avec le stock.
- Clients : identification, type (établissement scolaire, librairie, particulier), commune, contact, adresse.
- Fournisseur : fiche Supernova (coordonnées, conditions).
- Utilisateurs : comptes d'accès avec rôle associé.

**Services** : `services/ouvrages.ts`, `services/communes.ts`, `services/clients.ts`, `services/fournisseur.ts`, `services/utilisateurs.ts`.

## 8.2 Réception de stock

Enregistrement de l'arrivée d'ouvrages en provenance de Supernova à l'entrepôt de Port-Bouët.

- Saisie d'un bon de réception : date, ouvrages, quantités, prix d'achat (repris du catalogue ou ajusté).
- Mise à jour automatique du stock disponible et création du `MouvementStock` de type `RECEPTION`.

**Service** : `services/receptions.ts`.

## 8.3 Gestion de stock (entrepôt unique)

- Consultation du stock disponible par ouvrage (niveau unique).
- Ajustements d'inventaire (correction manuelle justifiée : casse, perte, comptage physique) — motif obligatoire.
- Alertes automatiques sur seuil (RG-12).
- Historique complet des mouvements par ouvrage, filtrable par période et type.

**Service** : `services/stock.ts`.

## 8.4 Ventes, livraisons et bons de livraison

Sortie des ouvrages de l'entrepôt vers les clients, livrés dans l'une des trois communes.

- Création d'un bon de livraison : client, commune/adresse de livraison, lignes d'ouvrages et quantités.
- Contrôle automatique de la disponibilité du stock avant validation (RG-04).
- Numérotation automatique et séquentielle (RG-11).
- Suivi du statut de livraison (`EMIS` → `LIVRE`) pour organiser les tournées.
- Impression / export PDF.
- Annulation tracée d'un BL non encore facturé, avec réintégration du stock.

**Service** : `services/ventes.ts`.

## 8.5 Facturation

Transformation d'un ou plusieurs bons de livraison en facture client.

- Génération à partir d'un ou plusieurs BL sélectionnés pour un même client.
- Calcul automatique du montant total, remise éventuelle (globale ou par ligne).
- Numérotation automatique et séquentielle (RG-11).
- Impression / export PDF.
- Statut : `EMISE`, `PARTIELLE`, `REGLEE`, `ANNULEE`.

**Service** : `services/facturation.ts`.

## 8.6 Règlements clients

- Enregistrement d'un règlement (date, montant, mode de paiement) en face d'une facture.
- Règlements partiels autorisés, mise à jour automatique du solde restant dû.
- État des créances clients : factures impayées ou partiellement payées, par client et par ancienneté.

**Service** : `services/reglements.ts`.

## 8.7 Reversement à Supernova

- Génération d'un état de reversement sur une période donnée : ventes réalisées, quantités par ouvrage, montant dû (RG-08).
- Enregistrement du versement effectué à Supernova, clôture de la période (RG-10).
- Historique des reversements passés, consultable et exportable.

**Service** : `services/reversement.ts`.

## 8.8 Rapports et tableau de bord

- Tableau de bord d'accueil : stock disponible, alertes de seuil, créances en cours, montant dû à Supernova en attente.
- Rapport des ventes par période, par ouvrage, par commune de livraison.
- Rapport de marge réalisée (prix de vente − prix d'achat) par ouvrage et par période.
- Export PDF ou tableur (CSV/Excel).

**Service** : `services/rapports.ts`.

## 8.9 Administration

- Gestion des comptes utilisateurs et de leurs rôles (administrateur, opérateur).
- Paramétrage des communes de livraison, des seuils d'alerte, de la périodicité de reversement.
- Sauvegarde manuelle et automatique de la base de données ; restauration.
- Journal des actions sensibles (`JournalAudit`).

**Service** : `services/administration.ts`, `src/main/backup.ts`.
