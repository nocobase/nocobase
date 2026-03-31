:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Branchement multi-conditions <Badge>v2.0.0+</Badge>

## Introduction

Similaire aux instructions `switch / case` ou `if / else if` que l'on trouve dans les langages de programmation. Le système évalue les conditions configurées de manière séquentielle. Dès qu'une condition est remplie, le flux de travail exécute la branche correspondante et ignore les vérifications de conditions suivantes. Si aucune condition n'est satisfaite, la branche « Sinon » est exécutée.

## Créer un nœud

Dans l'interface de configuration du flux de travail, cliquez sur le bouton plus (« + ») dans le flux pour ajouter un nœud de « Branchement multi-conditions » :

![Créer un nœud de branchement multi-conditions](https://static-docs.nocobase.com/20251123222134.png)

## Gestion des branches

### Branches par défaut

Après sa création, le nœud inclut deux branches par défaut :

1.  **Branche de condition** : Permet de configurer des conditions de jugement spécifiques.
2.  **Branche « Sinon »** : Activée lorsqu'aucune des branches de condition n'est satisfaite ; elle ne nécessite aucune configuration de condition.

Cliquez sur le bouton « Ajouter une branche » sous le nœud pour ajouter d'autres branches de condition.

![20251123222540](https://static-docs.nocobase.com/20251123222540.png)

### Ajouter une branche

Après avoir cliqué sur « Ajouter une branche », la nouvelle branche est ajoutée avant la branche « Sinon ».

![20251123222805](https://static-docs.nocobase.com/20251123222805.png)

### Supprimer une branche

Lorsqu'il existe plusieurs branches de condition, cliquez sur l'icône de la corbeille à droite d'une branche pour la supprimer. S'il ne reste qu'une seule branche de condition, vous ne pourrez pas la supprimer.

![20251123223127](https://static-docs.nocobase.com/20251123223127.png)

:::info{title=Conseil}
La suppression d'une branche entraînera également la suppression de tous les nœuds qu'elle contient ; veuillez procéder avec prudence.

La branche « Sinon » est une branche intégrée et ne peut pas être supprimée.
:::

## Configuration du nœud

### Configuration des conditions

Cliquez sur le nom de la condition en haut d'une branche pour modifier les détails spécifiques de la condition :

![20251123223352](https://static-docs.nocobase.com/20251123223352.png)

#### Libellé de la condition

Prend en charge les libellés personnalisés. Une fois renseigné, il sera affiché comme nom de la condition dans le diagramme de flux. S'il n'est pas configuré (ou laissé vide), il affichera par défaut « Condition 1 », « Condition 2 », etc., dans l'ordre.

![20251123224209](https://static-docs.nocobase.com/20251123224209.png)

#### Moteur de calcul

Actuellement, trois moteurs sont pris en charge :

-   **Basique** : Utilise des comparaisons logiques simples (par exemple, égal à, contient) et des combinaisons « ET »/« OU » pour déterminer les résultats.
-   **Math.js** : Prend en charge le calcul d'expressions en utilisant la syntaxe [Math.js](https://mathjs.org/).
-   **Formula.js** : Prend en charge le calcul d'expressions en utilisant la syntaxe [Formula.js](https://formulajs.info/) (similaire aux formules Excel).

Les trois modes prennent en charge l'utilisation des variables de contexte du flux de travail comme paramètres.

### Quand aucune condition n'est satisfaite

Dans le panneau de configuration du nœud, vous pouvez définir l'action à suivre lorsqu'aucune condition n'est satisfaite :

![20251123224348](https://static-docs.nocobase.com/20251123224348.png)

*   **Terminer le flux de travail en échec (par défaut)** : Marque le statut du flux de travail comme échoué et met fin au processus.
*   **Continuer l'exécution des nœuds suivants** : Une fois le nœud actuel terminé, continue l'exécution des nœuds suivants dans le flux de travail.

:::info{title=Conseil}
Quelle que soit la méthode de traitement choisie, lorsqu'aucune condition n'est satisfaite, le flux entrera d'abord dans la branche « Sinon » pour exécuter les nœuds qu'elle contient.
:::

## Historique d'exécution

Dans l'historique d'exécution du flux de travail, le nœud de branchement multi-conditions identifie le résultat de chaque condition à l'aide de différentes couleurs :

-   **Vert** : Condition satisfaite ; la branche a été exécutée.
-   **Rouge** : Condition non satisfaite (ou erreur de calcul) ; cette branche a été ignorée.
-   **Bleu** : Évaluation non exécutée (ignorée car une condition précédente était déjà satisfaite).

![20251123225455](https://static-docs.nocobase.com/20251123225455.png)

Si une erreur de configuration provoque une exception de calcul, en plus de l'affichage en rouge, le survol du nom de la condition affichera des informations d'erreur spécifiques :

![20251123231014](https://static-docs.nocobase.com/20251123231014.png)

Lorsqu'une exception de calcul de condition se produit, le nœud de branchement multi-conditions se terminera avec un statut « Erreur » et ne continuera pas l'exécution des nœuds suivants.