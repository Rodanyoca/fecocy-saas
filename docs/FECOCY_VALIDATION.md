# FECOCY - validation et point de reprise

## Lot Territoire : premier point de livraison, 7 novembre 2026

?tat : lecteur et interfaces pr?par?s pour FECOCY ; connexion SDK applicative diff?r?e tant que les variables manquent. La lecture du connecteur Drive et le navigateur sur capture r?elle sont distingu?s ci-dessous. Les formulaires ne bloquent pas ce bilan et restent d?sactiv?s.

### D?p?ts, ?tat initial et ?cart court

| ?l?ment | Constat et traitement |
| --- | --- |
| Cible | Racine Git C:/Projets/SNDS-RDC/data/monosport/fecocy-managment, v?rifi?e avant modification. Tous les fichiers applicatifs initialement non suivis, aucun remote configur?. Aucun reset, nettoyage, commit ou push. |
| R?f?rence | Racine Git ../fevoco-managment, origin Rodanyoca/saas_fevoco. Nombreux changements locaux Acteurs/Affiliations/Licences/Transferts pr?sents ; consult?s sans ?criture. |
| Socle initial | Copie de la d?monstration FEACO, faux lecteurs et pseudo-IDs local-feaco. Adaptateurs de d?monstration refus?s d?sormais, anciennes API non raccord?es bloqu?es. |
| R?utilisable | Mod?le FEVOCO des listes, filtres, pagination, cartes mobiles et fiche ligue en sections Informations g?n?rales/Responsables/relations. Composants UI et apparence conserv?s. |
| ? adapter | pseudo_ligue/email_ligue et pseudo_entente/email_entente au lieu des anciens sigles/emails ; code_club et id_categorie_club r?els ; ligue du club d?duite de l'entente et incoh?rences visibles. |
| Diff?rences m?tier | Aucun comptage de cyclistes invent? ni licence d?duite d'une affiliation. Transferts automatiques, compteurs et g?n?rateurs FEVOCO non repris. Comp?titions s?par?. |
| Connexions h?rit?es | Aucun remote, .vercel, vercel.json ou .env.local dans la cible au contr?le initial. Pas de liaison locale reprise ; ?tat cloud Vercel non interrog?. Aucun secret, compte ou ID FEVOCO r?utilis?. |
| Protections | Refus des mutations conserv? et acc?s local v?rifi? avant les pages/API ; aucune authentification ou gestion d'utilisateurs ajout?e. M?dias inactifs. |

AGENTS.md et README adapt?s ? FECOCY ; anciennes matrices FEACO conserv?es comme archives. Aucun d?p?t de r?f?rence ou autre projet modifi?. Cache Next isol? sous .next-fecocy et serveur li? ? 127.0.0.1.

### Sources r?ellement lues

M?tadonn?es puis plages born?es via le connecteur Google Drive, sans ?criture :

- Territoire 01_FECOCY_STRUCTURE_TERRITORIALE : 1FofWp8rkMMSyVQjnarB58ULjMC6pGx0xCcvO-54HF1k.
- R?f?rentiel 00_FECOCY_REFERENTIEL : 1w6hUKDuak5eKmmgv0hld6qd77clWkQ0CqehXNlvqnU4.
- LIGUES : 26 lignes effectivement lues par le connecteur, IDs texte 01 ? 26 inchang?s. Fiche 01 : LIGUE DE CYCLISME  DE KINSHASA, id_province PRO01, libell? KINSHASA, statut vide.
- ENTENTES : 0 ligne ; CLUBS : 0 ligne. En-t?tes pr?sents, ?tats vides l?gitimes.
- PROVINCES : 26 lignes ; VILLES : 36 ; CATEGORIES_CLUB : 4 ; SEXES : 3. FORMATS_ID lu.

FORMATS_ID confirme ligue ## exemple 01 ; entente #### exemple 0102 (code ligue + code local 02), club ####### exemple 0102001 (ID entente + code local 001). Sa note ? Champ code_club ? ajouter ? est obsol?te : le v?ritable en-t?te CLUBS contient d?j? code_club. Aucun ajout de colonne n?cessaire ni effectu? dans ce lot. Le lecteur suit les en-t?tes r?els.

### Mapping route -> service -> feuille -> cl? -> champs

