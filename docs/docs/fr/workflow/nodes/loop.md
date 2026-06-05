---
pkg: '@nocobase/plugin-workflow-loop'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Boucle

## Introduction

Une boucle est l'équivalent des structures syntaxiques comme `for`, `while` ou `forEach` dans les langages de programmation. Vous pouvez utiliser un nœud de boucle lorsque vous avez besoin de répéter certaines opérations un nombre défini de fois ou pour une collection de données (un tableau).

## Installation

C'est un plugin intégré, il ne nécessite donc aucune installation.

## Création d'un nœud

Dans l'interface de configuration du flux de travail, cliquez sur le bouton plus (« + ») dans le flux pour ajouter un nœud « Boucle » :

![Création d'un nœud de boucle](https://static-docs.nocobase.com/b3c8061a66bfff037f4b9509ab0aad75.png)

Après avoir créé un nœud de boucle, une branche interne à la boucle est générée. Vous pouvez ajouter autant de nœuds que vous le souhaitez dans cette branche. Ces nœuds peuvent utiliser non seulement les variables du contexte global du flux de travail, mais aussi les variables locales du contexte de la boucle, comme l'objet de données parcouru à chaque itération de la collection de la boucle, ou l'index du nombre d'itérations (l'index commence à `0`). La portée des variables locales est limitée à l'intérieur de la boucle. En cas de boucles imbriquées, vous pouvez utiliser les variables locales de la boucle spécifique à chaque niveau.

## Configuration du nœud

