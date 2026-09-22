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

## 2026-09 — Prisma 7 : configuration par adapter (impact Phase 1)

- **Constat** : Prisma 7 (utilisé dès le scaffolding) a retiré le support de `datasource.url` dans `schema.prisma` pour Migrate/Client — la connexion se configure désormais dans `prisma.config.ts` (racine), et `PrismaClient` s'instancie avec un **driver adapter** plutôt qu'un moteur Rust intégré.
- **Décision** : adapter SQLite = `@prisma/adapter-better-sqlite3` (+ dépendance native `better-sqlite3`). `schema.prisma` ne contient plus que `datasource db { provider = "sqlite" }` (sans `url`) ; la variable `DATABASE_URL` est chargée depuis `.env` via `dotenv/config` dans `prisma.config.ts` et référencée par `env("DATABASE_URL")` (import `env` depuis `prisma/config`, pas depuis le DSL du schéma).
- **Impact** : `src/main/data` (Phase 1) doit instancier le client ainsi : `new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) })` — ne pas suivre les exemples Prisma < 7 (`new PrismaClient()` sans adapter, ou `url` dans le schéma), qui ne fonctionnent plus. Voir `prisma.config.ts` et `prisma/schema.prisma`.

## 2026-09 — Utilisateur admin seedé provisoirement (à retirer en Phase 4)

