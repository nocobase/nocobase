---
title: "Sélecteur de tables de données"
description: "Le champ Sélecteur de tables de données sert à sélectionner des tables de données dans NocoBase."
keywords: "Sélecteur de tables de données,collection select,Collection,NocoBase"
---

# Sélecteur de tables de données

## Introduction

Dans NocoBase, le **sélecteur de tables de données (Collection select)** sert à sélectionner une ou plusieurs tables de données.

Le sélecteur de tables de données convient aux scénarios tels que la configuration des plugins, la configuration des règles et la gestion des métadonnées. Il enregistre l’identifiant de la table de données, et non les enregistrements métier.

Si vous souhaitez sélectionner des enregistrements dans une table donnée, utilisez plutôt un champ de relation qu’un sélecteur de tables de données.

## Scénarios d’utilisation

Le sélecteur de tables de données convient aux scénarios métier suivants :

- Sélectionner les tables de données concernées dans la configuration d’un plugin
- Définir l’étendue des tables de données dans la configuration des règles
- Gestion des métadonnées et configuration des modèles
- Configuration de fonctionnalités nécessitant de référencer un identifiant de Collection

## Créer la configuration

Sur la page « Configure fields » d’une table de données, cliquez sur « Add field », puis sélectionnez « Sélecteur de tables de données » pour créer un champ Sélecteur de tables de données.

![20240512174047](https://static-docs.nocobase.com/20240512174047.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d’interface du champ. Le sélecteur de tables de données correspond à `collectionSelect`, qui détermine la manière de saisir et d’afficher les données sur la page. |
| Field display name | Nom affiché du champ dans l’interface, par exemple « Tables de données concernées », « Tables de données cibles » ou « Étendue des données ». Il est recommandé d’utiliser un nom directement compréhensible par les utilisateurs métier. |
| Field name | Nom d’identification du champ, utilisé pour les références internes dans l’API, les champs de relation, les autorisations, les workflows, etc. Il n’est généralement plus modifiable après la création. Il ne peut contenir que des lettres, des chiffres et des traits de soulignement, et doit commencer par une lettre. |
| Field type | Type du champ au niveau des données. Le sélecteur de tables de données enregistre généralement l’identifiant de la table de données ; le type de stockage dépend de la configuration réelle. |
| Default value | Valeur par défaut. Lors de la création d’un enregistrement, cette valeur peut être renseignée automatiquement si l’utilisateur ne remplit pas le champ. |
| Validation rules | Règles de validation. Elles servent généralement à configurer le caractère obligatoire ou l’étendue des choix. |
| Description | Description du champ. Vous pouvez y préciser sa signification, les exigences de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Le nom du champ sera référencé par les blocs de page, les autorisations, les workflows et l’API après sa création. Vérifiez la nomenclature avant la création afin d’éviter des coûts d’ajustement ultérieurs.

:::

## Caractéristiques du champ

Le comportement par défaut du champ Sélecteur de tables de données est le suivant :

| Caractéristique | Description |
| --- | --- |
| Field interface par défaut | `collectionSelect`. |
| Field type par défaut | `string`. |
| Field type disponibles | `string`, `json`, selon la configuration réelle. |
| Composant de page | Le mode édition utilise le composant de sélection de tables de données. |
| Filtrage | Il n’est généralement pas utilisé comme champ de filtrage métier. |
| Tri | Il n’est généralement pas utilisé pour le tri. |
| Validation | Les validations de base, telles que le caractère obligatoire, sont prises en charge. |

## Modifier la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier la configuration du champ Sélecteur de tables de données. La modification du champ sert principalement à ajuster son affichage et son utilisation dans NocoBase, par exemple son nom d’affichage, sa description, sa valeur par défaut, ses règles de validation ou sa configuration spécifique.

Si le champ provient d’une table déjà synchronisée dans la base de données principale, sa modification consiste généralement à effectuer une mise en correspondance de champ : mapper le champ de la base de données vers le Field type et le Field interface de NocoBase.

| Configuration | Modification autorisée | Description |
| --- | --- | --- |
| Field display name | Oui | Modifier le nom affiché du champ dans l’interface sans changer son nom d’identification. |
| Field name | Non | Le nom d’identification du champ ne peut généralement pas être modifié dans le formulaire d’édition après sa création. |
| Field interface | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors de la mise en correspondance. La modification affectera la manière de saisir, d’afficher et de valider les données sur la page. |
| Field type | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors de la mise en correspondance. Avant toute modification, vérifiez que les données existantes pourront être utilisées avec le nouveau type. |
| Default value | Oui | Modifier la valeur par défaut lors de la création de nouveaux enregistrements. |
| Validation rules | Oui | Modifier les règles de validation du champ. |
| Description | Oui | Compléter la signification du champ, les exigences de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Changer le Field type ou le Field interface ne revient pas à modifier simplement un nom d’affichage. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les conditions de filtrage et le mode d’utilisation des variables dans les workflows. Lorsque le volume de données existantes est important, vérifiez d’abord que le format des données est compatible.

:::

## Supprimer le champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ Sélecteur de tables de données. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs et les supprimer en bloc.

Lors de la suppression d’un champ Sélecteur de tables de données créé dans la base de données principale, la colonne réelle correspondante et les données qu’elle contient sont généralement supprimées en même temps. Lors de la suppression d’un champ synchronisé depuis une base de données ou mappé depuis une source de données externe, l’étendue de l’impact dépend de la source de données et de l’origine du champ concernées.

:::danger Avertissement

La suppression d’un champ peut affecter les blocs de page, les formulaires, les filtres, les autorisations, les workflows, l’API, les importations et exportations, ainsi que les données existantes. Avant de supprimer le champ, vérifiez qu’il n’est plus référencé par une configuration métier.

:::

## Utiliser dans la configuration des pages

Le sélecteur de tables de données convient aux formulaires de configuration.

| Scénario | Utilisation |
| --- | --- |
| Bloc de formulaire | Sélectionner une ou plusieurs tables de données. |
| Bloc de détails | Afficher les tables de données sélectionnées. |
| Configuration du plugin | Définir l’étendue des tables de données concernées par la fonctionnalité. |
| Workflow ou règle | Participer à la logique en tant que configuration de métadonnées. |

## Liens associés

- [Champs](../index.md) — Comprendre le rôle, la classification et la logique de mise en correspondance des champs
- [Table standard](../../../data-source-main/general-collection.md) — Créer et gérer des champs dans une table standard
- [Table standard](../../../data-source-main/general-collection.md) — Comprendre le mode d’utilisation d’une Collection
- [Champ de relation](../associations/index.md) — Sélectionner des enregistrements dans une table donnée
