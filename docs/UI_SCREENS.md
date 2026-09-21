# Spécification des écrans (React)

Chaque écran correspond à un dossier sous `src/renderer/screens/`. Aucune logique métier dans ces composants : ils appellent les fonctions du pont IPC (`src/renderer/api/*`, voir `docs/API_CONTRACT.md`) et affichent le résultat.

## 10.1 Tableau de bord — `screens/Dashboard/`

**Affiché à la connexion.**

- Stock disponible à l'entrepôt (indicateur synthétique).
- Liste des ouvrages en alerte de seuil.
- Montant des créances clients en cours.
- Montant dû à Supernova non encore reversé.
- Ventes du jour / de la semaine, par commune de livraison.
- Actions : accès direct aux modules Ventes, Stock, Reversement depuis les indicateurs.

## 10.2 Catalogue des ouvrages — `screens/Ouvrages/`

- Liste des ouvrages (titre, matière, niveau, prix d'achat, prix de vente, stock disponible).
- Ajouter / modifier / désactiver un ouvrage.
- Définir le seuil d'alerte par ouvrage.

## 10.3 Réception de stock — `screens/Receptions/`

- Formulaire : date, ouvrages et quantités reçues, prix d'achat.
- Valider la réception (met à jour le stock, crée le mouvement).
- Imprimer un bordereau de réception.

## 10.4 Stock de l'entrepôt — `screens/Stock/`

- Liste des ouvrages avec quantité disponible.
- Historique des mouvements filtrable par ouvrage, type de mouvement, période.
- Effectuer un ajustement d'inventaire (motif obligatoire).

## 10.5 Nouveau bon de livraison — `screens/BonLivraison/Nouveau/`

- Formulaire : client, commune/adresse de livraison, lignes (ouvrage, quantité, prix de vente unitaire), total indicatif.
- Message de blocage si le stock demandé est insuffisant à l'entrepôt (RG-04).
- Valider et générer le numéro de bon de livraison (RG-11).
- Imprimer / exporter en PDF.
- Marquer comme livré une fois la livraison effectuée.
- Annuler (si non encore facturé).

## 10.6 Facturation — `screens/Facturation/`

- Sélection du client et des bons de livraison non encore facturés.
- Lignes reprises automatiquement, remise éventuelle, montant total.
- Valider et générer le numéro de facture (RG-11).
- Imprimer / exporter en PDF.
- Marquer comme réglée / suivre les règlements partiels.

## 10.7 Règlements clients — `screens/Reglements/`

- Liste des factures avec statut (émise, partielle, réglée), solde restant dû.
- Historique des règlements par client.
- Enregistrer un nouveau règlement.
- Exporter l'état des créances.

## 10.8 Reversement à Supernova — `screens/Reversement/`

- Période sélectionnée, détail par ouvrage (quantité vendue, prix d'achat, montant), montant total dû.
- Générer l'état de reversement de la période.
- Enregistrer le versement effectué.
- Consulter l'historique des reversements.

## 10.9 Rapports — `screens/Rapports/`

- Ventes par période / ouvrage / commune de livraison.
- Marge réalisée.
- Créances clients.
- Filtrer par période, exporter en PDF ou tableur.

## 10.10 Administration — `screens/Administration/`

*(complète le module 8.9, non listée séparément dans le dossier d'analyse initial mais nécessaire à l'implémentation)*

- Gestion des comptes utilisateurs et rôles.
- Paramétrage des communes, seuils d'alerte, périodicité de reversement.
- Sauvegarde manuelle / restauration.
- Consultation du journal d'audit.

## Conventions transverses d'implémentation

- Tous les tableaux de données (ouvrages, clients, BL, factures) supportent tri, recherche texte et filtre par période a minima.
- Toute action irréversible ou sensible (annulation, ajustement de stock, clôture de reversement) demande une confirmation explicite avec rappel du motif.
- Les montants sont toujours affichés formatés (séparateur de milliers, devise), jamais l'entier brut stocké en base.
- Les statuts (`StatutBonLivraison`, `StatutPaiement`, `StatutReversement`) sont rendus par un composant `Badge` partagé (`components/Badge`), avec un jeu de couleurs cohérent et constant dans toute l'application.
