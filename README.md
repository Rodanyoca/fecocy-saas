# FECOCY - F?d?ration congolaise de cyclisme

Premier point de contr?le : listes Ligues, Ententes, Clubs et consultation de fiche territoriale. Lecteur FECOCY et interface pr?par?s, sans d?monstration de remplacement. Voir [le mapping et la validation](docs/FECOCY_VALIDATION.md).

```powershell
npm.cmd run dev
```

URL : http://127.0.0.1:3050/ligues, puis /ententes et /clubs. Les quatre variables Google/territoire/r?f?rentiel de [.env.example](.env.example) doivent ?tre renseign?es dans `.env.local` pour la connexion applicative. Ce lot ne cr?e ni ne modifie `.env.local`.

La lecture ind?pendante du connecteur Drive a confirm? 26 ligues, dont 01 Kinshasa, et les listes Ententes/Clubs vides. Le contr?le navigateur ouvre la fiche 01 depuis une capture de ces donn?es r?elles, dans un bundle de test isol?. L'application n'importe jamais cette capture ; tant que les variables manquent, elle affiche une erreur de configuration.

Les formulaires et mutations sont d?sactiv?s au premier point de livraison. Acteurs, Affiliations, consultation des Licences, Activit?s et Documents attendent les lots suivants ; aucun compteur de licence ni num?ro g?n?r?. Comp?titions est s?par?. Aucun nouvel upload.

Tests : `node --experimental-strip-types --test tests/fecocy/territory.test.mjs`, `node scripts/fecocy-territory-ui-qa.cjs`, `npm.cmd run typecheck`, `npm.cmd run lint`. L'outillage de test d?j? install? dans le workspace est utilis? en lecture seule. Aucun push ni d?ploiement.

<details><summary>Ancien README FEACO conserv? comme archive, non applicable ? FECOCY</summary>

# FEACO — Fédération d’Athlétisme du Congo

Base locale créée depuis les interfaces réelles et l’état local courant de FEVOCO. Dépôt indépendant, aucun remote, secret ou service de production repris.

```powershell
npm ci
npm run dev
```

Ouvrir http://localhost:3006. Aucun compte nécessaire; cette duplication n’ajoute pas d’authentification. Les fiches sont fictives. Les formulaires et annulations sont explorables; sauvegardes, suppressions et uploads explicitement refusés sans succès simulé.

Voir [matrice](docs/FEACO_INTERFACE_MATRIX.md), [écarts](docs/FEACO_BUSINESS_GAPS.md), [suivi](docs/FEACO_STATUS.md), [validation](docs/FEACO_VALIDATION.md). Logo circulaire neutre. Référentiels et connexions FEACO restent à fournir. Aucun push, merge ni déploiement.

</details>
