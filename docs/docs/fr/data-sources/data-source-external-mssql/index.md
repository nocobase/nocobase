---
pkg: "@nocobase/plugin-data-source-external-mssql"
title: "Source de données externe - MSSQL"
description: "Découvrez comment connecter MSSQL/SQL Server à NocoBase en tant que base de données externe, notamment les versions prises en charge, l’installation du plugin, la configuration de la connexion, les connexions chiffrées, les autorisations et la correspondance des champs."
keywords: "source de données externe,MSSQL,SQL Server,base de données externe,correspondance des champs,NocoBase"
---

# MSSQL

## Présentation

MSSQL (SQL Server) peut être connecté à NocoBase en tant que base de données externe. Une fois la connexion établie, NocoBase lit les tables, les champs et les vues de SQL Server, puis les utilise comme tables de données dans la source de données externe.

Contrairement à la [base de données principale](../data-source-main/index.md), la structure réelle des tables MSSQL externes continue d’être gérée par le système métier d’origine, le client de base de données ou les scripts de migration. NocoBase se charge de lire la structure, d’enregistrer les métadonnées des champs et de configurer les blocs de page, les autorisations, les workflows et les API.

| Élément de configuration | Description |
| --- | --- |
| Versions prises en charge | SQL Server 2014-2019. |
| Éditions commerciales | Les éditions Standard, Professionnelle et Entreprise sont prises en charge. |
| Plugin correspondant | `@nocobase/plugin-data-source-external-mssql`. |
| Fonctionnalités de connexion | Prise en charge de la configuration de « Encrypt connection » et de « Trust server certificate ». |

Cas d’utilisation adaptés à MSSQL externe :

- Connecter les bases de données SQL Server de systèmes métier existants tels que des ERP, MES, WMS ou CRM
- Créer une interface de gestion avec NocoBase sans migrer les données historiques
- Gérer les autorisations, les processus, la correction des données ou l’affichage des rapports sur des tables existantes
- Continuer à gérer la structure de la base de données avec le DBA, les scripts de migration ou le système d’origine

:::warning Attention

MSSQL externe n’est pas la base de données système de NocoBase. NocoBase ne prend pas en charge ses sauvegardes, restaurations, migrations ni modifications de structure de tables.

:::

## Installation du plugin