![20241016135326](https://static-docs.nocobase.com/20241016135326.png)

### Objet de la boucle

La boucle traite différemment les différents types de données de l'objet de la boucle :

1.  **Tableau** : C'est le cas le plus courant. Vous pouvez généralement sélectionner une variable du contexte du flux de travail, comme les multiples résultats de données d'un nœud de requête, ou des données de relation un-à-plusieurs préchargées. Si un tableau est sélectionné, le nœud de boucle parcourra chaque élément du tableau, et à chaque itération, l'élément actuel sera assigné à une variable locale dans le contexte de la boucle.

2.  **Nombre** : Lorsque la variable sélectionnée est un nombre, celui-ci sera utilisé comme nombre d'itérations. La valeur doit être un entier positif ; les nombres négatifs n'entreront pas dans la boucle, et la partie décimale d'un nombre sera ignorée. L'index du nombre d'itérations dans la variable locale correspond également à la valeur de l'objet de la boucle. Cette valeur commence à **0**. Par exemple, si l'objet de la boucle est le nombre 5, l'objet et l'index à chaque itération seront successivement : 0, 1, 2, 3, 4.

3.  **Chaîne de caractères** : Lorsque la variable sélectionnée est une chaîne de caractères, sa longueur sera utilisée comme nombre d'itérations, traitant chaque caractère de la chaîne par son index.

4.  **Autre** : Les autres types de valeurs (y compris les types d'objets) sont traités comme un objet de boucle à élément unique et ne boucleront qu'une seule fois. Dans ce cas, l'utilisation d'une boucle n'est généralement pas nécessaire.

En plus de sélectionner une variable, vous pouvez également saisir directement des constantes pour les types nombre et chaîne de caractères. Par exemple, si vous saisissez `5` (type nombre), le nœud de boucle itérera 5 fois. Si vous saisissez `abc` (type chaîne de caractères), le nœud de boucle itérera 3 fois, traitant respectivement les caractères `a`, `b` et `c`. Dans l'outil de sélection de variables, choisissez le type souhaité pour la constante.

### Condition de la boucle

Depuis la version `v1.4.0-beta`, de nouvelles options liées aux conditions de boucle ont été ajoutées. Vous pouvez activer les conditions de boucle dans la configuration du nœud.

**Condition**

Similaire à la configuration des conditions dans un nœud de condition, vous pouvez combiner des configurations et utiliser des variables de la boucle actuelle, telles que l'objet de la boucle, l'index de la boucle, etc.

**Moment de la vérification**

À l'instar des constructions `while` et `do/while` des langages de programmation, vous pouvez choisir d'évaluer la condition configurée avant le début de chaque itération ou après la fin de chaque itération. L'évaluation de la condition après l'itération permet d'exécuter les autres nœuds du corps de la boucle une première fois avant que la condition ne soit vérifiée.

**Lorsque la condition n'est pas remplie**

À l'instar des instructions `break` et `continue` des langages de programmation, vous pouvez choisir de quitter la boucle ou de passer à l'itération suivante.

### Gestion des erreurs dans les nœuds de boucle

Depuis la version `v1.4.0-beta`, lorsqu'un nœud à l'intérieur de la boucle échoue (en raison de conditions non remplies, d'erreurs, etc.), vous pouvez configurer le flux de travail suivant. Trois méthodes de gestion sont prises en charge :

*   Quitter le flux de travail (comme `throw` en programmation)
*   Quitter la boucle et continuer le flux de travail (comme `break` en programmation)
*   Passer à l'objet de boucle suivant (comme `continue` en programmation)

La valeur par défaut est « Quitter le flux de travail », mais vous pouvez la modifier selon vos besoins.

## Exemple

Par exemple, lorsqu'une commande est passée, vous devez vérifier le stock de chaque produit de la commande. Si le stock est suffisant, déduisez-le ; sinon, mettez à jour le produit dans le détail de la commande comme invalide.

1.  Créez trois collections : Produits <-(1:m)-- Détails de commande --(m:1)-> Commandes. Le modèle de données est le suivant :

    **Collection Commandes**
    | Nom du champ | Type de champ |
    | ------------ | -------------- |
    | Détails de commande | Un-à-plusieurs (Détails de commande) |
    | Prix total de la commande | Nombre |

    **Collection Détails de commande**
    | Nom du champ | Type de champ |
    | -------- | -------------- |
    | Produit | Plusieurs-à-un (Produit) |
    | Quantité | Nombre |

    **Collection Produits**
    | Nom du champ | Type de champ |
    | -------- | -------- |
    | Nom du produit | Texte sur une seule ligne |
    | Prix | Nombre |
    | Stock | Entier |

2.  Créez un flux de travail. Pour le déclencheur, sélectionnez « Événement de collection » et choisissez la collection « Commandes » pour déclencher « Après l'ajout d'un enregistrement ». Vous devez également configurer le préchargement des données de relation de la collection « Détails de commande » et de la collection « Produits » associées aux détails :

    ![Nœud de boucle_Exemple_Configuration du déclencheur](https://static-docs.nocobase.com/0086601c2fc0e17a64d046a4c86b49b7.png)

3.  Créez un nœud de boucle et sélectionnez l'objet de la boucle comme « Données de déclenchement / Détails de commande », ce qui signifie qu'il traitera chaque enregistrement de la collection Détails de commande :

    ![Nœud de boucle_Exemple_Configuration du nœud de boucle](https://static-docs.nocobase.com/2507becc32db5a9a0641c198605a20da.png)

4.  À l'intérieur du nœud de boucle, créez un nœud « Condition » pour vérifier si le stock du produit est suffisant :

    ![Nœud de boucle_Exemple_Configuration du nœud de condition](https://static-docs.nocobase.com/a6d08d15786841e1a3512b38e4629852.png)

5.  Si le stock est suffisant, créez un nœud « Calcul » et un nœud « Mettre à jour l'enregistrement » dans la branche « Oui » pour mettre à jour l'enregistrement du produit correspondant avec le stock déduit calculé :

    ![Nœud de boucle_Exemple_Configuration du nœud de calcul](https://static-docs.nocobase.com/8df3604c71f8f8705b1552d3ebfe3b50.png)

    ![Nœud de boucle_Exemple_Configuration du nœud de mise à jour du stock](https://static-docs.nocobase.com/2d84baa9b3b1bd85fccda9eec992378.png)

6.  Sinon, dans la branche « Non », créez un nœud « Mettre à jour l'enregistrement » pour mettre à jour le statut du détail de commande en « invalide » :

    ![Nœud de boucle_Exemple_Configuration du nœud de mise à jour du détail de commande](https://static-docs.nocobase.com/4996613090c254c69a1d80f3b3a7fae2.png)

La structure globale du flux de travail est la suivante :

![Nœud de boucle_Exemple_Structure du flux de travail](https://static-docs.nocobase.com/6f59ef246c1f19976344a7624c4c4151.png)

Une fois ce flux de travail configuré et activé, lorsqu'une nouvelle commande est créée, le stock des produits dans les détails de commande est automatiquement vérifié. Si le stock est suffisant, il est déduit ; sinon, le produit dans le détail de commande est mis à jour comme invalide (afin qu'un prix total de commande valide puisse être calculé).