| Route | Service | Feuille / cl? | Champs physiques |
| --- | --- | --- | --- |
| /ligues, GET /api/ligues | TerritoryPage -> getTerritory -> loadTerritory/readFecocySheets | LIGUES / id_ligue | id_ligue, nom_ligue, pseudo_ligue, email_ligue, id_province, statut, observations |
| /ligues?id=01, ouverture dans la liste, GET /api/ligues/01 | territoryDetail sur les donn?es du lecteur | M?me feuille / id_ligue=01 | Province r?solue ; enfants filtr?s par ID de ligue avant d?tail. Aucun acteur ou effectif non lu. |
| /ententes, GET /api/ententes et /api/ententes/[id] | M?me lecteur, territoryDetail en fiche | ENTENTES / id_entente | id_entente, code_entente, nom_entente, pseudo_entente, id_ligue, id_ville, email_entente, statut, observations |
| /clubs, GET /api/clubs et /api/clubs/[id] | M?me lecteur, territoryDetail en fiche | CLUBS / id_club | id_club, nom_club, id_categorie_club, id_sexe, date_affiliation, id_ville, id_entente, id_ligue, statut, observations, code_club |
| Libell?s territoriaux | Projection r?f?rentielle group?e | PROVINCES, VILLES, CATEGORIES_CLUB, SEXES | IDs et noms ; VILLES porte aussi id_province. |

Les noms d'en-t?tes d?terminent les colonnes et les plages, sans index de champ fixe. Le service lit les en-t?tes par lot, puis seulement les colonnes utilis?es, avec FORMATTED_VALUE. Quatre requ?tes group?es pour deux classeurs (en-t?tes/donn?es), sans appel par ligne ; d?duplication en cours et cache 15 s. Scope Google readonly et contr?le strict des deux IDs FECOCY ; aucune valeur de repli ?trang?re.

DTO territorial commun : id, nom, code, pseudo, email organisationnel, statut, observations, IDs/libell?s parents/province/ville/cat?gorie/sexe, dateAffiliation et idLigueStockee. Les listes n'enrichissent aucun acteur, compte, passeport ou m?dia. Les parents sont r?solus par ID. Le club reste visible si son entente est introuvable ; aucune relation directe ? une ligue n'est invent?e. Un id_ligue stock? incoh?rent est conserv? et signal?, tandis que la ligue affich?e suit l'entente.

### Fonctionnalit?s et fichiers modifi?s

- lib/fecocy/config.ts : noms exacts et cibles FECOCY des sept blocs ; seuls territoire/r?f?rentiel requis pour ce lecteur.
- lib/fecocy/territory-domain.ts : projections par noms, erreurs configuration/connection/schema/not_found, cl?s uniques, mappers et relations, s?lection de fiche et diagnostics.
- lib/fecocy/sheets-server.ts : transport Google Sheets readonly, lots, valeurs format?es, d?duplication/cache court et erreurs assainies.
- lib/fecocy/access.ts et api.ts, routes app/api/ligues|ententes|clubs : r?ponses priv?es, contr?le local, GET seulement. Toutes les mutations restent refus?es.
- components/fecocy/territory-client.tsx et territory-page.tsx : tableaux, recherche, filtres, pagination, cartes mobiles, fiches en sections ; table conserv?e mont?e pendant une fiche afin de pr?server recherche/page au retour. Les responsables et cyclistes non raccord?s sont explicitement indisponibles ; les seuls compteurs sont les vrais nombres d'ententes/clubs li?s.
- app/ligues, ententes, clubs avec chargement, Header/Sidebar/DashboardLayout, DataTable/StatusBadge, app/layout et navigation : identit? FECOCY, labels accessibles, statut vide Non renseign?, responsive. Fiche 01 ouverte sur capture r?elle et contr?l?e visuellement.
- lib/google-sheets.ts/lib/env.ts et proxy.ts : plus de lecture de d?monstration, anciennes API non raccord?es en erreur explicite et mutations refus?es. Pages Acteurs, Licences, Activit?s/Documents en pr?paration, sans faux ?tat vide ; Comp?titions s?par?. Le registre Licences n'est pas appel? et COMPTEURS_LICENCES n'est jamais lu ou initialis?.
- Configuration package/lock, Next, .gitignore, README/AGENTS et documentation : port 3050, cache isol?, secrets et r?sultats de tests exclus. .env.local n'est ni cr?? ni modifi?.

### Premier bilan v?rifiable

