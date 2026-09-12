---
title: "Mis à jour par"
description: "Le champ Mis à jour par sert à enregistrer automatiquement l’utilisateur ayant effectué la dernière modification de l’enregistrement."
keywords: "Mis à jour par,updatedBy,champs système,utilisateur,NocoBase"
---

# Mis à jour par

## Présentation

Dans NocoBase, **Mis à jour par (Updated by)** sert à enregistrer automatiquement l’utilisateur ayant effectué la dernière modification de l’enregistrement.

Le champ Mis à jour par est généralement généré par un champ prédéfini. Il est adapté à l’audit, au suivi des responsabilités, au filtrage et aux conditions de workflow.

Pour désigner un responsable métier, un opérateur ou un approbateur, il est recommandé de créer séparément un champ de relation utilisateur.

## Cas d’utilisation

Le champ Mis à jour par convient aux scénarios métier suivants :

- Afficher le dernier utilisateur ayant effectué une maintenance
- Filtrer les enregistrements par utilisateur de mise à jour
- Auditer qui a modifié les données
- Notifier le dernier utilisateur ayant effectué une mise à jour dans un workflow

## Créer la configuration

Sur la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « Mis à jour par » pour créer un champ Mis à jour par.

![index-2025-11-01-00-51-12](https://static-docs.nocobase.com/index-2025-11-01-00-51-12.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d’interface du champ. Pour Mis à jour par, il correspond à `updatedBy` et détermine comment le champ est saisi et affiché dans la page. |
| Field display name | Nom affiché du champ dans l’interface, par exemple « Mis à jour par » ou « Dernière modification par ». Il est recommandé d’utiliser un nom directement compréhensible par les utilisateurs métier. |
| Field name | Nom d’identification du champ, utilisé pour les références internes dans l’API, les champs de relation, les autorisations, les workflows, etc. Il n’est généralement plus modifiable après la création, accepte uniquement les lettres, les chiffres et les underscores, et doit commencer par une lettre. |
| Field type | Type du champ dans la couche de données. Mis à jour par est généralement un champ de relation `belongsTo` pointant vers la table des utilisateurs. |
| Default value | Valeur par défaut. Lors de la création d’un enregistrement, elle peut être renseignée automatiquement si l’utilisateur ne saisit aucune valeur. |
| Validation rules | Géré automatiquement par le système, sans validation manuelle généralement nécessaire. |
| Description | Description du champ. Peut préciser sa signification, les exigences de saisie, la source des données ou la personne chargée de sa maintenance. |

:::warning Attention

Le nom du champ sera référencé par les blocs de page, les autorisations, les workflows et l’API. Vérifiez la nomenclature avant la création afin d’éviter des coûts de reconfiguration ultérieurs.

:::

## Caractéristiques du champ

Le comportement par défaut du champ Mis à jour par est le suivant :

| Caractéristique | Description |
| --- | --- |
| Default Field interface | `updatedBy`. |
| Default Field type | `belongsTo`. |
| Field type disponible | `belongsTo`. |
| Composant de page | Renseigné automatiquement par le système ; il est généralement affiché sur la page à l’aide d’un composant de présentation utilisateur. |
| Filtrage | Permet de filtrer par utilisateur. |
| Tri | Le tri par utilisateur de mise à jour n’est généralement pas pris en charge. |
| Validation | Renseignée automatiquement par le système. |

## Modifier la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier la configuration du champ Mis à jour par. La modification d’un champ sert principalement à ajuster son affichage et son utilisation dans NocoBase, par exemple en changeant son nom d’affichage, sa description, sa valeur par défaut, ses règles de validation ou sa configuration spécifique.

Si le champ provient d’une table déjà synchronisée dans la base de données principale, sa modification consiste généralement à effectuer un mappage de champ : le champ de la base de données est associé à un Field type et à un Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifie le nom affiché du champ dans l’interface, sans changer son nom d’identification. |
| Field name | Non | Le nom d’identification du champ ne peut généralement pas être modifié dans le formulaire d’édition après la création. |
| Field interface | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. Cette modification affecte la saisie, l’affichage et la validation sur la page. |
| Field type | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. Avant toute modification, vérifiez que les données existantes pourront être utilisées avec le nouveau type. |
| Default value | Oui | Ajuste la valeur par défaut lors de la création de nouveaux enregistrements. |
| Validation rules | Oui | Ajuste les règles de validation du champ. |
| Description | Oui | Complète la signification du champ, les exigences de saisie, la source des données ou la personne chargée de sa maintenance. |

:::warning Attention

Changer le Field type ou le Field interface ne revient pas à modifier simplement un nom d’affichage. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les conditions de filtrage et le mode d’utilisation des variables de workflow. Lorsque les données existantes sont nombreuses, vérifiez d’abord que leur format est compatible.

:::

## Supprimer le champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ Mis à jour par. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs et les supprimer en masse.

Lors de la suppression d’un champ Mis à jour par créé dans la base de données principale, la colonne réelle correspondante ainsi que les données qu’elle contient sont généralement supprimées simultanément de la base de données. Pour un champ synchronisé depuis une base de données ou mappé depuis une source de données externe, l’étendue des effets dépend de la source de données et de l’origine du champ concerné.

:::danger Avertissement

La suppression d’un champ peut affecter les blocs de page, les formulaires, les filtres, les autorisations, les workflows, l’API, les importations et exportations, ainsi que les données existantes. Avant de le supprimer, vérifiez que le champ n’est plus référencé par une configuration métier.

:::

## Utiliser dans la configuration des pages

Le champ Mis à jour par convient à l’audit, au filtrage et aux workflows.
![20260710153223](https://static-docs.nocobase.com/20260710153223.png)

| Scénario | Utilisation |
| --- | --- |
| Bloc de tableau | Afficher le dernier utilisateur ayant effectué une mise à jour. |
| Bloc de filtrage | Filtrer les enregistrements par utilisateur de mise à jour. |
| Bloc de détails | Consulter le dernier utilisateur ayant effectué une maintenance. |
| Workflow | Utiliser comme destinataire d’une notification ou comme champ conditionnel. |

## Liens associés

- [Champs](../index.md) — Comprendre le rôle, la classification et la logique de mappage des champs
- [Tables ordinaires](../../../data-source-main/general-collection.md) — Créer et gérer des champs dans une table ordinaire
- [Créé par](./created-by.md) — Enregistrer automatiquement l’utilisateur ayant créé l’enregistrement
- [Champ de relation](../associations/index.md) — Créer une relation utilisateur pour un responsable métier ou un rôle similaire