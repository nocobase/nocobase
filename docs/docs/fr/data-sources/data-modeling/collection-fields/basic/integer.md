---
title: "Entier"
description: "Le champ entier sert à enregistrer des valeurs sans décimales, comme des quantités, des effectifs, des nombres d'occurrences ou des durées en jours."
keywords: "entier,integer,champ numérique,NocoBase"
---

# Entier

## Présentation

Dans NocoBase, **l'entier (Integer)** sert à enregistrer des valeurs sans décimales.

Le champ entier convient aux données métier telles que les quantités, le nombre d'occurrences, les effectifs ou les numéros d'ordre. Il peut être utilisé pour le filtrage, le tri, les statistiques, les autorisations et les conditions des workflows.

Pour enregistrer des décimales, des montants, des poids ou des proportions, il est préférable de choisir [Numérique](./number.md) ou [Pourcentage](./percent.md).

## Cas d'utilisation

Les entiers conviennent notamment aux cas d'utilisation suivants :

- Quantité de produits, quantité en stock, quantité achetée
- Nombre de participants, places restantes, statistiques d'occurrences
- Durée en jours, jours de retard, délai de paiement en jours
- Codes entiers provenant de systèmes externes

## Créer et configurer

Dans la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « Entier » pour créer un champ entier.

![20240512175723](https://static-docs.nocobase.com/20240512175723.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d'interface du champ. Pour un entier, il correspond à `integer` et détermine la manière dont la valeur est saisie et affichée dans l'interface. |
| Field display name | Nom affiché pour le champ dans l'interface, par exemple « Quantité », « Effectif » ou « Jours de retard ». Il est recommandé d'utiliser un nom immédiatement compréhensible par les utilisateurs métier. |
| Field name | Nom d'identification du champ, utilisé pour les références internes dans l'API, les champs de relation, les autorisations, les workflows, etc. Il n'est généralement plus modifiable après la création, accepte uniquement les lettres, les chiffres et les traits de soulignement, et doit commencer par une lettre. |
| Field type | Type du champ au niveau des données. Par défaut, un champ entier est de type `integer` ; pour les entiers de grande taille, il est possible de choisir `bigInt`. |
| Default value | Valeur par défaut. Lors de la création d'un enregistrement, cette valeur peut être renseignée automatiquement si l'utilisateur ne saisit rien. |
| Validation rules | Règles de validation. Elles peuvent limiter la valeur minimale, la valeur maximale ou imposer que le champ soit obligatoire. |
| Description | Description du champ. Elle peut préciser sa signification, les consignes de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Une fois créé, le nom du champ est référencé par les blocs de page, les autorisations, les workflows et l'API. Vérifiez le nom avant la création afin d'éviter des ajustements de configuration ultérieurs.

:::

## Caractéristiques du champ

Le comportement par défaut d'un champ entier est le suivant :

| Caractéristique | Description |
| --- | --- |
| Field interface par défaut | `integer`. |
| Field type par défaut | `integer`. |
| Field type disponibles | `integer`, `bigInt`. |
| Composant de page | Le mode édition utilise un champ de saisie numérique. |
| Filtrage | Prend en charge les filtres numériques égal à, différent de, supérieur à, inférieur à, compris dans un intervalle, vide et non vide. |
| Tri | Permet le tri dans les blocs de tableau. |
| Validation | Prend en charge les validations numériques de valeur minimale, de valeur maximale et de champ obligatoire. |

## Modifier la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier sa configuration. La modification d'un champ sert principalement à ajuster la manière dont il est affiché et utilisé dans NocoBase, par exemple en modifiant son nom d'affichage, sa description, sa valeur par défaut, ses règles de validation ou sa configuration spécifique.

Si le champ provient d'une table déjà synchronisée depuis la base de données principale, sa modification consiste généralement à effectuer un mappage de champ : le champ de la base de données est associé à un Field type et à un Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifie le nom affiché du champ dans l'interface, sans changer son nom d'identification. |
| Field name | Non | Le nom d'identification du champ ne peut généralement pas être modifié dans le formulaire d'édition après sa création. |
| Field interface | Selon les cas | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. Cette modification affecte la saisie, l'affichage et la validation dans les pages. |
| Field type | Selon les cas | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. Avant toute modification, vérifiez que les données existantes pourront être utilisées avec le nouveau type. |
| Default value | Oui | Modifie la valeur par défaut des nouveaux enregistrements. |
| Validation rules | Oui | Modifie les règles de validation du champ. |
| Description | Oui | Complète la signification du champ, les consignes de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Changer le Field type ou le Field interface ne revient pas à modifier simplement un nom d'affichage. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les conditions de filtrage et la manière dont les variables sont utilisées dans les workflows. Lorsque le volume de données existantes est important, vérifiez d'abord que leur format est compatible.

:::

## Supprimer un champ

Cliquez sur « Delete » à droite du champ pour supprimer un champ entier. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs et les supprimer en lot.

Lors de la suppression d'un champ entier créé dans la base de données principale, la colonne correspondante dans la base de données ainsi que les données qu'elle contient sont généralement supprimées en même temps. Pour un champ synchronisé depuis une base de données ou mappé depuis une source de données externe, l'étendue des effets dépend de la source de données et de l'origine du champ.

:::danger Avertissement

La suppression d'un champ peut affecter les blocs de page, les formulaires, les filtres, les autorisations, les workflows, l'API, les importations et exportations, ainsi que les données existantes. Avant de le supprimer, vérifiez qu'il n'est plus référencé par des configurations métier.

:::

## Utilisation dans la configuration des pages

Les champs entiers conviennent à une utilisation dans les tableaux, les formulaires, les statistiques et les workflows.
![20260709224913](https://static-docs.nocobase.com/20260709224913.png)

| Cas d'utilisation | Utilisation |
| --- | --- |
| Bloc de formulaire | Saisir des quantités, des nombres d'occurrences, des durées en jours, etc., sans décimales. |
| Bloc de tableau | Afficher, trier et filtrer des entiers. |
| Bloc de graphique | Effectuer des statistiques à partir de champs tels que les quantités ou les nombres d'occurrences. |
| Workflows et autorisations | Participer aux conditions, par exemple pour déterminer si une quantité est supérieure à 0. |

## Liens associés

- [Champs](../index.md) — Comprendre le rôle, la classification et la logique de mappage des champs
- [Table ordinaire](../../../data-source-main/general-collection.md) — Créer et gérer des champs dans une table ordinaire
- [Numérique](./number.md) — Enregistrer des valeurs telles que des décimales, des montants ou des poids
- [Pourcentage](./percent.md) — Enregistrer une proportion ou un taux d'avancement