---
title: "Date de création"
description: "Le champ Date de création permet d’enregistrer automatiquement la date et l’heure de création d’un enregistrement."
keywords: "Date de création,createdAt,champs système,NocoBase"
---

# Date de création

## Présentation

Dans NocoBase, **la date de création (Created at)** permet d’enregistrer automatiquement la date et l’heure de création d’un enregistrement.

La date de création est généralement générée par un champ prédéfini. Elle convient au tri, au filtrage, à l’audit, aux conditions de workflow et aux statistiques de données.

Si vous devez saisir manuellement une date métier, comme une date de signature ou une date d’échéance, utilisez[Date](../datetime/date.md)ou[Date et heure](../datetime/datetime.md).

## Cas d’utilisation

Le champ Date de création convient aux cas d’utilisation suivants :

- Trier par date de création
- Filtrer les données créées au cours d’une période donnée
- Auditer la date de création des enregistrements
- Déterminer dans un workflow la date de création d’un nouvel enregistrement

## Configuration de la création

Sur la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « Date de création » pour créer un champ Date de création.

![20240512174347](https://static-docs.nocobase.com/20240512174347.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d’interface du champ. La date de création correspond à `createdAt` et détermine la manière dont le champ est saisi et affiché dans la page. |
| Field display name | Nom affiché du champ dans l’interface, par exemple « Date de création » ou « Heure de création ». Il est recommandé d’utiliser un nom que les utilisateurs métier peuvent comprendre directement. |
| Field name | Nom d’identification du champ, utilisé pour les références internes dans l’API, les champs de relation, les autorisations, les workflows, etc. Après sa création, il n’est généralement plus modifié ; seuls les lettres, les chiffres et les traits de soulignement sont pris en charge, et le nom doit commencer par une lettre. |
| Field type | Type du champ dans la couche de données. La date de création utilise généralement `date`. |
| Default value | Valeur par défaut. Lors de l’ajout d’un enregistrement, une valeur par défaut peut être renseignée automatiquement si l’utilisateur n’en saisit aucune. |
| Validation rules | Géré automatiquement par le système ; aucune validation manuelle n’est généralement nécessaire. |
| Description | Description du champ. Elle peut préciser sa signification, les exigences de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Le nom du champ sera référencé par les blocs de page, les autorisations, les workflows et l’API après sa création. Vérifiez le nom avant la création afin d’éviter des coûts d’ajustement de configuration ultérieurs.

:::

## Caractéristiques du champ

Le comportement par défaut du champ Date de création est le suivant :

| Caractéristique | Description |
| --- | --- |
| Field interface par défaut | `createdAt`. |
| Field type par défaut | `date`. |
| Field type disponible | `date`. |
| Composant de page | Renseigné automatiquement par le système ; il est généralement affiché en lecture seule sur la page. |
| Filtrage | Prend en charge le filtrage par date et par intervalle. |
| Tri | Prend en charge le tri par date. |
| Validation | Renseignée automatiquement par le système. |

## Modifier la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier la configuration du champ Date de création. La modification du champ sert principalement à ajuster son affichage et son utilisation dans NocoBase, par exemple en modifiant son nom d’affichage, sa description, sa valeur par défaut, ses règles de validation ou sa configuration spécifique.

Si le champ provient d’une table déjà synchronisée dans la base de données principale, sa modification consiste généralement à effectuer une correspondance de champ : le champ de la base de données est associé à un Field type et à une Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifier le nom affiché du champ dans l’interface sans changer son nom d’identification. |
| Field name | Non | Le nom d’identification du champ ne peut généralement pas être modifié dans le formulaire d’édition après sa création. |
| Field interface | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors de la mise en correspondance. Cette modification affecte la manière dont les données sont saisies, affichées et validées sur la page. |
| Field type | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors de la mise en correspondance. Avant toute modification, vérifiez que les données existantes peuvent être utilisées avec le nouveau type. |
| Default value | Oui | Ajuster la valeur par défaut lors de l’ajout d’un nouvel enregistrement. |
| Validation rules | Oui | Ajuster les règles de validation du champ. |
| Description | Oui | Compléter la signification du champ, les exigences de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Changer le Field type ou la Field interface ne revient pas à modifier simplement un nom d’affichage. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les conditions de filtrage et le mode d’utilisation des variables dans les workflows. Lorsque les données existantes sont nombreuses, vérifiez d’abord que leur format correspond.

:::

## Supprimer un champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ Date de création. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs et les supprimer en lot.

Lors de la suppression d’un champ Date de création nouvellement créé dans la base de données principale, la colonne réelle correspondante dans la base de données et les données déjà présentes dans cette colonne sont généralement supprimées simultanément. Lors de la suppression d’un champ synchronisé depuis une base de données ou issu d’une source de données externe, l’étendue des conséquences dépend de la source de données et de l’origine du champ concernées.

:::danger Avertissement

La suppression d’un champ peut affecter les blocs de page, les formulaires, les filtres, les autorisations, les workflows, l’API, les importations et exportations, ainsi que les données existantes. Avant de supprimer le champ, vérifiez qu’il n’est plus utilisé par une configuration métier.

:::

## Utilisation dans la configuration des pages

Le champ Date de création convient aux listes, aux détails, au filtrage et à l’audit.
![20260710153223](https://static-docs.nocobase.com/20260710153223.png)

| Cas d’utilisation | Fonction |
| --- | --- |
| Bloc de tableau | Afficher et trier la date de création. |
| Bloc de filtrage | Filtrer les enregistrements créés au cours d’une période donnée. |
| Bloc de détails | Consulter la date de création de l’enregistrement. |
| Workflow | Participer à une décision en tant que condition temporelle. |

## Liens associés

- [Champs](../index.md) — Comprendre le rôle, la classification et la logique de mise en correspondance des champs
- [Table standard](../../../data-source-main/general-collection.md) — Créer et gérer des champs dans une table standard
- [Date et heure (avec fuseau horaire)](../datetime/datetime.md) — Enregistrer une date et une heure métier
- [Date de mise à jour](./updated-at.md) — Enregistrer automatiquement la date et l’heure de mise à jour
