---
pkg: "@nocobase/plugin-data-source-external-mysql"
title: "Source de données externe - MySQL"
description: "Découvrez comment connecter MySQL à NocoBase en tant que base de données externe, notamment les versions prises en charge, l'installation du plugin, la configuration de la connexion, le périmètre des tables, les autorisations et le mappage des champs."
keywords: "source de données externe,MySQL,base de données externe,mappage des champs,NocoBase"
---

# MySQL

## Présentation

MySQL peut être connecté à NocoBase en tant que base de données externe. Une fois connecté, NocoBase lit les tables, les champs et les vues de MySQL, puis les utilise comme tables de données dans la source de données externe.

Contrairement à la [base de données principale](../main/index.md), la structure réelle des tables MySQL externes continue d'être gérée par le système métier d'origine, le client de base de données ou les scripts de migration. NocoBase se charge de lire la structure, d'enregistrer les métadonnées des champs, de configurer les blocs de page, les autorisations, les workflows et les API.

| Élément de configuration | Description |
| --- | --- |
| Versions prises en charge | MySQL >= 5.7. |
| Éditions commerciales | Les éditions Standard, Professionnelle et Entreprise sont prises en charge. |
| Plugin correspondant | `@nocobase/plugin-data-source-external-mysql`. |
| Protocole compatible | Connexion via le protocole MySQL. |

L'utilisation d'un MySQL externe est adaptée aux situations suivantes :

- Connecter les bases de données MySQL de systèmes métier existants tels qu'un ERP, un MES, un WMS ou un CRM
- Créer une interface de gestion avec NocoBase sans migrer les données historiques
- Appliquer des contrôles d'accès, des traitements par workflow, des corrections de données ou des affichages de rapports aux tables existantes
- Continuer à faire gérer la structure de la base de données par le DBA, les scripts de migration ou le système d'origine

:::warning Attention

MySQL externe n'est pas la base de données système de NocoBase. NocoBase ne prend pas en charge ses sauvegardes, restaurations, migrations ni modifications de structure des tables.

:::

## Installation du plugin

