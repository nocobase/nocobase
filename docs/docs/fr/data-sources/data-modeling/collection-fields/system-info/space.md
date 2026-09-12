---
title: "Espace"
description: "Le champ espace sert à identifier l’espace auquel appartient un enregistrement après l’activation de la fonctionnalité multi-espaces."
keywords: "Espace,space,multi-espaces,champ système,NocoBase"
---

# Espace

## Présentation

Dans NocoBase, **l’espace (Space)** sert à enregistrer l’espace auquel appartiennent les données.

Le champ espace apparaît généralement après l’activation du plugin multi-espaces et sert à isoler les données par espace. Il ne convient pas à une modification arbitraire comme un champ métier ordinaire.

S’il s’agit simplement d’une dimension métier telle qu’un département, une région ou un projet, il est recommandé de créer un champ de relation ou un champ d’options ordinaire.

## Cas d’utilisation

L’espace convient aux scénarios métier suivants :

- Isolation des données entre plusieurs espaces
- Filtrage des données par espace
- Contrôle des autorisations au niveau de l’espace
- Attribution des données métier dans un contexte multi-locataire

## Création et configuration

Sur la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « Espace » pour créer un champ espace.

![index-2025-11-01-00-50-45](https://static-docs.nocobase.com/index-2025-11-01-00-50-45.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d’interface du champ. L’espace correspond à `space`, qui détermine la manière dont les données sont saisies et affichées sur la page. |
| Field display name | Nom affiché du champ dans l’interface, par exemple « Espace ». Il est recommandé d’utiliser un nom directement compréhensible par les utilisateurs métier. |
| Field name | Nom d’identification du champ, utilisé pour les références internes dans l’API, les champs de relation, les autorisations, les workflows, etc. Il n’est généralement plus modifié après la création, accepte uniquement les lettres, les chiffres et les traits de soulignement, et doit commencer par une lettre. |
| Field type | Type du champ au niveau des données. Un champ espace est généralement un champ de relation pointant vers la table des espaces. |
| Default value | Valeur par défaut. Lors de la création d’un enregistrement, si l’utilisateur ne renseigne aucune valeur, la valeur par défaut peut être ajoutée automatiquement. |
| Validation rules | Généralement gérées par le système ou le contexte de l’espace. |
| Description | Description du champ. Elle peut préciser la signification du champ, les exigences de saisie, la source des données ou le responsable de la maintenance. |

:::warning Attention

Le nom du champ sera référencé par les blocs de page, les autorisations, les workflows et l’API. Vérifiez le nom avant la création afin d’éviter des coûts d’ajustement ultérieurs.

:::

## Caractéristiques du champ

Le comportement par défaut du champ espace est le suivant :

| Caractéristique | Description |
| --- | --- |
| Field interface par défaut | `space`. |
| Field type par défaut | `belongsTo`. |
| Field type disponible | `belongsTo`. |
| Composant de page | Géré par le système ou la fonctionnalité multi-espaces ; la page est généralement en lecture seule ou utilisée selon le contexte de l’espace. |
| Filtrage | Le filtrage par espace est pris en charge, selon la configuration multi-espaces. |
| Tri | Généralement non utilisé pour le tri. |
| Validation | Gérée par la fonctionnalité multi-espaces. |

## Modification de la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier sa configuration. La modification d’un champ sert principalement à ajuster son affichage et son mode d’utilisation dans NocoBase, par exemple son nom affiché, sa description, sa valeur par défaut, ses règles de validation ou sa configuration spécifique.

Si le champ provient d’une table déjà synchronisée depuis la base de données principale, sa modification consiste généralement à effectuer une correspondance de champ — le champ de la base de données est associé à un Field type et à un Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifie le nom affiché du champ dans l’interface, sans changer son nom d’identification. |
| Field name | Non | Le nom d’identification du champ ne peut généralement pas être modifié dans le formulaire d’édition après la création. |
| Field interface | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors de la correspondance des champs. Cela affecte le mode de saisie, d’affichage et de validation sur les pages. |
| Field type | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors de la correspondance des champs. Avant toute modification, il faut vérifier que les données existantes peuvent être utilisées avec le nouveau type. |
| Default value | Oui | Modifie la valeur par défaut des nouveaux enregistrements. |
| Validation rules | Oui | Modifie les règles de validation du champ. |
| Description | Oui | Complète la signification du champ, les exigences de saisie, la source des données ou le responsable de la maintenance. |

:::warning Attention

Changer le Field type ou le Field interface ne revient pas à modifier simplement un nom affiché. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les conditions de filtrage et le mode d’utilisation des variables dans les workflows. Lorsque les données existantes sont nombreuses, vérifiez d’abord que leur format est compatible.

:::

## Supprimer un champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ espace. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs, puis les supprimer en une seule fois.

Lors de la suppression d’un champ espace créé dans la base de données principale, la colonne correspondante dans la base de données ainsi que les données qu’elle contient sont généralement supprimées simultanément. Lors de la suppression d’un champ synchronisé depuis une base de données ou issu d’une source de données externe, l’étendue des effets dépend de la source de données et de l’origine du champ concerné.

:::danger Avertissement

La suppression d’un champ peut affecter les blocs de page, les formulaires, les filtres, les autorisations, les workflows, l’API, les importations et exportations, ainsi que les données existantes. Avant de supprimer un champ, vérifiez qu’il n’est plus référencé par une configuration métier.

:::

## Utilisation dans la configuration des pages

Le champ espace convient à l’isolation des données entre plusieurs espaces et aux scénarios de gestion des autorisations.

| Scénario | Utilisation |
| --- | --- |
| Bloc de tableau | Afficher l’espace auquel appartient l’enregistrement. |
| Bloc de filtrage | Filtrer les enregistrements par espace. |
| Autorisations | Isoler l’accès aux données par espace. |
| Workflow | Lire l’espace auquel appartient l’enregistrement comme contexte. |

## Liens associés

- [Champs](../index.md) — Comprendre le rôle, la classification et la logique de correspondance des champs
- [Tables ordinaires](../../../data-source-main/general-collection.md) — Créer et gérer des champs dans une table ordinaire
- [Multi-espaces](../../../../multi-app/multi-space/index.md) — En savoir plus sur la fonctionnalité multi-espaces
- [Champs de relation](../associations/index.md) — Créer un champ de relation ordinaire
