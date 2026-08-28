---
title: "Case à cocher"
description: "Le champ case à cocher sert à enregistrer des valeurs booléennes telles que oui ou non, activé ou désactivé."
keywords: "case à cocher,checkbox,valeur booléenne,boolean,NocoBase"
---

# Case à cocher

## Présentation

Dans NocoBase, la **case à cocher (Checkbox)** sert à enregistrer une valeur booléenne à deux choix.

Le champ case à cocher convient aux判断 simples tels que l’état d’activation, la valeur par défaut, l’achèvement ou la nécessité d’une approbation. Sa sémantique est plus claire que l’enregistrement de « oui/non » sous forme de texte.

Si l’état comporte plus de deux valeurs, par exemple brouillon, en cours et terminé, il est préférable de choisir une [sélection unique dans une liste déroulante](./select.md).

## Cas d’utilisation

La case à cocher convient aux cas d’utilisation suivants :

- Activé ou non, valeur par défaut ou non
- Terminé ou non, lu ou non
- Approbation requise ou non, facturation nécessaire ou non
- Public ou non, archivé ou non

## Créer une configuration

Sur la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « Case à cocher » pour créer un champ case à cocher.

![20240512180122](https://static-docs.nocobase.com/20240512180122.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d’interface du champ. La case à cocher correspond à `checkbox` et détermine la manière dont la valeur est saisie et affichée sur la page. |
| Field display name | Nom affiché du champ dans l’interface, par exemple « Activé », « Terminé » ou « Facturé ». Il est recommandé d’utiliser un nom directement compréhensible par les utilisateurs métier. |
| Field name | Nom d’identification du champ, utilisé pour les références internes dans l’API, les champs de relation, les autorisations, les workflows, etc. Il n’est généralement plus modifiable après la création, accepte uniquement les lettres, les chiffres et les traits de soulignement, et doit commencer par une lettre. |
| Field type | Type du champ au niveau des données. Par défaut, un champ case à cocher est de type `boolean`. |
| Default value | Valeur par défaut. Lors de l’ajout d’un enregistrement, cette valeur peut être automatiquement renseignée si l’utilisateur ne saisit rien. |
| Validation rules | Règles de validation. Elles servent généralement à configurer le caractère obligatoire ou la valeur par défaut. |
| Description | Description du champ. Elle peut préciser sa signification, les exigences de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Le nom du champ sera référencé par les blocs de page, les autorisations, les workflows et l’API. Vérifiez le nom avant la création afin d’éviter des coûts de reconfiguration ultérieurs.

:::

## Caractéristiques du champ

Le comportement par défaut du champ case à cocher est le suivant :

| Caractéristique | Description |
| --- | --- |
| Field interface par défaut | `checkbox`. |
| Field type par défaut | `boolean`. |
| Field type disponible | `boolean`. |
| Composant de page | En mode édition, utilise une case à cocher. |
| Filtrage | Permet de filtrer selon les valeurs oui, non ou vide. |
| Tri | Permet de trier selon la valeur booléenne. |
| Validation | Prend en charge les configurations de base telles que le caractère obligatoire et la valeur par défaut. |

## Modifier la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier la configuration du champ case à cocher. La modification du champ sert principalement à ajuster son affichage et son utilisation dans NocoBase, par exemple son nom affiché, sa description, sa valeur par défaut, ses règles de validation ou sa configuration spécifique.

Si le champ provient d’une table déjà synchronisée dans la base de données principale, sa modification consiste généralement à effectuer un mappage de champ : le champ de la base de données est associé à un Field type et à un Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifie le nom affiché du champ dans l’interface sans changer son nom d’identification. |
| Field name | Non | Le nom d’identification du champ ne peut généralement pas être modifié dans le formulaire d’édition après sa création. |
| Field interface | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. La modification affecte la manière dont les données sont saisies, affichées et validées sur la page. |
| Field type | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. Avant toute modification, vérifiez que les données existantes peuvent être utilisées avec le nouveau type. |
| Default value | Oui | Modifie la valeur par défaut lors de l’ajout d’un enregistrement. |
| Validation rules | Oui | Modifie les règles de validation du champ. |
| Description | Oui | Complète la signification du champ, les exigences de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Changer le Field type ou le Field interface ne revient pas à modifier simplement un nom affiché. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les conditions de filtrage et la manière dont les variables de workflow sont utilisées. Lorsque le volume de données existantes est important, vérifiez d’abord que le format des données est compatible.

:::

## Supprimer un champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ case à cocher. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs case à cocher et les supprimer en bloc.

Lors de la suppression d’un champ case à cocher créé dans la base de données principale, la colonne réelle correspondante de la base de données ainsi que les données qu’elle contient sont généralement supprimées en même temps. Lors de la suppression d’un champ synchronisé depuis une base de données ou mappé depuis une source de données externe, l’étendue des effets dépend de la source de données et de l’origine du champ concernées.

:::danger Avertissement

La suppression d’un champ peut affecter les blocs de page, les formulaires, les filtres, les autorisations, les workflows, l’API, les importations et exportations, ainsi que les données existantes. Avant de supprimer le champ, vérifiez qu’il n’est plus référencé par des configurations métier.

:::

## Utiliser dans la configuration des pages

Le champ case à cocher convient aux formulaires, aux tableaux, aux filtres et aux conditions de workflow.
![20260709225738](https://static-docs.nocobase.com/20260709225738.png)

| Cas d’utilisation | Utilisation |
| --- | --- |
| Bloc de formulaire | Saisir oui ou non. |
| Bloc de tableau | Afficher l’état de la case à cocher et permettre le filtrage. |
| Bloc de filtrage | Filtrer selon des conditions telles que l’activation ou non, l’achèvement ou non. |
| Workflows et autorisations | Participer à l’évaluation en tant que condition booléenne. |

## Liens associés

- [Champs](../index.md) — Découvrir le rôle, la classification et la logique de mappage des champs
- [Table standard](../../../data-source-main/general-collection.md) — Créer et gérer des champs dans une table standard
- [Sélection unique dans une liste déroulante](./select.md) — Enregistrer une valeur parmi plusieurs états
- [Groupe de boutons radio](./radio-group.md) — Afficher les options sous forme de boutons radio