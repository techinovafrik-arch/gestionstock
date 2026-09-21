# Règles de gestion (RG-01 à RG-14)

Ces règles sont **normatives**. Elles doivent être implémentées exclusivement dans `src/main/services`, et chacune doit être couverte par au moins un test unitaire dans `tests/services`. Toute tâche de développement touchant au stock, aux ventes, à la facturation ou au reversement doit citer la ou les RG concernées.

| # | Règle | Où l'implémenter |
|---|---|---|
| RG-01 | Chaque ouvrage possède un prix d'achat (convenu avec Supernova) et un prix de vente (majoré). Le prix de vente doit toujours être strictement supérieur au prix d'achat. | Validation à la création/modification d'un `Ouvrage` (`services/ouvrages.ts`) |
| RG-02 | Le stock est géré de façon centralisée et unique, au niveau de l'entrepôt de Port-Bouët : chaque ouvrage possède un seul niveau de stock disponible, quelle que soit la commune de livraison. Aucune ventilation par commune. | Modèle de données (`Ouvrage.quantiteDisponible`) + absence de toute logique de dépôt multiple |
| RG-03 | Le stock disponible résulte de l'ensemble des mouvements : + réceptions, − ventes, − retours vers Supernova, +/− ajustements. | `services/stock.ts` — fonction de recalcul/écriture transactionnelle |
| RG-04 | Aucune vente ne peut être enregistrée si elle conduit le stock disponible d'un ouvrage à devenir négatif, quelle que soit la commune de livraison du client. | `services/ventes.ts` — contrôle avant toute écriture de `BonLivraison` |
| RG-05 | Tout mouvement de stock est horodaté, tracé, associé à un utilisateur et, si applicable, à un document. | `services/stock.ts` — champs obligatoires sur `MouvementStock` |
| RG-06 | Un bon de livraison est obligatoirement généré pour toute sortie de stock destinée à un client ; il précise la commune de livraison, sans effet sur le stock. | `services/ventes.ts` |
| RG-07 | Une facture peut regrouper un ou plusieurs bons de livraison d'un même client ; elle reprend les lignes des BL associés et calcule le montant total, diminué d'une remise éventuelle. | `services/facturation.ts` |
| RG-08 | Le montant dû à Supernova pour un ouvrage vendu = quantité vendue × prix d'achat au moment de la vente. Indépendant du prix de vente pratiqué, de la remise accordée, et de la commune de livraison. | `services/reversement.ts` — figer `prixAchatUnitaire` à la date de vente |
| RG-09 | Les retours vers Supernova ne génèrent aucune facturation client et sont exclus du calcul des reversements dus. | `services/retours.ts`, `services/reversement.ts` |
| RG-10 | Un état de reversement est établi par période paramétrable ; une fois un versement enregistré comme effectué, les ventes de cette période ne peuvent plus être modifiées sans ajustement explicite et tracé. | `services/reversement.ts` — verrouillage sur `statutReversement = CLOTURE` |
| RG-11 | La numérotation des bons de livraison et des factures est séquentielle, unique, non modifiable après création (format `BL-AAAA-NNNNNN` / `FAC-AAAA-NNNNNN`). | `services/numerotation.ts` — génération transactionnelle, jamais côté UI |
| RG-12 | Un seuil d'alerte de stock minimal peut être défini par ouvrage ; le système signale les ouvrages en deçà de ce seuil. | `services/stock.ts` + tableau de bord |
| RG-13 | Aucune suppression sur les documents déjà émis (BL, facture) ; seule une annulation tracée (avec motif) est autorisée, générant les mouvements de stock inverses nécessaires. | `services/ventes.ts`, `services/facturation.ts` — pas d'opération `DELETE` |
| RG-14 | La base de données fait l'objet d'une sauvegarde automatique régulière, pour limiter le risque de perte de données sur un poste unique. | `src/main/backup.ts`, tâche planifiée au démarrage/à heure fixe |

## Exemples de cas de test à couvrir (non exhaustif)

- **RG-01** : création d'un ouvrage avec `prixVente <= prixAchat` → rejet.
- **RG-04** : tentative de vente d'une quantité supérieure à `quantiteDisponible` → rejet, aucun `MouvementStock` créé.
- **RG-08** : une vente à prix remisé au client ne doit pas modifier le `prixAchatUnitaire` utilisé dans `LigneReversement`.
- **RG-10** : après clôture d'un reversement, une tentative de modification d'une vente de la période clôturée doit être rejetée ou exiger un ajustement explicite tracé.
- **RG-11** : deux bons de livraison créés en parallèle (concurrence) ne doivent jamais obtenir le même `numeroBL`.
- **RG-13** : toute tentative d'appel `DELETE` sur `BonLivraison`/`Facture` déjà `EMIS`/`EMISE` doit échouer ; seule une annulation via le service dédié est permise.