- **Constat** : `MouvementStock` et `BonLivraison` exigent un `utilisateurId` réel (RG-05), mais aucun écran d'authentification n'existe encore (prévu Phase 4, module 8.9).
- **Décision provisoire** : `prisma/seed.ts` crée un compte `admin` / `admin` (mot de passe hashé scrypt) pour permettre aux services Phase 1 (réception, ajustement) d'attribuer un utilisateur réel aux mouvements de stock.
- **Impact / à faire en Phase 4** : ce seed automatique d'un compte admin par défaut entre en tension avec `docs/ROADMAP.md` Phase 6 (« création du premier compte administrateur » lors de l'installation). Revoir/retirer ce seed (ou le limiter à l'environnement de dev) une fois l'écran Administration et l'authentification réels implémentés — ne pas livrer un identifiant/mot de passe par défaut connu en production sans forcer son changement.

## 2026-09-22 — better-sqlite3 doit être recompilé pour l'ABI d'Electron (piège critique)

- **Constat** : `npm install` compile les modules natifs (`better-sqlite3`) pour l'ABI de **Node.js**. Or le processus principal Electron embarque son propre Node avec une ABI **différente** (`NODE_MODULE_VERSION` distincte). Résultat : lancer l'app réelle (`npm run dev` / build packagé) sans recompiler fait planter silencieusement toute requête Prisma (`ERR_DLOPEN_FAILED`) — piège d'autant plus sournois que la couche IPC (`versResultat`) avale l'erreur et renvoie juste `ok:false`, donnant l'impression d'un écran vide plutôt que d'un module cassé.
- **Décision** : ajout de `@electron/rebuild` en devDependency, avec des scripts npm en garde-fou qui recompilent automatiquement le bon ABI selon la commande lancée : `predev`/`prebuild` → `electron-rebuild -f -w better-sqlite3` (ABI Electron) ; `pretest` → `npm rebuild better-sqlite3` (ABI Node, pour Vitest qui tourne sous Node nu). Les deux états ne peuvent pas coexister dans le même `node_modules` : chaque script se charge de remettre le bon état avant de s'exécuter.
- **Impact** : `package.json` (scripts + devDependency). Si un nouveau script exécute Prisma sous Electron OU sous Node nu, veiller à ce qu'il passe par le bon `pre*` hook (ou lancer `npm rebuild better-sqlite3` / `npx electron-rebuild -f -w better-sqlite3` manuellement selon le contexte).

## 2026-09-22 — Génération PDF : fenêtre cachée + loadFile (pas data: URL)

- **Constat** : `loadURL('data:text/html;...')` avec un document HTML de taille normale (quelques Ko) échoue de façon intermittente (`ERR_FAILED`) — remplacé par l'écriture d'un fichier HTML temporaire chargé via `loadFile()`, fiable depuis.
- **Décision** : ne jamais réintroduire `loadURL('data:...')` pour la génération de PDF dans ce projet.
- **Impact** : `src/main/documents/genererPdf.ts`.
- **Piège de diagnostic à ne pas reproduire** (2026-09-22, re-investigué) : un script de smoke test autonome qui appelle `genererPdfDepuisHtml` puis se termine peut sembler « planter silencieusement » (exit code 0, aucune erreur, arrêt juste après l'écriture du PDF). Ce n'est **pas** un bug de `genererPdf.ts` — le PDF est bien généré (vérifié par logs de diagnostic : `printToPDF` et `writeFile` réussissent systématiquement). La cause réelle : le script de test n'a **aucune fenêtre principale** ; `fenetre.destroy()` dans le `finally` de `genererPdfDepuisHtml` détruit alors la **seule** fenêtre ouverte, ce qui déclenche le comportement par défaut d'Electron (`window-all-closed` → `app.quit()` implicite en l'absence de handler), coupant le process avant la fin du script appelant. **Non reproductible dans la vraie app** : `electron/main.ts` a toujours une fenêtre principale ouverte quand l'utilisateur imprime un document, donc fermer la fenêtre PDF temporaire ne déclenche jamais `window-all-closed`. Pour tout futur smoke test autonome qui génère un PDF, ajouter `app.on('window-all-closed', () => {})` en tête de script pour éviter ce faux négatif.

## 2026-09-22 — RG-08 : prixAchat figé sur LigneBonLivraison (pas seulement LigneReversement)

- **Constat** : le schéma de référence initial (`docs/DATA_MODEL.md` v1) ne figeait le prix d'achat que sur `LigneReversement`, censé être calculé au moment du reversement. Mais RG-08 exige explicitement le prix « au moment de la vente », qui peut différer du prix d'achat courant de l'ouvrage si une réception à un nouveau prix a eu lieu entre la vente et la génération du reversement — l'information était donc perdue.
- **Décision** : ajout de `LigneBonLivraison.prixAchatUnitaire` (figé à `Ouvrage.prixAchat` au moment de `creerBonLivraison`, dans la même transaction que le contrôle de stock RG-04). `genererEtatReversement` regroupe les lignes par `(ouvrageId, prixAchatUnitaire)` — si le prix a varié en cours de période, plusieurs `LigneReversement` sont produites pour le même ouvrage plutôt qu'un prix moyen approximatif.
- **Impact** : `prisma/schema.prisma`, `docs/DATA_MODEL.md` (§3 et §5), `services/ventes.ts` (creerBonLivraison), `services/reversement.ts`. Migration `20260922175918_ligne_bl_prix_achat_fige`.

## 2026-09-22 — RG-10 : verrouillage implémenté dans `annulerBonLivraison`

- **Décision** : `services/ventes.ts` `annulerBonLivraison` vérifie qu'aucun `Reversement` `CLOTURE` ne couvre la `dateBL` du bon avant d'autoriser l'annulation (code d'erreur `PERIODE_CLOTUREE`, conforme à `docs/API_CONTRACT.md`). Aucun autre point de mutation des ventes n'existe à ce stade (pas de modification de BL hors annulation), donc ce seul point de contrôle suffit à honorer RG-10 pour l'instant.
- **Impact** : si un futur module permet de modifier une vente autrement (ex. correction de ligne), il devra reprendre la même vérification.

## 2026-09-22 — Authentification réelle : le compte admin seedé retrouve son rôle prévu

- **Décision** : implémentation d'une vraie authentification (`services/auth.ts`, session en mémoire dans `src/main/session.ts`, un seul utilisateur connecté à la fois — cohérent avec l'app mono-poste). Le contournement provisoire (`getCurrentUserId` qui utilisait toujours le compte admin sans connexion) est supprimé ; tous les IPC exigeant un utilisateur tracé (RG-05) appellent désormais `utilisateurCourantIdObligatoire()`, qui lève `NON_AUTHENTIFIE` en l'absence de session.
- **Résolution de la tension notée le 2026-09-22 (Phase 1)** : le compte `admin`/`admin` seedé (`prisma/seed.ts`) n'est plus contourné — il redevient ce qu'il aurait toujours dû être : le compte de démarrage à utiliser pour la première connexion (résout le problème d'amorçage : il faut un compte pour créer les autres comptes). Toujours à changer/documenter avant mise en production réelle (Phase 6).
- **Contrôle d'accès** : `administration:creerUtilisateur` exige que l'utilisateur courant ait le rôle `ADMINISTRATEUR` (`services/administration.ts`).
- **Impact** : `src/main/session.ts` (réécrit), `services/auth.ts`, `services/administration.ts`, tous les handlers IPC mutants (stock, receptions, ventes, referentiels:modifierOuvrage), `src/renderer/app.tsx` (gate de connexion), nouvel écran `Login`.

## 2026-09-22 — Journal d'audit câblé sur les 3 actions citées par CLAUDE.md §6

- **Décision** : `journaliser()` (`services/journalAudit.ts`) est appelé dans exactement les trois cas explicitement cités par CLAUDE.md §6 : ajustement de stock (`AJUSTEMENT_STOCK`), annulation de bon de livraison (`ANNULATION_BL`), modification de prix d'un ouvrage (`MODIFICATION_PRIX`, uniquement si prixAchat/prixVente changent réellement). `modifierOuvrage` a changé de signature pour accepter `utilisateurId` (nécessaire à la traçabilité) — tous les appels existants (tests, IPC) ont été mis à jour.
- **Non fait volontairement** : pas de journalisation sur l'annulation de facture (fonctionnalité elle-même non implémentée à ce stade) ni sur les créations simples (RG-05 couvre déjà la traçabilité des mouvements de stock via `MouvementStock`, la duplication dans `JournalAudit` n'apporterait rien).

## 2026-09-22 — Sauvegarde automatique : nom du dossier userData dépend de package.json

- **Constat pratique** : `app.getPath('userData')` résout vers `%APPDATA%\Electron` quand Electron est lancé sur un script arbitraire (ex. nos smoke tests `electron.exe script.cjs`), mais vers `%APPDATA%\<name du package.json>` (ici `gestion-stock-supernova`) quand il charge le vrai `package.json` de l'app (`electron.exe .` ou l'app empaquetée). Les sauvegardes de l'app réelle sont donc dans `%APPDATA%\gestion-stock-supernova\backups`, pas `%APPDATA%\Electron\backups`.
- **Vérifié** : deux lancements successifs de l'app réelle (build production, `electron.exe .`) ont chacun produit une sauvegarde automatique au démarrage ; une copie d'une sauvegarde a été relue avec succès via Prisma (communes, fournisseur, utilisateur admin intacts).
- **Impact** : `src/main/backup.ts`, `electron/main.ts` (`demarrerSauvegardeAutomatique`). À revoir en Phase 6 si un `productName` différent est fixé dans la configuration `electron-builder`.

## Modèle de décision à suivre pour les prochaines entrées

```
## AAAA-MM — <titre court de la décision>
- **Décision** : <ce qui a été décidé, en une phrase>
- **Justification** : <pourquoi, en une phrase ou deux>
- **Impact** : <fichiers/modules concernés>
```
