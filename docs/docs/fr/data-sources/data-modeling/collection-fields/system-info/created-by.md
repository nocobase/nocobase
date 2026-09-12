---
title: "Créé par"
description: "Le champ Créé par sert à enregistrer automatiquement l’utilisateur qui a créé un enregistrement."
keywords: "Créé par,createdBy,champs système,utilisateur,NocoBase"
---

# Créé par

## Introduction

Dans NocoBase, **Créé par (Created by)** sert à enregistrer automatiquement le créateur d’un enregistrement.

Le champ Créé par est généralement généré par un champ prédéfini. Il est adapté au contrôle des autorisations, au suivi des responsabilités, au filtrage et à l’audit.

Pour représenter le responsable métier, l’agent chargé du traitement ou l’approbateur, il est recommandé de créer séparément un champ de relation utilisateur, plutôt que de réutiliser le champ Créé par.

## Cas d’utilisation

Le champ Créé par convient aux cas métier suivants :

- Afficher uniquement les données que j’ai créées
- Filtrer les enregistrements par créateur
- Auditer la responsabilité de création des enregistrements
- Identifier le créateur d’un enregistrement dans un workflow

## Configuration de la création

Dans la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « Créé par » pour créer un champ Créé par.

![index-2025-11-01-00-50-59](https://static-docs.nocobase.com/index-2025-11-01-00-50-59.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d’interface du champ. Pour Créé par, il correspond à `createdBy` et détermine la manière dont la valeur est saisie et affichée dans la page. |
| Field display name | Nom affiché pour le champ dans l’interface, par exemple « Créé par ». Il est recommandé d’utiliser un nom directement compréhensible par les utilisateurs métier. |
| Field name | Nom d’identification du champ, utilisé pour les références internes dans l’API, les champs de relation, les autorisations, les workflows, etc. Il n’est généralement plus modifiable après la création, accepte uniquement les lettres, les chiffres et les traits de soulignement, et doit commencer par une lettre. |
| Field type | Type du champ dans la couche de données. Créé par est généralement un champ de relation `belongsTo` pointant vers la table des utilisateurs. |
| Default value | Valeur par défaut. Lors de l’ajout d’un enregistrement, elle peut être renseignée automatiquement si l’utilisateur ne saisit aucune valeur. |
| Validation rules | Maintenues automatiquement par le système ; aucune validation manuelle n’est généralement nécessaire. |
| Description | Description du champ. Elle peut préciser la signification du champ, les exigences de saisie, la source des données ou la personne chargée de sa maintenance. |

:::warning Attention

Le nom du champ sera référencé par les blocs de page, les autorisations, les workflows et l’API. Vérifiez le nom avant la création afin d’éviter des ajustements de configuration ultérieurs.

:::

## Caractéristiques du champ

Le comportement par défaut du champ Créé par est le suivant :

| Caractéristique | Description |
| --- | --- |
| Default Field interface | `createdBy`. |
| Default Field type | `belongsTo`. |
| Field type disponible | `belongsTo`. |
| Composant de page | Renseigné automatiquement par le système ; la page le présente généralement au moyen d’un composant de sélection ou d’affichage des utilisateurs. |
| Filtrage | Permet de filtrer par utilisateur. |
| Tri | Le tri par créateur n’est généralement pas pris en charge. |
| Validation | Renseignée automatiquement par le système. |

## Modifier la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier la configuration du champ Créé par. La modification d’un champ sert principalement à ajuster sa présentation et son utilisation dans NocoBase, par exemple son nom affiché, sa description, sa valeur par défaut, ses règles de validation ou sa configuration spécifique.

Si le champ provient d’une table déjà synchronisée dans la base de données principale, sa modification consiste généralement à effectuer un mappage de champ : le champ de la base de données est associé à un Field type et à une Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifie le nom affiché du champ dans l’interface, sans changer son nom d’identification. |
| Field name | Non | Le nom d’identification du champ ne peut généralement pas être modifié dans le formulaire d’édition après la création. |
| Field interface | Selon les conditions | L’interface des champs de la base de données principale ou des champs synchronisés peut être ajustée lors du mappage des champs. Cette modification affecte les modalités de saisie, d’affichage et de validation dans les pages. |
| Field type | Selon les conditions | Le type des champs de la base de données principale ou des champs synchronisés peut être ajusté lors du mappage des champs. Avant toute modification, vérifiez que les données existantes pourront être utilisées avec le nouveau type. |
| Default value | Oui | Modifie la valeur par défaut lors de l’ajout d’un enregistrement. |
| Validation rules | Oui | Modifie les règles de validation du champ. |
| Description | Oui | Complète la signification du champ, les exigences de saisie, la source des données ou la personne chargée de sa maintenance. |

:::warning Attention

Changer le Field type ou la Field interface ne revient pas à modifier simplement un nom affiché. Cette opération affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les conditions de filtrage et la manière dont les variables de workflow sont utilisées. Lorsque les données existantes sont nombreuses, vérifiez d’abord que leur format est compatible.

:::

## Supprimer un champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ Créé par. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs, puis les supprimer en lot.

Lors de la suppression d’un champ Créé par créé dans la base de données principale, la colonne correspondante dans la base de données ainsi que les données qu’elle contient sont généralement supprimées simultanément. Lors de la suppression d’un champ synchronisé depuis une base de données ou mappé à partir d’une source de données externe, l’étendue des effets dépend de la source de données et de l’origine du champ concernées.

:::danger Avertissement

La suppression d’un champ peut affecter les blocs de page, les formulaires, les filtres, les autorisations, les workflows, l’API, les importations et exportations, ainsi que les données existantes. Avant la suppression, vérifiez que le champ n’est plus utilisé par une configuration métier.

:::

## Utilisation dans la configuration des pages

Le champ Créé par convient à une utilisation dans les autorisations, les filtres, les audits et les workflows.
![20260710153223](https://static-docs.nocobase.com/20260710153223.png)

| Cas d’utilisation | Fonction |
| --- | --- |
| Bloc de tableau | Afficher le créateur. |
| Bloc de filtrage | Filtrer les enregistrements par créateur. |
| Autorisations | Configurer des règles telles que « afficher uniquement les données que j’ai créées ». |
| Workflow | Récupérer le créateur, puis envoyer une notification ou définir une condition. |

## Liens associés

- [Champs](../index.md) — Comprendre le rôle, la classification et la logique de mappage des champs
- [Table ordinaire](../../../data-source-main/general-collection.md) — Créer et gérer des champs dans une table ordinaire
- [Mis à jour par](./updated-by.md) — Enregistrer automatiquement le dernier utilisateur ayant effectué une mise à jour
- [Champ de relation](../associations/index.md) — Créer une relation utilisateur pour représenter, par exemple, le responsable métier
