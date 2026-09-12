---
pkg: "@nocobase/plugin-data-source-manager"
title: "Source de données principale - PostgreSQL"
description: "Découvrez les versions prises en charge, l’installation du plugin, le mode d’emploi et le mappage des champs lorsque PostgreSQL est utilisé comme base de données principale de NocoBase."
keywords: "source de données principale,PostgreSQL,base de données principale,mappage des champs,NocoBase"
---

# PostgreSQL

## Introduction

PostgreSQL peut être utilisé comme base de données principale de NocoBase pour stocker les données des tables système de NocoBase ainsi que les données métier de la source de données principale. La base de données principale est configurée lors du déploiement de NocoBase et ne peut pas être supprimée une fois l’application lancée.

| Élément de configuration | Description |
| --- | --- |
| Versions prises en charge | >= 10. |
| Éditions commerciales | Les éditions Community, Standard, Professional et Enterprise sont toutes prises en charge. |
| Type de base de données | PostgreSQL. |

PostgreSQL prend en charge les tables héritées et convient aux scénarios nécessitant l’héritage des modèles de données.

## Installation du plugin

PostgreSQL est une fonctionnalité intégrée et ne nécessite pas l’installation d’un plugin distinct.

## Instructions d’utilisation

1. Lors du déploiement de NocoBase, sélectionnez ou renseignez les paramètres de connexion correspondants à PostgreSQL dans la configuration de la connexion à la base de données.
2. Après le démarrage de NocoBase, accédez à la source de données « Main » dans « Gestion des sources de données » pour gérer les tables et les champs de la base de données principale.
3. Pour connecter des tables déjà présentes dans la base de données, utilisez « Synchroniser depuis la base de données » sur la page de gestion de la base de données principale.
4. Lors de la configuration des champs d’une table de données, vous pouvez consulter les répertoires [Table de données](../data-modeling/collection.md) et [Champ](../data-modeling/collection-fields/index.md) pour choisir les types de champs et les composants de champ.

## Mappage des types de champs

Dans la base de données principale, lorsque vous créez des champs via une page NocoBase, NocoBase crée les champs PostgreSQL correspondants en fonction de la configuration des champs. Lorsque vous connectez une table existante via « Synchroniser depuis la base de données », NocoBase mappe automatiquement les types de champs PostgreSQL vers un Field type et une Field interface appropriés. Vous pouvez ajuster le mode d’affichage dans la configuration du champ.

Les mappages courants sont les suivants :

| Type de champ PostgreSQL | NocoBase Field type | Field interface disponibles |
| --- | --- | --- |
| `BOOLEAN` | `boolean` | Checkbox、Switch。 |
| `SMALLINT`、`INTEGER`、`SERIAL`、`SMALLSERIAL` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group。 |
| `BIGINT`、`BIGSERIAL` | `bigInt`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group、Unix timestamp、Created at、Updated at。 |
| `REAL` | `float` | Number、Percent。 |
| `DOUBLE PRECISION` | `double` | Number、Percent。 |
| `DECIMAL`、`NUMERIC` | `decimal` | Number、Percent、Currency。 |
| `VARCHAR`、`CHAR` | `string`、`password`、`uuid`、`nanoid` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `TEXT` | `text`、`json` | Textarea、Markdown、Vditor、Rich text、URL、JSON。 |
| `UUID` | `uuid` | UUID。 |
| `JSON`、`JSONB` | `json` | JSON。 |
| `TIMESTAMP` | `date` | Date、Time、Created at、Updated at。 |
| `DATE` | `dateOnly` | Date。 |
| `TIME` | `time` | Time。 |
| `POINT`、`LINESTRING`、`POLYGON`、`CIRCLE` | `point`、`lineString`、`polygon`、`circle` | Point、Line string、Polygon、Circle、JSON。 |
| `ARRAY` | `array` | Multiple select、Checkbox group。 |

:::warning Remarque

Les types de champs PostgreSQL non pris en charge sont affichés séparément dans la configuration des champs. Ces champs doivent faire l’objet d’une adaptation par développement avant de pouvoir être utilisés comme des champs ordinaires dans NocoBase.

:::

Pour plus d’informations sur la configuration générale, consultez [Présentation de la source de données principale](./index.md).
