---
title: "Snowflake ID"
description: "Le champ Snowflake ID sert à générer des identifiants Snowflake de 53 bits et est souvent utilisé comme clé primaire par défaut."
keywords: "Snowflake ID,snowflakeId,clé primaire,NocoBase"
---

# Snowflake ID

## Présentation

Dans NocoBase, **Snowflake ID（Snowflake ID）** sert à générer des identifiants uniques.

Snowflake ID est le type de clé primaire couramment utilisé pour le champ ID par défaut des tables standard de NocoBase. Il convient comme identifiant unique interne des enregistrements.

Si vous avez besoin d’un numéro lisible par un système externe, utilisez une[序列](../../../field-sequence/index.md) ou un champ de numéro métier.

## Cas d’utilisation

Snowflake ID convient aux scénarios métier suivants :

- Clé primaire par défaut des tables standard
- ID des enregistrements internes
- Tables métier nécessitant la génération haute performance d’identifiants uniques
- Identifiants uniques ne nécessitant pas d’être compréhensibles par les utilisateurs

## Configuration lors de la création

Sur la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « Snowflake ID » pour créer un champ Snowflake ID.

![20251209204217](https://static-docs.nocobase.com/20251209204217.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d’interface du champ. Snowflake ID correspond à `snowflakeId` et détermine la manière dont le champ est saisi et affiché dans la page. |
| Field display name | Nom affiché du champ dans l’interface, par exemple « ID », « ID de l’enregistrement » ou « ID interne ». Il est recommandé d’utiliser un nom directement compréhensible par les utilisateurs métier. |
| Field name | Nom d’identification du champ, utilisé pour les références internes dans l’API, les champs de relation, les permissions, les workflows, etc. Après sa création, il n’est généralement plus modifiable. Il ne peut contenir que des lettres, des chiffres et des underscores, et doit commencer par une lettre. |
| Field type | Type du champ dans la couche de données. Snowflake ID utilise généralement `bigInt`. |
| Default value | Valeur par défaut. Lors de la création d’un enregistrement, cette valeur peut être renseignée automatiquement si l’utilisateur n’en saisit aucune. |
| Validation rules | Généralement générées automatiquement par le système, sans vérification manuelle nécessaire. |
| Description | Description du champ. Vous pouvez y préciser sa signification, les exigences de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Le nom du champ sera référencé par les blocs de page, les permissions, les workflows et l’API. Vérifiez son nom avant la création afin d’éviter les coûts d’ajustement de configuration liés à une modification ultérieure.

:::

## Caractéristiques du champ

Le comportement par défaut du champ Snowflake ID est le suivant :

| Caractéristique | Description |
| --- | --- |
| Field interface par défaut | `snowflakeId`. |
| Field type par défaut | `bigInt`. |
| Field type disponible | `bigInt`. |
| Composant de page | Généralement généré automatiquement, sans saisie manuelle nécessaire. |
| Filtrage | La recherche exacte par ID est prise en charge. |
| Tri | Le tri est pris en charge. |
| Validation | Généralement générée automatiquement et maintenue comme unique. |

## Modification de la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier la configuration du champ Snowflake ID. La modification d’un champ sert principalement à ajuster son affichage et son utilisation dans NocoBase, par exemple son nom d’affichage, sa description, sa valeur par défaut, ses règles de validation ou sa configuration spécifique.

Si le champ provient d’une table déjà synchronisée dans la base de données principale, sa modification consiste généralement à effectuer un mappage de champ : le champ de la base de données est mappé vers un Field type et un Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifier le nom d’affichage du champ dans l’interface, sans changer son nom d’identification. |
| Field name | Non | Le nom d’identification du champ ne peut généralement pas être modifié dans le formulaire d’édition après sa création. |
| Field interface | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. Cette modification affecte la manière dont le champ est saisi, affiché et validé dans les pages. |
| Field type | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. Avant toute modification, vérifiez que les données existantes peuvent être utilisées avec le nouveau type. |
| Default value | Oui | Modifier la valeur par défaut lors de la création de nouveaux enregistrements. |
| Validation rules | Oui | Modifier les règles de validation du champ. |
| Description | Oui | Compléter la signification du champ, les exigences de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Changer le Field type ou le Field interface ne revient pas à modifier simplement un nom d’affichage. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les conditions de filtrage et le mode d’utilisation des variables dans les workflows. Lorsque le volume de données existantes est important, vérifiez d’abord que leur format correspond.

:::

## Suppression du champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ Snowflake ID. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs et les supprimer par lots.

Lors de la suppression d’un champ Snowflake ID créé dans la base de données principale, la colonne réelle correspondante et les données qu’elle contient sont généralement supprimées simultanément de la base de données. Pour un champ synchronisé depuis une base de données ou mappé depuis une source de données externe, l’étendue des effets dépend de la source de données et de l’origine du champ concernées.

:::danger Avertissement

La suppression d’un champ peut affecter les blocs de page, les formulaires, les filtres, les permissions, les workflows, l’API, les importations et exportations, ainsi que les données existantes. Avant de le supprimer, vérifiez qu’il n’est plus référencé par des configurations métier.

:::

## Utilisation dans la configuration des pages

Le champ Snowflake ID convient comme clé primaire et comme identifiant unique interne.
![20260710145423](https://static-docs.nocobase.com/20260710145423.png)

| Scénario | Utilisation |
| --- | --- |
| Création d’une table | Utilisé comme champ ID par défaut. |
| Champ de relation | Utilisé comme identifiant unique de l’enregistrement associé. |
| API | Utilisé pour localiser un enregistrement individuel. |
| Permissions et workflows | Utilisé comme identifiant unique de l’enregistrement dans les traitements internes. |

## Liens associés

- [字段](../index.md) — Découvrez le rôle, la classification et la logique de mappage des champs
- [普通表](../../../data-source-main/general-collection.md) — Créez et gérez des champs dans une table standard
- [UUID](./uuid.md) — Utilisez UUID comme identifiant unique
- [Nano ID](./nano-id.md) — Utilisez des identifiants courts
- [序列](../../../field-sequence/index.md) — Générez des numéros métier
