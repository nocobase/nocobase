---
title: "Heure"
description: "Le champ Heure sert à enregistrer l’heure d’une journée, par exemple l’heure d’ouverture ou l’heure d’un rappel."
keywords: "heure,time,champ heure,NocoBase"
---

# Heure

## Introduction

Dans NocoBase, **l’heure (Time)** sert à enregistrer l’heure d’une journée.

Le champ Heure convient aux données métier qui ne sont pas liées à une date précise, comme les horaires d’ouverture, les heures de rappel ou les créneaux de travail.

Si vous devez enregistrer à la fois une date et une heure, choisissez [Date et heure](./datetime.md).

## Cas d’utilisation

Le champ Heure convient notamment aux cas d’utilisation suivants :

- L’heure d’ouverture et l’heure de fermeture
- L’heure quotidienne des rappels
- L’heure de début et l’heure de fin des équipes
- La configuration d’horaires fixes

## Créer et configurer

Dans la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « Heure » pour créer un champ Heure.

![20240512181216](https://static-docs.nocobase.com/20240512181216.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d’interface du champ. Pour l’heure, il correspond à `time` et détermine la manière dont la valeur est saisie et affichée dans la page. |
| Field display name | Nom affiché pour le champ dans l’interface, par exemple « Heure de début », « Heure du rappel » ou « Horaires d’ouverture ». Il est recommandé d’utiliser un nom directement compréhensible par les utilisateurs métier. |
| Field name | Nom d’identification du champ, utilisé pour les références internes dans l’API, les champs de relation, les autorisations, les workflows, etc. Il n’est généralement plus modifié après la création. Il ne peut contenir que des lettres, des chiffres et des traits de soulignement, et doit commencer par une lettre. |
| Field type | Type du champ au niveau des données. Par défaut, le champ Heure est de type `time`. |
| Default value | Valeur par défaut. Lors de la création d’un enregistrement, cette valeur peut être renseignée automatiquement si l’utilisateur ne saisit rien. |
| Validation rules | Règles de validation. Vous pouvez notamment configurer l’obligation de saisie et une plage horaire. |
| Description | Description du champ. Elle peut préciser sa signification, les consignes de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Le nom du champ sera référencé par les blocs de page, les autorisations, les workflows et l’API. Vérifiez le nom avant la création afin d’éviter des ajustements de configuration ultérieurs.

:::

## Caractéristiques du champ

Le comportement par défaut du champ Heure est le suivant :

| Caractéristique | Description |
| --- | --- |
| Field interface par défaut | `time`. |
| Field type par défaut | `time`. |
| Field type disponible | `time`. |
| Composant de page | Le mode édition utilise un sélecteur d’heure. |
| Filtrage | Prise en charge du filtrage par heure, par intervalle, par valeur vide et par valeur non vide. |
| Tri | Prise en charge du tri par heure. |
| Validation | Prise en charge de l’obligation de saisie et des plages horaires. |

## Modifier la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier la configuration du champ Heure. La modification d’un champ sert principalement à ajuster son affichage et son utilisation dans NocoBase, par exemple en modifiant son nom d’affichage, sa description, sa valeur par défaut, ses règles de validation ou sa configuration spécifique.

Si le champ provient d’une table déjà synchronisée dans la base de données principale, sa modification consiste généralement à effectuer un mappage de champ : le champ de la base de données est associé à un Field type et à un Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifier le nom affiché du champ dans l’interface, sans changer son nom d’identification. |
| Field name | Non | Le nom d’identification du champ ne peut généralement pas être modifié dans le formulaire d’édition après sa création. |
| Field interface | Selon les cas | L’interface des champs de la base de données principale ou des champs synchronisés peut être ajustée lors du mappage. Cette modification affecte la saisie, l’affichage et la validation dans les pages. |
| Field type | Selon les cas | Le type des champs de la base de données principale ou des champs synchronisés peut être ajusté lors du mappage. Avant toute modification, vérifiez que les données existantes peuvent être utilisées avec le nouveau type. |
| Default value | Oui | Modifier la valeur par défaut des nouveaux enregistrements. |
| Validation rules | Oui | Modifier les règles de validation du champ. |
| Description | Oui | Ajouter des précisions sur la signification du champ, les consignes de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Changer le Field type ou le Field interface ne revient pas simplement à modifier un nom d’affichage. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les critères de filtrage et le mode d’utilisation des variables dans les workflows. Lorsque les données existantes sont nombreuses, vérifiez d’abord que leur format correspond.

:::

## Supprimer un champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ Heure. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs et les supprimer en bloc.

Lors de la suppression d’un champ Heure créé dans la base de données principale, la colonne correspondante dans la base de données ainsi que les données qu’elle contient sont généralement supprimées. Pour un champ synchronisé depuis une base de données ou mappé depuis une source de données externe, l’étendue des effets dépend de la source de données et de l’origine du champ.

:::danger Avertissement

La suppression d’un champ peut affecter les blocs de page, les formulaires, les filtres, les autorisations, les workflows, l’API, les importations et exportations, ainsi que les données existantes. Avant de le supprimer, vérifiez qu’il n’est plus utilisé dans les configurations métier.

:::

## Utiliser le champ dans la configuration des pages

Le champ Heure convient à une utilisation dans les formulaires et les configurations de règles.
![20260709232726](https://static-docs.nocobase.com/20260709232726.png)

| Cas d’utilisation | Fonction |
| --- | --- |
| Bloc de formulaire | Sélectionner une heure de la journée. |
| Bloc de tableau | Afficher, trier et filtrer les heures. |
| Bloc de filtrage | Filtrer selon une plage horaire. |
| Workflow | Servir de champ de condition horaire. |

## Liens associés

- [Champs](../index.md) — Comprendre le rôle, la classification et la logique de mappage des champs
- [Table standard](../../../data-source-main/general-collection.md) — Créer et gérer des champs dans une table standard
- [Date](./date.md) — Enregistrer uniquement une date
- [Date et heure (avec fuseau horaire)](./datetime.md) — Enregistrer une date et une heure