| ?l?ment demand? | Preuve actuelle |
| --- | --- |
| URL locale | http://127.0.0.1:3050/ligues, /ententes, /clubs ; fiche directe /ligues?id=01. |
| Nombre de ligues effectivement lues | 26 par le connecteur Drive. Pas de lecture r?ussie revendiqu?e depuis le SDK Next non configur?. |
| Ouverture de la fiche 01 | R?ussie dans le navigateur isol? utilisant la capture r?elle : ID 01 conserv?, nom et province Kinshasa, statut Non renseign?, 0 entente et 0 club li?s. Aucun effectif de cyclistes invent?. |
| Ententes et Clubs | Feuilles r?ellement vides par Drive ; les deux ?tats vides ont ?t? v?rifi?s dans le navigateur isol?. |
| Application connect?e | ? v?rifier apr?s renseignement des quatre variables n?cessaires. Une configuration/source manquante donne une erreur, sans tableau vide de remplacement. |
| Formulaires et mutations | Non activ?s au premier point de livraison ; aucune cr?ation, modification ou cl?ture r?elle test?e. |

### Configuration ? renseigner

Le fichier .env.example contient neuf variables, toutes vides et sans secrets. Les valeurs sont ? renseigner dans data/monosport/fecocy-managment/.env.local ou l'environnement serveur :

| Variable | R?le / cible |
| --- | --- |
| GOOGLE_CLIENT_EMAIL | Compte de service autoris? ? lire les classeurs FECOCY. Requis d?s ce lot. |
| GOOGLE_PRIVATE_KEY | Cl? priv?e de ce compte, conserv?e c?t? serveur. Requise d?s ce lot. |
| FECOCY_STRUCTURE_TERRITORIALE_SPREADSHEET_ID | 1FofWp8rkMMSyVQjnarB58ULjMC6pGx0xCcvO-54HF1k, requis d?s ce lot. |
| FECOCY_REFERENTIELS_SPREADSHEET_ID | 1w6hUKDuak5eKmmgv0hld6qd77clWkQ0CqehXNlvqnU4, requis d?s ce lot. |
| FECOCY_ACTEURS_SPREADSHEET_ID | 1HnWrLVJYiXMa549jDkFL-EWqBJKMgdWsZpXDKcsEa6A, lot Acteurs. |
| FECOCY_AFFILIATIONS_SPREADSHEET_ID | 1sOc_chHaHFmNM5MJA-crUBtHw0dzyVc4fyLV71K9NmE, lot Affiliations. |
| FECOCY_LICENCES_SPREADSHEET_ID | 1VRX7MJDpQzJL03zkRig3ZnUDo8NtTjFzX6VCCbNV4oI, consultation ult?rieure. Aucun appel au registre dans ce lot. |
| FECOCY_ACTIVITES_SPREADSHEET_ID | 1kpXHyg12jeFrRUHrJiW3C3ew-c8bwe9JoZNxAX-EaxI, lot Activit?s. |
| FECOCY_DOCUMENTS_SPREADSHEET_ID | 18_jmkzJ4aFhcAXD0k7L-JMuXrC9L71tgP44Nmv4HtVY, lot Documents. |

Les quatre variables du premier lot sont absentes au contr?le initial. Aucun secret n'est affich? ni repris de FEVOCO. La lecture du connecteur Drive utilise sa propre connexion et ne valide pas celle de l'application. Aucun test SDK d?pendant des variables n'est lanc? tant qu'elles ne sont pas renseign?es ; ne pas attribuer ? FECOCY les erreurs de r?seau constat?es dans d'autres d?p?ts.

### Tests r?ellement ex?cut?s

- 10 tests Node r?ussis : capture des 26 IDs texte, valeurs vides, fiche 01 Kinshasa sans acteurs invent?s, colonnes r?ordonn?es dans les sept feuilles, club et parent coh?rents/incoh?rents, club orphelin visible, erreurs de sch?ma/doublon/connexion assainie, ID inconnu et refus d'une cible ?trang?re/autorit? distante. Commande : node --experimental-strip-types --test tests/fecocy/territory.test.mjs.
- node scripts/fecocy-territory-ui-qa.cjs : code 0. Vrais composants FECOCY avec capture Drive, r?seau bloqu? : pagination 10/10/6, code 01, fiche 01, champs Kinshasa et statut vide, enfants vides, retour conservant la recherche, filtre Kwango code 02, ?tats Ententes/Clubs vides, mobile 390 px sans d?bordement et aucune erreur JavaScript.
- Captures sous test-results/fecocy/ (ignor?es Git), fiche 01, Clubs vide et Ligues mobile examin?s visuellement. Ce bundle de test n'est jamais import? par une route et ne sert pas de repli ? Google. L'outillage esbuild/Playwright existant est utilis? en lecture seule, sans installation ou ?criture dans une r?f?rence.
- npm.cmd run typecheck et npm.cmd run lint : code 0. Lint est ici ESLint r?el.
- Aucun test de cr?ation ou correction de structure encore revendiqu? ; la validation serveur des nouvelles ?critures, des codes uniques et de l'ID immuable appartient au lot formulaires.
- Aucun build complet ? ce point de contr?le, selon la consigne. Aucun sch?ma Drive modifi?, aucune ?criture de test en production, aucun upload, push ni d?ploiement.

