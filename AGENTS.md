# FECOCY - consignes du d?p?t

Modifier uniquement FECOCY. Avant tout lot, lire `docs/FECOCY_VALIDATION.md` pour les mappings, les preuves et le point de reprise. FEVOCO local reste la r?f?rence d'interface en lecture seule ; les anciennes consignes FEACO sont historiques.

Parcours cible : Ligue -> Entente -> Club -> Cycliste -> Affiliation, puis consultation des licences. Reprendre les en-t?tes FECOCY par nom. Les lecteurs actifs sont dans lib/fecocy ; conserver les ?tats configuration, connexion, sch?ma et vide distincts, sans retour vers la d?monstration.

Pr?server les codes texte et leurs z?ros initiaux ; une correction conserve sa cl?. R?utiliser lib/compact-date.ts pour les dates. Charger les historiques et d?tails secondaires ? la demande, apr?s filtrage par identifiant, et limiter les DTO de liste.

Les valeurs d'environnement restent ? la main de l'utilisateur ; maintenir .env.example sans secrets. Distinguer lecture du connecteur Drive, simulation et connexion SDK r?ellement valid?e dans chaque bilan.

Les mutations actuelles restent refus?es jusqu'au lot formulaires valid? sur fixtures. Comp?titions est un lot s?par?. Authentification, utilisateurs et m?dias hors p?rim?tre. Aucun changement de sch?ma Drive, push, d?ploiement ou test d'?criture en production.
