---
title: "Date de mise à jour"
description: "Le champ Date de mise à jour sert à enregistrer automatiquement la dernière date de mise à jour d’un enregistrement."
keywords: "date de mise à jour,updatedAt,champs système,NocoBase"
---

# Date de mise à jour

## Présentation

Dans NocoBase, **la date de mise à jour (Updated at)** sert à enregistrer automatiquement la dernière date de mise à jour d’un enregistrement.

La date de mise à jour est généralement générée par un champ prédéfini. Elle convient aux audits, à la vérification des synchronisations, au tri, au filtrage et aux conditions de workflow.

Si vous devez enregistrer une date métier de fin, d’approbation, etc., utilisez la[date et heure](../datetime/datetime.md).

## Cas d’utilisation

La date de mise à jour convient notamment aux cas suivants :

- Afficher la dernière date de mise à jour
- Filtrer les données mises à jour récemment
- Vérifier si les données n’ont pas été maintenues depuis longtemps
- Comparer les dates de mise à jour lors de la synchronisation avec des systèmes externes

## Créer et configurer

Dans la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « Date de mise à jour » pour créer un champ de date de mise à jour.

![20240512174826](https://static-docs.nocobase.com/20240512174826.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d’interface du champ. La date de mise à jour correspond à `updatedAt`, qui détermine comment le champ est saisi et affiché dans la page. |
| Field display name | Nom affiché du champ dans l’interface, par exemple « Date de mise à jour » ou « Dernière mise à jour ». Il est recommandé d’utiliser un nom que les utilisateurs métier peuvent comprendre directement. |
| Field name | Nom d’identification du champ, utilisé pour les références internes dans l’API, les champs de relation, les permissions, les workflows, etc. Il n’est généralement plus modifié après la création, accepte uniquement les lettres, les chiffres et les underscores, et doit commencer par une lettre. |
| Field type | Type du champ au niveau des données. La date de mise à jour utilise généralement `date`. |
| Default value | Valeur par défaut. Lors de la création d’un enregistrement, elle peut être renseignée automatiquement si l’utilisateur n’a fourni aucune valeur. |
| Validation rules | Maintenues automatiquement par le système ; aucune validation manuelle n’est généralement nécessaire. |
| Description | Description du champ. Elle peut préciser sa signification, les exigences de saisie, la source des données ou la personne chargée de sa maintenance. |

:::warning Attention

Le nom du champ sera référencé par les blocs de page, les permissions, les workflows et l’API. Vérifiez le nommage avant la création afin d’éviter des ajustements de configuration ultérieurs.

:::

## Caractéristiques du champ

Le comportement par défaut du champ Date de mise à jour est le suivant :

| Caractéristique | Description |
| --- | --- |
| Field interface par défaut | `updatedAt`. |
| Field type par défaut | `date`. |
| Field type disponibles | `date`. |
| Composant de page | Écrit automatiquement par le système ; il est généralement affiché en lecture seule sur la page. |
| Filtrage | Permet de filtrer par date et par intervalle. |
| Tri | Permet de trier par date. |
| Validation | Écrite automatiquement par le système. |

## Modifier la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier la configuration du champ Date de mise à jour. La modification d’un champ sert principalement à ajuster son affichage et son utilisation dans NocoBase, par exemple son nom d’affichage, sa description, sa valeur par défaut, ses règles de validation ou sa configuration spécifique.

Si le champ provient d’une table déjà synchronisée dans la base de données principale, sa modification consiste généralement à effectuer un mappage de champ : le champ de la base de données est mappé vers un Field type et une Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifie le nom affiché du champ dans l’interface sans changer son nom d’identification. |
| Field name | Non | Le nom d’identification du champ ne peut généralement pas être modifié dans le formulaire d’édition après sa création. |
| Field interface | Selon les cas | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. Cette modification affecte la manière dont les données sont saisies, affichées et validées sur la page. |
| Field type | Selon les cas | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. Avant toute modification, vérifiez que les données existantes peuvent être utilisées avec le nouveau type. |
| Default value | Oui | Modifie la valeur par défaut des nouveaux enregistrements. |
| Validation rules | Oui | Modifie les règles de validation du champ. |
| Description | Oui | Complète la signification du champ, les exigences de saisie, la source des données ou la personne chargée de sa maintenance. |

:::warning Attention

Changer le Field type ou la Field interface ne revient pas à modifier simplement un nom d’affichage. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les conditions de filtrage et la manière dont les variables sont utilisées dans les workflows. Si le volume de données existantes est important, vérifiez d’abord que leur format est compatible.

:::

## Supprimer un champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ Date de mise à jour. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs pour les supprimer en bloc.

Lors de la suppression d’un champ Date de mise à jour créé dans la base de données principale, la colonne réelle correspondante et les données qu’elle contient sont généralement supprimées simultanément de la base de données. Lors de la suppression d’un champ synchronisé depuis une base de données ou mappé depuis une source de données externe, l’étendue des effets dépend de la source de données et de l’origine du champ concernées.

:::danger Avertissement

La suppression d’un champ peut affecter les blocs de page, les formulaires, les filtres, les permissions, les workflows, l’API, les importations et exportations, ainsi que les données existantes. Avant de le supprimer, vérifiez qu’il n’est plus référencé par une configuration métier.

:::

## Utiliser dans la configuration des pages

Le champ Date de mise à jour convient aux listes, aux détails, au filtrage et à la vérification des synchronisations.
![20260710153223](https://static-docs.nocobase.com/20260710153223.png)

| Cas d’utilisation | Fonction |
| --- | --- |
| Bloc tableau | Afficher et trier la dernière date de mise à jour. |
| Bloc de filtrage | Filtrer les enregistrements récemment mis à jour ou qui ne l’ont pas été depuis longtemps. |
| Bloc de détails | Afficher la dernière date de mise à jour. |
| Workflow | Participer à une décision en tant que condition temporelle. |

## Liens associés

- [Champs](../index.md) — découvrir le rôle, la classification et la logique de mappage des champs
- [Table standard](../../../data-source-main/general-collection.md) — créer et gérer des champs dans une table standard
- [Date de création](./created-at.md) — enregistrer automatiquement la date de création
- [Date et heure (avec fuseau horaire)](../datetime/datetime.md) — enregistrer une date métier