Ce plugin est un plugin commercial. Pour connaître les modalités d'activation, consultez le [guide d'activation des plugins commerciaux](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Ajouter une source de données

Dans « Gestion des sources de données », cliquez sur « Add new », sélectionnez MySQL, puis renseignez les informations de connexion.

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

Voici les configurations de connexion courantes :

| Configuration | Description |
| --- | --- |
| Data source name | Nom d'identification de la source de données, utilisé pour la référencer dans les blocs de page, les autorisations, les workflows et les API. Il ne peut plus être modifié après la création. |
| Data source display name | Nom de la source de données affiché dans l'interface. Il est recommandé d'utiliser un nom compréhensible par les utilisateurs métier, par exemple « MySQL ERP » ou « Base de données des commandes ». |
| Host / Port | Adresse de l'hôte et port MySQL. Le port par défaut est généralement `3306`. |
| Database | Nom de la base de données MySQL à laquelle se connecter. |
| Username / Password | Identifiant et mot de passe utilisés pour se connecter à MySQL. NocoBase ne peut lire que les objets auxquels ce compte a accès ; il n'accorde pas d'autorisations et ne lit pas les objets privés d'autres comptes. |
| Table prefix | Préfixe des noms de tables. Une fois configuré, NocoBase ne lit que les tables et les vues correspondant à ce préfixe et génère dans NocoBase des noms de tables sans préfixe. |
| Collections / Add all collections | Contrôle le périmètre de connexion. Lorsque « Add all collections » est activé, NocoBase connecte toutes les tables et vues du périmètre actuel ; lorsqu'il est désactivé, seules les objets sélectionnés dans « Collections » sont connectés. |
| Enabled the data source | Indique si cette source de données est activée. Lorsqu'elle est désactivée, sa configuration est conservée, mais les blocs de page, les autorisations, les workflows et les API ne peuvent plus lire ses données. |

:::tip Conseil

Si MySQL contient beaucoup d'objets, réduisez de préférence le périmètre à l'aide de `Database`, `Table prefix` et de « Collections ». Connectez uniquement les tables et les vues utilisées par l'application actuelle afin de simplifier la configuration ultérieure des autorisations, la création des pages et la maintenance de la synchronisation.

:::

## Sélectionner les tables de données

Après avoir renseigné les informations de connexion, vous pouvez cliquer sur « Load Collections » pour charger les tables et les vues disponibles dans MySQL. Les résultats dépendent du compte de connexion, de `Database`, de `Table prefix` et de la configuration de « Collections ».

« Add all collections » est activé par défaut, ce qui signifie que toutes les tables et vues du périmètre actuel sont connectées. Si vous souhaitez ne connecter que certains objets, désactivez « Add all collections », puis cochez les tables ou les vues nécessaires dans la liste.

![add_new_database_configure_load_collection](https://static-docs.nocobase.com/add_new_database_configure_load_collection.png)

:::warning Attention

Une source de données externe peut connecter au maximum 500 tables ou vues à la fois. Si MySQL contient beaucoup d'objets, il est recommandé de réduire d'abord le périmètre à l'aide de `Database`, `Table prefix` ou de « Collections ».

:::

## Synchroniser et configurer les champs

La structure des tables MySQL externes est gérée côté base de données. NocoBase ne crée pas de champs dans MySQL externe, ne modifie pas le type des champs et ne supprime pas les champs réels.

Lorsque la structure des tables côté MySQL change, vous pouvez exécuter « Sync from database » dans la source de données afin de relire les métadonnées des tables et des champs. La synchronisation met à jour dans NocoBase les informations enregistrées sur les tables de données, les champs, les clés primaires, les clés uniques et le mappage des types de champs, mais elle ne supprime ni les tables ni les données réelles de MySQL.

Après la synchronisation des champs, vous pouvez configurer dans NocoBase le titre du champ, le type de champ (Field type) et le composant du champ (Field interface). Si vous devez créer des champs de relation NocoBase, les métadonnées de relation sont également enregistrées dans NocoBase ; aucun champ de clé étrangère réel n'est automatiquement ajouté aux tables MySQL.

## Mappage des types de champs

NocoBase mappe automatiquement les types de champs MySQL vers un Field type et un Field interface appropriés. Vous pouvez ajuster le mode d'affichage dans la configuration du champ.

Les mappages courants sont les suivants :

| Type de champ MySQL | Field type NocoBase | Field interface disponibles |
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

Les types de champs MySQL non pris en charge sont affichés séparément dans la configuration des champs. Ces champs doivent faire l'objet d'une adaptation avant de pouvoir être utilisés comme des champs ordinaires dans NocoBase.

:::

## Clé primaire et identifiant unique des enregistrements

Pour les tables de données utilisées dans les blocs de page pour l'affichage et la modification, il est recommandé de disposer d'une clé primaire ou d'un champ unique. NocoBase utilise en priorité la clé primaire comme identifiant unique de l'enregistrement.

Si vous connectez une vue, une table sans clé primaire ou une table à clé primaire composite, vous devez définir manuellement « Record unique key » dans la configuration de la table de données. En l'absence d'un identifiant unique disponible, les blocs de page peuvent ne pas permettre d'afficher, de modifier ou de supprimer correctement les enregistrements.

![20260709205547](https://static-docs.nocobase.com/20260709205547.png)
![20260709205609](https://static-docs.nocobase.com/20260709205609.png)

- [Base de données externe](./index.md) — Consultez la configuration générale et les informations de gestion des bases de données externes
- [Gestion des sources de données](../data-source-manager/index.md) — Consultez le point d'entrée des sources de données et leur mode de gestion
- [Champs des tables de données](../data-modeling/collection-fields/index.md) — Consultez les types de champs et les informations sur le mappage des champs