### Prochaine action exacte

1. Montrer ce premier r?sultat et renseigner les quatre variables du territoire quand l'utilisateur sera pr?t. V?rifier le SDK et l'application en lecture seule : 26 ligues, fiche 01, enfants vides et erreurs distinctes. Ne pas cr?er de donn?e de test dans le classeur de production.
2. Apr?s ce point : fiches/formulaires territoriaux adapt?s aux colonnes FECOCY et dates centrales ; parents existants et codes locaux uniques, 01 + 02 -> 0102 puis 0102 + 001 -> 0102001. Correction conservant l'ID ; changement de parent sans renum?rotation silencieuse. Tester les mutations uniquement sur fixtures ou classeur de test autoris? avant activation.
3. Acteurs : lire les six en-t?tes FECOCY r?els avant raccordement, commencer Cyclistes ; identifiant de fiche, id_uci facultatif et num?ro de licence r?ellement enregistr? restent distincts. Aucune licence fictive depuis id_national, listes limit?es et coordonn?es/pi?ces prot?g?es.
4. Affiliations : relire ATHLETE_AFFILIATIONS, COACH_AFFILIATIONS, MEDECIN_AFFILIATIONS et cl?s par cat?gorie ; club, id_saison, dates et id_statut_affiliation. R?soudre SAISON/STATUTS_AFFILIATION, sans bornes d?duites du libell?. Terminer : m?me ligne, m?me ID, date de fin et SAF002 uniquement, sans cl?ture d'une autre affiliation. Pr?server les clubs inconnus/inactifs/renomm?s. id_affiliation_precedente, si renseign?, doit concerner le m?me cycliste ; aucun transfert automatique ni effet automatique sur licence. Mandats s?par?s.
5. Consultation Licences : relire ATHLETE_LICENCES et ACTEURS_LICENCES ; r?soudre athl?te/affiliation/saison/club_attribution et les autres acteurs par type + ID. Conserver le club historique d'attribution m?me diff?rent du club actuel ; registre vide -> Aucune licence enregistr?e. Aucun appel/init de COMPTEURS_LICENCES, aucune d?livrance, renouvellement ou num?rotation. D?cisions ? valider : acteurs concern?s, validit?, format du num?ro et effet du changement de club, lien ?ventuellement facultatif club/saison.
6. Apr?s le parcours principal : Activit?s/Documents, en-t?tes et relations par type + ID, acc?s aux fichiers d?j? r?f?renc?s conserv?s, aucun nouvel upload. Comp?titions reste un lot s?par?. Les cl?s FED005 -> CYC et DISC062/063/064/065 sont fournies par la consigne ; ? v?rifier dans le lot sportif concern?.

Les classeurs des lots Acteurs/Affiliations/Licences/Activit?s/Documents n'ont pas encore ?t? lus ni raccord?s dans ce premier point territorial. Les recettes affiliation cl?tur?e et licence historique avec club d'attribution diff?rent restent explicitement ? ex?cuter lors de ces lots.

Contr?les HTTP Next locaux : GET /api/ligues, /api/ligues/01, /api/ententes et /api/clubs -> 503 avec code configuration et les quatre noms manquants ; aucun appel SDK Google. POST /api/ligues -> 409. GET /ligues?id=01 -> 200, erreur Configuration FECOCY incompl?te visible et aucun faux ?tat Aucune donn?e trouv?e. Serveur 127.0.0.1:3050 laiss? actif. .env.local absent, aucune valeur ajout?e ou modifi?e.

### Sortie de build Vercel

Next.js utilise le dossier standard `.next` lorsque `VERCEL=1`, attendu par Vercel. En local, le cache reste isole dans `.next-fecocy` pour eviter les conflits avec les autres applications. La configuration est couverte par `npm run test:build-config`.
