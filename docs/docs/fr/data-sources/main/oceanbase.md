---
pkg: "@nocobase/plugin-data-source-oceanbase"
title: "Source de données principale - OceanBase"
description: "Découvrez les versions prises en charge par OceanBase en tant que base de données principale de NocoBase, l’installation du plugin, les instructions d’utilisation et la correspondance des champs."
keywords: "source de données principale,OceanBase,base de données principale,correspondance des champs,NocoBase"
---

# OceanBase

## Introduction

OceanBase peut être utilisé comme base de données principale de NocoBase pour stocker les données des tables système de NocoBase ainsi que les données métier de la source de données principale. La base de données principale est configurée lors du déploiement de NocoBase et ne peut plus être supprimée une fois l’application exécutée.

| Élément de configuration | Description |
| --- | --- |
| Versions prises en charge | >= 4.3. |
| Version commerciale | Prise en charge par l’édition Enterprise. |
| Type de base de données | Mode compatible avec MySQL. |

:::warning Attention

Lorsqu’OceanBase est utilisé comme base de données principale, seul le mode compatible avec MySQL est pris en charge.

:::

## Installation du plugin

OceanBase est fourni par `@nocobase/plugin-data-source-oceanbase` et nécessite une licence commerciale.

## Instructions d’utilisation

1. Lors du déploiement de NocoBase, sélectionnez ou renseignez les paramètres de connexion correspondant à OceanBase dans la configuration de connexion à la base de données.
2. Après avoir démarré NocoBase, accédez à la source de données « Main » dans « Gestion des sources de données » pour gérer les tables et les champs de la base de données principale.
3. Pour connecter des tables déjà présentes dans la base de données, utilisez « Synchroniser depuis la base de données » dans la page de gestion de la base de données principale.
4. Lors de la configuration des champs d’une table, vous pouvez vous référer aux répertoires [Table de données](../data-modeling/collection.md) et [Champ](../data-modeling/collection-fields/index.md) pour sélectionner les types de champs et les composants de champ.

## Correspondance des types de champs

Dans la base de données principale, lorsque vous créez des champs depuis une page NocoBase, NocoBase crée les champs OceanBase correspondants en fonction de la configuration des champs. Lorsque vous connectez des tables existantes via « Synchroniser depuis la base de données », NocoBase identifie les types de champs OceanBase selon la logique de compatibilité avec MySQL et les associe automatiquement au Field type et à la Field interface appropriés. Vous pouvez ajuster le mode d’affichage dans la configuration du champ.

Les correspondances courantes sont les suivantes :

| Type de champ OceanBase | NocoBase Field type | Field interface disponibles |
| --- | --- | --- |
| `TINYINT`、`SMALLINT`、`MEDIUMINT` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group。 |
| `INT`、`INTEGER` | `integer`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Select、Radio group。 |
| `BIGINT` | `bigInt`、`snowflakeId`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `FLOAT`、`DOUBLE` | `float` | Number、Percent。 |
| `DECIMAL` | `decimal` | Number、Percent、Currency。 |
| `CHAR`、`VARCHAR` | `string`、`uuid`、`nanoid`、`encryption` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `TEXT` | `text` | Textarea、Markdown、Vditor、Rich text、URL。 |
| `DATE` | `dateOnly` | Date。 |
| `TIME` | `time` | Time。 |
| `DATETIME` | `datetimeNoTz`、`datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `TIMESTAMP` | `datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `JSON` | `json`、`array` | JSON。 |

:::warning Attention

Les types de champs OceanBase non pris en charge sont affichés séparément dans la configuration des champs. Ces champs doivent être adaptés par développement avant de pouvoir être utilisés comme champs ordinaires dans NocoBase.

:::

Pour plus d’informations sur la configuration générale, consultez [Présentation de la source de données principale](./index.md).
