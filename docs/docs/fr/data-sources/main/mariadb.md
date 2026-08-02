---
pkg: "@nocobase/plugin-data-source-manager"
title: "Source de données principale - MariaDB"
description: "Découvrez les versions prises en charge par MariaDB en tant que base de données principale de NocoBase, les méthodes d’installation du plugin, les instructions d’utilisation et le mappage des champs."
keywords: "source de données principale,MariaDB,base de données principale,mappage des champs,NocoBase"
---

# MariaDB

## Présentation

MariaDB peut être utilisé comme base de données principale de NocoBase pour stocker les données des tables système de NocoBase ainsi que les données métier de la source de données principale. La base de données principale est configurée lors du déploiement de NocoBase et ne peut pas être supprimée après le démarrage de l’application.

| Élément de configuration | Description |
| --- | --- |
| Versions prises en charge | >= 10.9. |
| Éditions commerciales | Les éditions communautaire, standard, professionnelle et entreprise sont toutes prises en charge. |
| Type de base de données | MariaDB. |

MariaDB est similaire à MySQL et convient comme base de données principale pour les systèmes métier courants.

## Installation du plugin

MariaDB est une fonctionnalité intégrée et ne nécessite pas l’installation d’un plugin séparé.

## Instructions d’utilisation

1. Lors du déploiement de NocoBase, sélectionnez ou renseignez les paramètres de connexion correspondants à MariaDB dans la configuration de connexion à la base de données.
2. Après le démarrage de NocoBase, accédez à la source de données « Main » dans « Gestion des sources de données » pour gérer les tables et les champs de la base de données principale.
3. Pour intégrer des tables déjà présentes dans la base de données, utilisez « Synchroniser depuis la base de données » sur la page de gestion de la base de données principale.
4. Lors de la configuration des champs d’une table de données, vous pouvez vous référer aux répertoires [Table de données](../data-modeling/collection.md) et [Champ](../data-modeling/collection-fields/index.md) pour sélectionner les types de champs et les composants de champ.

## Mappage des types de champs

Dans la base de données principale, lorsque vous créez un champ via une page NocoBase, NocoBase crée le champ MariaDB correspondant en fonction de la configuration du champ. Lorsque vous intégrez une table existante via « Synchroniser depuis la base de données », NocoBase mappe automatiquement le type de champ MariaDB vers un Field type et une Field interface appropriés. Le mappage des champs courants de MariaDB est essentiellement identique à celui de MySQL. Vous pouvez ajuster le mode d’affichage dans la configuration du champ.

Les mappages courants sont les suivants :

| Type de champ MariaDB | NocoBase Field type | Field interface disponibles |
| --- | --- | --- |
| `TINYINT`、`SMALLINT`、`MEDIUMINT` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group。 |
| `INT`、`INTEGER` | `integer`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Select、Radio group。 |
| `BIGINT` | `bigInt`、`snowflakeId`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `FLOAT`、`DOUBLE` | `float` | Number、Percent。 |
| `DECIMAL` | `decimal` | Number、Percent、Currency。 |
| `CHAR`、`VARCHAR` | `string`、`uuid`、`nanoid`、`encryption` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `TINYTEXT`、`TEXT`、`MEDIUMTEXT`、`LONGTEXT` | `text` | Textarea、Markdown、Vditor、Rich text、URL。 |
| `DATE` | `dateOnly` | Date。 |
| `TIME` | `time` | Time。 |
| `DATETIME` | `datetimeNoTz`、`datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `TIMESTAMP` | `datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `YEAR` | `string`、`integer` | Input、Integer、Date。 |
| `JSON` | `json`、`array` | JSON。 |

:::warning Attention

Les types de champs MariaDB non pris en charge sont affichés séparément dans la configuration des champs. Ces champs doivent faire l’objet d’une adaptation de développement avant de pouvoir être utilisés comme des champs ordinaires dans NocoBase.

:::

Pour plus d’informations sur la configuration générale, consultez [Présentation de la source de données principale](./index.md).
