# Contrat IPC (renderer ↔ main)

Pas d'API HTTP : toute communication entre l'interface React et la logique métier passe par des canaux IPC Electron, exposés au renderer via `contextBridge` dans `electron/preload.ts` (objet global `window.api`). Ce fichier liste le contrat attendu, canal par canal, pour que le renderer et le main process puissent être développés en parallèle sur une interface stable.

Convention de nommage des canaux : `domaine:action` (ex. `stock:ajuster`, `ventes:creerBonLivraison`).

## Conventions générales

- Toute réponse suit la forme `{ ok: true, data: T } | { ok: false, error: { code: string; message: string } }`.
- Les codes d'erreur métier reprennent les RG concernées quand pertinent, ex. `STOCK_INSUFFISANT` (RG-04), `PRIX_VENTE_INVALIDE` (RG-01), `PERIODE_CLOTUREE` (RG-10).
- Les montants transitent en entier (unité mineure), jamais en flottant.
- Toute mutation renvoie l'entité complète à jour (pas de renvoi partiel), pour simplifier la mise à jour de l'état côté React (React Query / TanStack Query recommandé pour le cache renderer).

## 1. Référentiels — `referentiels:*`

| Canal | Entrée | Sortie |
|---|---|---|
| `referentiels:listerOuvrages` | `{ recherche?: string; actifSeulement?: boolean }` | `Ouvrage[]` |
| `referentiels:creerOuvrage` | `{ titre; isbn?; matiere?; niveau?; editeurOrigine?; prixAchat; prixVente; seuilAlerte; fournisseurId }` | `Ouvrage` |
| `referentiels:modifierOuvrage` | `{ id; ...champs partiels }` | `Ouvrage` |
| `referentiels:listerFournisseurs` | `{}` | `Fournisseur[]` (en pratique un seul enregistrement — Supernova — voir `CLAUDE.md` §2) |
| `referentiels:listerCommunes` | `{}` | `Commune[]` |
| `referentiels:listerClients` | `{ recherche?: string; communeId?: string }` | `Client[]` |
| `referentiels:creerClient` | `{ nom; typeClient; communeId; telephone?; adresse? }` | `Client` |
| `referentiels:listerUtilisateurs` | `{}` | `Utilisateur[]` (sans `motDePasseHash`) |

## 2. Réceptions — `receptions:*`

| Canal | Entrée | Sortie |
|---|---|---|
| `receptions:creer` | `{ dateBL?: string; lignes: { ouvrageId; quantite; prixAchat }[] }` | `{ mouvements: MouvementStock[] }` |
| `receptions:lister` | `{ periodeDebut?; periodeFin? }` | `MouvementStock[]` (type `RECEPTION`) |

## 3. Stock — `stock:*`

| Canal | Entrée | Sortie |
|---|---|---|
| `stock:consulter` | `{ recherche?: string }` | `{ ouvrageId; titre; quantiteDisponible; seuilAlerte; enAlerte: boolean }[]` |
| `stock:historique` | `{ ouvrageId?; typeMouvement?; periodeDebut?; periodeFin? }` | `MouvementStock[]` |
| `stock:ajuster` | `{ ouvrageId; quantite; sens: "PLUS" \| "MOINS"; motif: string }` | `MouvementStock` |

## 4. Ventes / bons de livraison — `ventes:*`

| Canal | Entrée | Sortie |
|---|---|---|
| `ventes:creerBonLivraison` | `{ clientId; communeLivraisonId; adresseLivraison?; lignes: { ouvrageId; quantite; prixVenteUnitaire }[] }` | `BonLivraison` (erreur `STOCK_INSUFFISANT` possible) |
| `ventes:listerBonsLivraison` | `{ statut?; clientId?; periodeDebut?; periodeFin?; nonFactures?: boolean }` | `BonLivraison[]` |
| `ventes:marquerLivre` | `{ id: string }` | `BonLivraison` |
| `ventes:annulerBonLivraison` | `{ id: string; motif: string }` | `BonLivraison` (erreur `DEJA_FACTURE` si applicable) |
| `ventes:imprimerBonLivraison` | `{ id: string }` | `{ cheminPdf: string }` |

