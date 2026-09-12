---
title: "Horodatage Unix"
description: "Le champ Horodatage Unix sert à enregistrer des valeurs d’horodatage provenant de systèmes externes."
keywords: "Horodatage Unix,unix timestamp,horodatage,NocoBase"
---

# Horodatage Unix

## Présentation

Dans NocoBase, **l’horodatage Unix (Unix timestamp)** sert à enregistrer des horodatages Unix.

Les horodatages Unix sont souvent utilisés pour l’intégration avec des systèmes externes, les données de journaux ou la migration de données historiques. Ils sont enregistrés sous forme numérique, mais leur signification métier correspond à une date et une heure.

En l’absence d’exigence d’horodatage provenant d’un système externe, il est plus facile de comprendre et de maintenir les données en utilisant directement [Date et heure](./datetime.md).

## Cas d’utilisation

L’horodatage Unix convient aux scénarios métier suivants :

- Synchronisation des horodatages avec des systèmes externes
- Heure à laquelle un événement a été enregistré dans les journaux
- Unix timestamp renvoyé par une API
- Champs temporels lors de la migration de données historiques

## Création et configuration

Dans la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « Horodatage Unix » pour créer un champ Horodatage Unix.

![20240512180432](https://static-docs.nocobase.com/20240512180432.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d’interface du champ. L’horodatage Unix correspond à `unixTimestamp`, qui détermine la manière de saisir et d’afficher la valeur dans la page. |
| Field display name | Nom affiché pour le champ dans l’interface, par exemple « Horodatage de synchronisation », « Heure du journal » ou « Heure de mise à jour externe ». Il est recommandé d’utiliser un nom directement compréhensible par les utilisateurs métier. |
| Field name | Nom d’identification du champ, utilisé pour les API, les champs de relation, les autorisations, les workflows et autres références internes. Il n’est généralement plus modifiable après la création, accepte uniquement les lettres, les chiffres et les traits de soulignement, et doit commencer par une lettre. |
| Field type | Type du champ au niveau des données. L’horodatage Unix est généralement enregistré sous forme d’entier ou de grand entier. |
| Default value | Valeur par défaut. Lors de la création d’un enregistrement, cette valeur peut être renseignée automatiquement si l’utilisateur ne saisit rien. |
| Validation rules | Règles de validation. Il est possible de configurer l’obligation de saisie et la plage de valeurs numériques. |
| Description | Description du champ. Elle peut préciser la signification du champ, les règles de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Le nom du champ sera référencé par les blocs de page, les autorisations, les workflows et les API. Vérifiez la nomenclature avant la création afin d’éviter des coûts d’ajustement de configuration par la suite.

:::

## Caractéristiques du champ

Le comportement par défaut du champ Horodatage Unix est le suivant :

| Caractéristique | Description |
| --- | --- |
| Field interface par défaut | `unixTimestamp`. |
| Field type par défaut | `bigInt`. |
| Field type disponibles | `integer`, `bigInt`. |
| Composant de page | En mode édition, le champ est traité par le composant de champ d’horodatage. |
| Filtrage | Prend en charge le filtrage par valeur numérique de l’horodatage ou par plage temporelle correspondante. |
| Tri | Le tri est pris en charge. |
| Validation | La validation de l’obligation de saisie et de la plage de valeurs numériques est prise en charge. |

## Modification de la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier la configuration du champ Horodatage Unix. La modification d’un champ sert principalement à ajuster sa présentation et son utilisation dans NocoBase, par exemple son nom d’affichage, sa description, sa valeur par défaut, ses règles de validation ou ses paramètres propres.

Si le champ provient d’une table déjà synchronisée dans la base de données principale, sa modification consiste généralement à effectuer une mise en correspondance de champ : le champ de la base de données est associé à un Field type et à un Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifie le nom affiché du champ dans l’interface sans changer son nom d’identification. |
| Field name | Non | Le nom d’identification du champ ne peut généralement pas être modifié dans le formulaire d’édition après la création. |
| Field interface | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors de la mise en correspondance. Cette modification affecte le mode de saisie, d’affichage et de validation dans les pages. |
| Field type | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors de la mise en correspondance. Avant toute modification, vérifiez que les données existantes peuvent être utilisées avec le nouveau type. |
| Default value | Oui | Modifie la valeur par défaut des nouveaux enregistrements. |
| Validation rules | Oui | Modifie les règles de validation du champ. |
| Description | Oui | Complète la signification du champ, les règles de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Changer le Field type ou le Field interface ne revient pas à modifier simplement un nom d’affichage. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les conditions de filtrage et le mode d’utilisation des variables dans les workflows. Lorsque le volume de données existantes est important, vérifiez d’abord que leur format correspond.

:::

## Suppression d’un champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ Horodatage Unix. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs et les supprimer en une seule fois.

Lors de la suppression d’un champ Horodatage Unix créé dans la base de données principale, la colonne correspondante dans la base de données ainsi que les données qu’elle contient sont généralement supprimées en même temps. Lorsqu’un champ est synchronisé depuis une base de données ou provient d’une mise en correspondance avec une source de données externe, l’étendue des conséquences dépend de la source de données et de l’origine du champ.

:::danger Avertissement

La suppression d’un champ peut affecter les blocs de page, les formulaires, les filtres, les autorisations, les workflows, les API, les importations et exportations, ainsi que les données existantes. Avant de le supprimer, vérifiez qu’il n’est plus référencé par des configurations métier.

:::

## Utilisation dans la configuration des pages

Le champ Horodatage Unix convient aux intégrations avec des systèmes externes et aux scénarios liés aux journaux.
![20260709232558](https://static-docs.nocobase.com/20260709232558.png)

| Scénario | Utilisation |
| --- | --- |
| Bloc de formulaire | Saisir ou mettre en correspondance un horodatage. |
| Bloc de tableau | Afficher, trier et filtrer les horodatages. |
| Workflow | Utiliser l’horodatage comme condition temporelle pour un système externe. |
| API | Intégrer une API nécessitant un Unix timestamp. |

## Liens associés

- [Champ](../index.md) — Découvrez le rôle, les catégories et la logique de mise en correspondance des champs
- [Table standard](../../../data-source-main/general-collection.md) — Créer et gérer des champs dans une table standard
- [Date et heure (avec fuseau horaire)](./datetime.md) — Enregistrer une date et une heure standard
- [Entier](../basic/integer.md) — Enregistrer un entier standard