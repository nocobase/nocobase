---
pkg: "@nocobase/plugin-data-source-external-mariadb"
title: "Source de données externe - MariaDB"
description: "Découvrez comment connecter MariaDB à NocoBase en tant que base de données externe, notamment les versions prises en charge, l’installation du plugin, la configuration de la connexion, la portée des tables, les autorisations et le mappage des champs."
keywords: "source de données externe,MariaDB,base de données externe,mappage des champs,NocoBase"
---

# MariaDB

## Présentation

MariaDB peut être connecté à NocoBase en tant que base de données externe. Une fois la connexion établie, NocoBase lit les tables, les champs et les vues de MariaDB, puis les utilise comme tables de données dans la source de données externe.

Contrairement à la [base de données principale](../data-source-main/index.md), la structure réelle des tables MariaDB externes continue d’être gérée par le système métier d’origine, le client de base de données ou les scripts de migration. NocoBase se charge de lire la structure, d’enregistrer les métadonnées des champs et de configurer les blocs de pages, les autorisations, les workflows et les API.

| Élément de configuration | Description |
| --- | --- |
| Versions prises en charge | MariaDB >= 10.3. |
| Éditions commerciales | Les éditions Standard, Professionnelle et Entreprise sont prises en charge. |
| Plugin correspondant | `@nocobase/plugin-data-source-external-mariadb`. |
| Protocole compatible | La connexion utilise le protocole MySQL et le mappage des champs suit globalement la logique de compatibilité MySQL. |

Cas adaptés à l’utilisation d’une base MariaDB externe :

- Connecter les bases MariaDB de systèmes métier existants tels que des ERP, MES, WMS ou CRM
- Créer une interface de gestion avec NocoBase sans migrer les données historiques
- Appliquer des autorisations, gérer des workflows, corriger les données ou afficher des rapports à partir de tables existantes
- Continuer à faire gérer la structure de la base de données par le DBA, les scripts de migration ou le système d’origine

:::warning Attention

MariaDB externe n’est pas la base de données système de NocoBase. NocoBase ne prend pas en charge ses sauvegardes, restaurations, migrations ni modifications de structure des tables.

:::

## Installation du plugin