## 5. Facturation — `facturation:*`

| Canal | Entrée | Sortie |
|---|---|---|
| `facturation:creer` | `{ clientId; bonsLivraisonIds: string[]; remise?: number }` | `Facture` |
| `facturation:lister` | `{ statutPaiement?; clientId?; periodeDebut?; periodeFin? }` | `Facture[]` |
| `facturation:consulter` | `{ id: string }` | `Facture & { lignes: LigneFacture[]; reglements: Reglement[] }` |
| `facturation:imprimer` | `{ id: string }` | `{ cheminPdf: string }` |
| `facturation:annuler` | `{ id: string; motif: string }` | `Facture` |

## 6. Règlements — `reglements:*`

| Canal | Entrée | Sortie |
|---|---|---|
| `reglements:enregistrer` | `{ factureId; montant; modePaiement; dateReglement? }` | `{ reglement: Reglement; facture: Facture }` |
| `reglements:creances` | `{ clientId?: string }` | `{ clientId; nom; montantDu; ancienneteJours }[]` |

## 7. Reversement — `reversement:*`

| Canal | Entrée | Sortie |
|---|---|---|
| `reversement:genererEtat` | `{ periodeDebut: string; periodeFin: string }` | `Reversement & { lignes: LigneReversement[] }` |
| `reversement:enregistrerVersement` | `{ reversementId; montantVerse; dateVersement }` | `Reversement` (statut → `CLOTURE`) |
| `reversement:lister` | `{}` | `Reversement[]` |

## 8. Rapports — `rapports:*`

| Canal | Entrée | Sortie |
|---|---|---|
| `rapports:ventes` | `{ periodeDebut; periodeFin; groupePar: "ouvrage" \| "commune" \| "jour" }` | `{ cle: string; quantite: number; montant: number }[]` |
| `rapports:marge` | `{ periodeDebut; periodeFin }` | `{ ouvrageId; titre; margeUnitaire; quantiteVendue; margeTotale }[]` |
| `rapports:exporter` | `{ type: "ventes" \| "marge" \| "creances"; format: "pdf" \| "csv"; periodeDebut?; periodeFin? }` | `{ cheminFichier: string }` |

## 9. Administration — `administration:*`

| Canal | Entrée | Sortie |
|---|---|---|
| `administration:creerUtilisateur` | `{ nom; identifiant; motDePasse; role }` | `Utilisateur` |
| `administration:sauvegarderMaintenant` | `{}` | `{ cheminSauvegarde: string; dateSauvegarde: string }` |
| `administration:listerSauvegardes` | `{}` | `string[]` (chemins complets, du plus récent au plus ancien) |
| `administration:restaurer` | `{ cheminSauvegarde: string }` | `{ ok: true }` |
| `administration:journalAudit` | `{ periodeDebut?; periodeFin?; utilisateurId? }` | `JournalAudit[]` |

## 10. Authentification (transverse) — `auth:*`

| Canal | Entrée | Sortie |
|---|---|---|
| `auth:connexion` | `{ identifiant; motDePasse }` | `{ utilisateur: Utilisateur; token: string }` |
| `auth:deconnexion` | `{}` | `{ ok: true }` |
| `auth:sessionCourante` | `{}` | `Utilisateur \| null` |

## Exemple d'exposition côté `preload.ts`

```ts
// electron/preload.ts
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  ventes: {
    creerBonLivraison: (payload: CreerBonLivraisonInput) =>
      ipcRenderer.invoke("ventes:creerBonLivraison", payload),
    listerBonsLivraison: (payload: ListerBLInput) =>
      ipcRenderer.invoke("ventes:listerBonsLivraison", payload),
    // ...
  },
  // stock, facturation, reglements, reversement, rapports, administration, auth, referentiels, receptions
});
```

Les types `CreerBonLivraisonInput`, etc. sont définis une seule fois dans `src/shared/types.ts` et importés à la fois par `src/main/ipc` (validation des handlers) et `src/renderer/api` (typage des appels), pour garantir que le contrat ne diverge jamais entre les deux côtés.
