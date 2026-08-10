---
title: "Identifiant de table de données"
description: "Le champ identifiant de table de données sert à identifier la table à laquelle appartient un enregistrement. Il est couramment utilisé dans les tables héritées et autres scénarios nécessitant de distinguer la table source."
keywords: "identifiant de table de données,table oid,tableoid,champs système,NocoBase"
---

# Identifiant de table de données

## Présentation

Dans NocoBase, **l’identifiant de table de données (Table OID)** sert à identifier la table à laquelle appartient un enregistrement.

L’identifiant de table de données est couramment utilisé dans les tables héritées ou dans les scénarios où il est nécessaire de distinguer la Collection d’origine d’un enregistrement. Ce champ est principalement utilisé par les fonctionnalités système et les métadonnées.

Les tables métier ordinaires n’ont généralement pas besoin de créer manuellement un champ identifiant de table de données.

## Scénarios applicables

L’identifiant de table de données convient aux scénarios métier suivants :

- Identification de la source des enregistrements d’une table héritée
- Agrégation et affichage entre plusieurs tables enfants
- Configuration des métadonnées
- Fonctionnalités système nécessitant de distinguer la Collection source

## Création et configuration

Sur la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « Identifiant de table de données » pour créer un champ identifiant de table de données.

![20240512174746](https://static-docs.nocobase.com/20240512174746.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d’interface du champ. L’identifiant de table de données correspond à `tableoid`, qui détermine la manière dont la valeur est saisie et affichée dans la page. |
| Field display name | Nom affiché du champ dans l’interface, par exemple « Identifiant de table de données » ou « Table source ». Il est recommandé d’utiliser un nom directement compréhensible par les utilisateurs métier. |
| Field name | Nom d’identification du champ, utilisé pour les références internes dans l’API, les champs de relation, les permissions, les workflows, etc. Il n’est généralement plus modifié après la création, accepte uniquement les lettres, les chiffres et les traits de soulignement, et doit commencer par une lettre. |
| Field type | Type du champ au niveau des données. Un identifiant de table de données est généralement un champ `virtual`. |
| Default value | Valeur par défaut. Lors de la création d’un enregistrement, cette valeur peut être renseignée automatiquement si l’utilisateur ne saisit rien. |
| Validation rules | Généralement gérées par le système. |
| Description | Description du champ. Elle peut préciser la signification du champ, les exigences de saisie, la source des données ou la personne responsable de la maintenance. |

:::warning Attention

Le nom du champ est référencé par les blocs de page, les permissions, les workflows et l’API. Vérifiez le nommage avant la création afin d’éviter des coûts de reconfiguration ultérieurs.

:::

## Caractéristiques du champ

Le comportement par défaut du champ identifiant de table de données est le suivant :

| Caractéristique | Description |
| --- | --- |
| Field interface par défaut | `tableoid`. |
| Field type par défaut | `virtual`. |
| Field type disponible | `virtual`. |
| Composant de page | La page présente généralement ce champ sous forme de sélecteur de table de données ou en lecture seule. |
| Filtrage | Peut être utilisé pour filtrer par table de données source, selon la configuration de la page. |
| Tri | N’est généralement pas utilisé pour le tri. |
| Validation | Gérée par le système ou les fonctionnalités de métadonnées. |

## Modifier la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier la configuration du champ identifiant de table de données. La modification d’un champ sert principalement à ajuster son affichage et son utilisation dans NocoBase, par exemple en modifiant son nom d’affichage, sa description, sa valeur par défaut, ses règles de validation ou sa configuration spécifique.

Si le champ provient d’une table déjà synchronisée dans la base de données principale, sa modification consiste généralement à effectuer une correspondance de champ : le champ de la base de données est associé à un Field type et à un Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifie le nom affiché du champ dans l’interface sans modifier son nom d’identification. |
| Field name | Non | Le nom d’identification du champ ne peut généralement pas être modifié dans le formulaire d’édition après la création. |
| Field interface | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors de la correspondance des champs. Cette modification affecte les modes de saisie, d’affichage et de validation dans les pages. |
| Field type | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors de la correspondance des champs. Avant toute modification, vérifiez que les données existantes peuvent être utilisées avec le nouveau type. |
| Default value | Oui | Modifie la valeur par défaut lors de la création de nouveaux enregistrements. |
| Validation rules | Oui | Modifie les règles de validation du champ. |
| Description | Oui | Complète la signification du champ, les exigences de saisie, la source des données ou la personne responsable de la maintenance. |

:::warning Attention

Changer le Field type ou le Field interface ne revient pas à modifier simplement un nom d’affichage. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les conditions de filtrage et le mode d’utilisation des variables dans les workflows. Lorsque le volume de données existantes est important, vérifiez d’abord que leur format correspond.

:::

## Supprimer un champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ identifiant de table de données. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs afin de les supprimer par lots.

Lors de la suppression d’un champ identifiant de table de données créé dans la base de données principale, la colonne réelle correspondante dans la base de données ainsi que les données qu’elle contient sont généralement supprimées en même temps. Lors de la suppression d’un champ synchronisé depuis une base de données ou mappé depuis une source de données externe, l’étendue des effets dépend de la source de données et de l’origine du champ correspondantes.

:::danger Avertissement

La suppression d’un champ peut affecter les blocs de page, les formulaires, les filtres, les permissions, les workflows, l’API, les importations et exportations, ainsi que les données existantes. Avant de supprimer un champ, vérifiez qu’il n’est plus référencé par les configurations métier.

:::

## Utilisation dans la configuration des pages

Le champ identifiant de table de données convient aux tables héritées et aux scénarios liés aux métadonnées.

| Scénario | Utilisation |
| --- | --- |
| Bloc de tableau | Afficher la table de données source de l’enregistrement. |
| Bloc de filtrage | Filtrer par table de données source. |
| Permissions et workflows | Servir de condition pour déterminer la table source. |
| Fonctionnalités de métadonnées | Identifier la Collection à laquelle appartient l’enregistrement. |

## Liens associés

- [Champs](../index.md) — découvrir le rôle, les catégories et la logique de correspondance des champs
- [Tables ordinaires](../../../data-source-main/general-collection.md) — créer et gérer des champs dans une table ordinaire
- [Tables héritées](../../../data-source-main/inheritance-collection.md) — découvrir le fonctionnement des tables héritées
- [Sélecteur de table de données](../advanced/collection-select.md) — sélectionner une table de données