Ce plugin est un plugin commercial. Pour connaître la procédure d’activation, consultez le [guide d’activation des plugins commerciaux](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Ajout d’une source de données

Dans « Gestion des sources de données », cliquez sur « Add new », sélectionnez MSSQL, puis renseignez les informations de connexion.

![20260709210022](https://static-docs.nocobase.com/20260709210022.png)

Voici les paramètres de connexion courants :

| Paramètre | Description |
| --- | --- |
| Data source name | Nom d’identification de la source de données, utilisé comme référence dans les blocs de page, les autorisations, les workflows et les API. Il ne peut pas être modifié après la création. |
| Data source display name | Nom affiché pour la source de données dans l’interface. Il est recommandé d’utiliser un nom compréhensible par les utilisateurs métier, comme « ERP SQL Server » ou « Base financière ». |
| Host / Port | Adresse de l’hôte et port de SQL Server. Le port par défaut est généralement `1433`. |
| Database | Nom de la base de données SQL Server à laquelle se connecter. |
| Username / Password | Nom d’utilisateur et mot de passe utilisés pour se connecter à SQL Server. NocoBase ne peut lire que les objets auxquels ce compte est autorisé à accéder ; il n’accorde pas d’autorisations et ne lit pas les objets privés d’autres comptes. |
| Table prefix | Préfixe des noms de tables. Une fois configuré, NocoBase ne lit que les tables et les vues correspondant à ce préfixe et génère dans NocoBase des noms de tables sans préfixe. |
| Encrypt connection | Indique s’il faut activer la connexion chiffrée. À activer lorsque la base de données impose le chiffrement ou lorsque la liaison réseau doit être chiffrée. |
| Trust server certificate | Indique s’il faut faire confiance au certificat du serveur. Cette option peut être nécessaire dans un environnement de test ou avec un certificat autosigné ; en production, il est recommandé d’utiliser un certificat approuvé. |
| Collections / Add all collections | Contrôle le périmètre de la connexion. Lorsque « Add all collections » est activé, NocoBase connecte toutes les tables et vues du périmètre actuel ; lorsqu’il est désactivé, seules les objets sélectionnés dans « Collections » sont connectés. |
| Enabled the data source | Indique s’il faut activer cette source de données. Lorsqu’elle est désactivée, sa configuration est conservée, mais les blocs de page, les autorisations, les workflows et les API ne peuvent plus lire ses données. |

:::tip Conseil

Si SQL Server contient beaucoup d’objets, réduisez d’abord le périmètre à l’aide de `Database`, `Table prefix` et de « Collections ». Ne connectez que les tables et les vues utilisées par l’application actuelle afin de simplifier la configuration ultérieure des autorisations, la création des pages et la maintenance de la synchronisation.

:::

## Sélection des tables de données

Après avoir renseigné les informations de connexion, cliquez sur « Load Collections » pour charger les tables et les vues disponibles dans SQL Server. Les résultats dépendent du compte de connexion, de `Database`, de `Table prefix` et de la configuration de « Collections ».

Par défaut, « Add all collections » est activé, ce qui signifie que toutes les tables et vues du périmètre actuel sont connectées. Pour ne connecter qu’une partie des objets, désactivez « Add all collections », puis cochez les tables ou les vues nécessaires dans la liste.

![add_new_database_configure_load_collection](https://static-docs.nocobase.com/add_new_database_configure_load_collection.png)

:::warning Attention

Une source de données externe peut connecter au maximum 500 tables ou vues à la fois. Si SQL Server contient beaucoup d’objets, il est recommandé de réduire d’abord le périmètre à l’aide de `Database`, `Table prefix` ou de « Collections ».

:::

## Synchronisation et configuration des champs

La structure des tables MSSQL externes est gérée côté base de données. NocoBase ne crée pas de champs, ne modifie pas leur type et ne supprime pas les champs réels dans SQL Server externe.

Lorsque la structure des tables change côté SQL Server, vous pouvez exécuter « Sync from database » dans la source de données afin de relire les métadonnées des tables et des champs. La synchronisation met à jour dans NocoBase les informations enregistrées sur les tables de données, les champs, les clés primaires, les clés uniques et la correspondance des types de champs, mais elle ne supprime ni les tables ni les données réelles de SQL Server.

Après la synchronisation des champs, vous pouvez configurer dans NocoBase le titre du champ, son type (Field type) et son composant (Field interface). Si vous devez créer des champs de relation NocoBase, les métadonnées de relation sont également enregistrées dans NocoBase ; aucun champ de clé étrangère réel n’est automatiquement ajouté aux tables SQL Server.

## Correspondance des types de champs

NocoBase mappe automatiquement les types de champs SQL Server vers un Field type et un Field interface appropriés. Vous pouvez ajuster le mode d’affichage dans la configuration du champ.

Voici les correspondances courantes :

| Type de champ SQL Server | NocoBase Field type | Field interface disponibles |
| --- | --- | --- |
| `BIT` | `bit` | Checkbox, Switch. |
| `TINYINT`、`SMALLINT` | `integer`、`boolean`、`sort` | Integer, Sort, Checkbox, Switch, Select, Radio group. |
| `INT` | `integer`、`unixTimestamp`、`sort` | Integer, Sort, Unix timestamp, Select, Radio group. |
| `BIGINT` | `bigInt`、`unixTimestamp`、`sort` | Integer, Sort, Unix timestamp, Created at, Updated at. |
| `DECIMAL`、`MONEY`、`SMALLMONEY` | `decimal` | Number, Percent, Currency. |
| `NUMERIC`、`FLOAT`、`REAL` | `float` | Number, Percent. |
| `CHAR`、`VARCHAR`、`NCHAR`、`NVARCHAR` | `string`、`uuid`、`nanoid` | Input, Email, Phone, Password, Color, Icon, Select, Radio group, UUID, Nano ID. |
| `TEXT`、`NTEXT` | `text` | Textarea, Markdown, Vditor, Rich text, URL. |
| `DATE` | `dateOnly` | Date. |
| `TIME` | `time` | Time. |
| `DATETIME`、`DATETIME2` | `datetimeNoTz` | Date, Time, Created at, Updated at. |
| `DATETIMEOFFSET` | `datetimeTz` | Date, Time, Created at, Updated at. |
| `UNIQUEIDENTIFIER` | `uuid`、`string` | UUID, Input. |
| `JSON` | `json`、`array` | JSON. |

:::warning Attention

Les types de champs SQL Server non pris en charge sont affichés séparément dans la configuration des champs. Ils doivent être adaptés par développement avant de pouvoir être utilisés comme des champs ordinaires dans NocoBase.

:::

## Clé primaire et identifiant unique des enregistrements

Pour les tables de données utilisées dans les blocs de page et la modification des données, il est recommandé de disposer d’une clé primaire ou d’un champ unique. NocoBase utilise en priorité la clé primaire comme identifiant unique de l’enregistrement.

Si vous connectez une vue, une table sans clé primaire ou une table avec une clé primaire composite, vous devez définir manuellement « Record unique key » dans la configuration de la table de données. En l’absence d’identifiant unique disponible, les blocs de page peuvent ne pas pouvoir consulter, modifier ou supprimer correctement les enregistrements.

![20260709210154](https://static-docs.nocobase.com/20260709210154.png)
![20260709210214](https://static-docs.nocobase.com/20260709210214.png)

## Liens associés

- [Base de données externe](./index.md) — Consulter les informations générales sur la configuration et la gestion des bases de données externes
- [Gestion des sources de données](../data-source-manager/index.md) — Consulter le point d’entrée des sources de données et leur mode de gestion
- [Champs des tables de données](../data-modeling/collection-fields/index.md) — Consulter les informations sur les types de champs et leur correspondance