Ce plugin est un plugin commercial. Pour connaître la procédure d’activation détaillée, consultez le [guide d’activation des plugins commerciaux](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Ajouter une source de données

Dans « Gestion des sources de données », cliquez sur « Add new », sélectionnez MariaDB, puis renseignez les informations de connexion.

![20260709204413](https://static-docs.nocobase.com/20260709204413.png)

Voici les paramètres de connexion courants :

| Paramètre | Description |
| --- | --- |
| Data source name | Nom d’identification de la source de données, utilisé comme référence dans les blocs de pages, les autorisations, les workflows et les API. Il ne peut plus être modifié après la création. |
| Data source display name | Nom affiché dans l’interface pour la source de données. Il est recommandé d’utiliser un nom compréhensible par les utilisateurs métier, comme « MariaDB ERP » ou « Base de données des commandes ». |
| Host / Port | Adresse et port de l’hôte MariaDB. Le port par défaut est généralement `3306`. |
| Database | Nom de la base de données MariaDB à laquelle se connecter. |
| Username / Password | Nom d’utilisateur et mot de passe utilisés pour se connecter à MariaDB. NocoBase peut uniquement lire les objets auxquels ce compte a accès ; il n’accorde pas d’autorisations et ne lit pas les objets privés d’autres comptes. |
| Table prefix | Préfixe des noms de tables. Une fois configuré, NocoBase ne lit que les tables et les vues correspondant à ce préfixe et génère dans NocoBase des noms de tables sans préfixe. |
| Collections / Add all collections | Contrôle la portée de la connexion. Lorsque « Add all collections » est activé, NocoBase connecte toutes les tables et vues de la portée actuelle ; lorsqu’il est désactivé, seules les objets sélectionnés dans « Collections » sont connectés. |
| Enabled the data source | Indique si cette source de données est activée. Lorsqu’elle est désactivée, sa configuration est conservée, mais les blocs de pages, les autorisations, les workflows et les API ne peuvent plus lire ses données. |

:::tip Conseil

Si MariaDB contient beaucoup d’objets, réduisez en priorité la portée à l’aide de `Database`, `Table prefix` et de « Collections ». Ne connectez que les tables et les vues utilisées par l’application actuelle afin de simplifier la configuration ultérieure des autorisations, la création des pages et la maintenance de la synchronisation.

:::

## Sélectionner les tables de données

Après avoir renseigné les informations de connexion, vous pouvez cliquer sur « Load Collections » pour charger les tables et les vues disponibles dans MariaDB. Les résultats du chargement dépendent du compte de connexion, de `Database`, de `Table prefix` et de la configuration « Collections ».

Par défaut, « Add all collections » est activé, ce qui signifie que toutes les tables et vues de la portée actuelle seront connectées. Si vous souhaitez connecter uniquement certains objets, désactivez « Add all collections », puis cochez les tables ou les vues nécessaires dans la liste.

![20260709204452](https://static-docs.nocobase.com/20260709204452.png)

:::warning Attention

Une source de données externe peut connecter au maximum 500 tables ou vues à la fois. Si MariaDB contient beaucoup d’objets, il est recommandé de réduire d’abord la portée à l’aide de `Database`, `Table prefix` ou de « Collections ».

:::

## Synchroniser et configurer les champs

La structure des tables MariaDB externes est gérée côté base de données. NocoBase ne crée pas de champs dans MariaDB externe, ne modifie pas les types de champs et ne supprime pas les champs réels.

Lorsque la structure d’une table côté MariaDB est modifiée, vous pouvez exécuter « Sync from database » dans la source de données afin de relire les métadonnées des tables et des champs. La synchronisation met à jour les informations enregistrées dans NocoBase concernant les tables de données, les champs, les clés primaires, les clés uniques et le mappage des types de champs, mais elle ne supprime ni les tables ni les données réelles dans MariaDB.

Après la synchronisation des champs, vous pouvez configurer dans NocoBase le libellé du champ, son type (Field type) et son composant (Field interface). Si vous devez créer un champ de relation NocoBase, les métadonnées de relation sont également enregistrées dans NocoBase ; aucun champ de clé étrangère réel n’est automatiquement ajouté aux tables MariaDB.

## Mappage des types de champs

NocoBase mappe automatiquement les types de champs MariaDB vers un Field type et un Field interface appropriés. Le mappage des champs courants de MariaDB est globalement identique à celui de MySQL ; vous pouvez ajuster le mode d’affichage dans la configuration du champ.

Voici les mappages courants :

| Type de champ MariaDB | NocoBase Field type | Field interface disponible |
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

Les types de champs MariaDB non pris en charge sont affichés séparément dans la configuration des champs. Ces champs doivent être adaptés par développement avant de pouvoir être utilisés comme des champs ordinaires dans NocoBase.

:::

## Clé primaire et identifiant unique des enregistrements

Pour les tables de données utilisées dans les blocs de pages et pour l’édition, il est recommandé de disposer d’une clé primaire ou d’un champ unique. NocoBase utilise en priorité la clé primaire comme identifiant unique de l’enregistrement.

Si vous connectez une vue, une table sans clé primaire ou une table à clé primaire composite, vous devez définir manuellement « Record unique key » dans la configuration de la table de données. En l’absence d’identifiant unique disponible, les blocs de pages peuvent ne pas permettre d’afficher, de modifier ou de supprimer correctement les enregistrements.

![20260709205835](https://static-docs.nocobase.com/20260709205835.png)
![20260709205854](https://static-docs.nocobase.com/20260709205854.png)

## Liens associés

- [Base de données externe](./index.md) — Consultez les informations générales sur la configuration et la gestion des bases de données externes
- [Gestion des sources de données](../data-source-manager/index.md) — Consultez le point d’entrée des sources de données et leur mode de gestion
- [Champs des tables de données](../data-modeling/collection-fields/index.md) — Consultez les informations sur les types de champs et leur mappage