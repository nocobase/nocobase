---
pkg: "@nocobase/plugin-data-source-oceanbase"
title: "Source de données externe - OceanBase"
description: "Découvrez comment connecter OceanBase à NocoBase en tant que base de données externe, notamment les versions prises en charge, le mode de compatibilité MySQL, la configuration de connexion, le périmètre des tables, les autorisations et le mappage des champs."
keywords: "source de données externe,OceanBase,base de données externe,mode de compatibilité MySQL,mappage des champs,NocoBase"
---

# OceanBase

## Présentation

OceanBase peut être connecté à NocoBase en tant que base de données externe. Une fois la connexion établie, NocoBase lit les tables de données, les champs et les vues d’OceanBase, puis les utilise comme tables de données dans la source de données externe.

Contrairement à la [base de données principale](../main/index.md), la structure réelle des tables OceanBase externes continue d’être gérée par le système métier d’origine, le client de base de données ou les scripts de migration. NocoBase se charge de lire la structure, d’enregistrer les métadonnées des champs et de configurer les blocs de pages, les autorisations, les workflows et les API.

| Élément de configuration | Description |
| --- | --- |
| Versions prises en charge | OceanBase >= 4.3. |
| Édition commerciale | Prise en charge dans l’édition Enterprise. |
| Plugin correspondant | `@nocobase/plugin-data-source-oceanbase`. |
| Mode de base de données | Seul le mode de compatibilité MySQL est pris en charge. |

L’utilisation d’OceanBase comme source externe est adaptée aux situations suivantes :

- Connecter une base métier existante dans un locataire OceanBase en mode MySQL
- Créer une interface de gestion avec NocoBase sans migrer les données historiques
- Gérer les autorisations, les workflows, la correction des données ou l’affichage des rapports pour des tables existantes
- Continuer à gérer la structure de la base de données avec le DBA, les scripts de migration ou le système d’origine

:::warning Attention

Lorsqu’OceanBase est utilisé comme base de données externe, seul le mode de compatibilité MySQL est pris en charge. En mode de compatibilité Oracle, NocoBase ne peut pas lire la structure des tables et les types de champs avec le plugin actuel.

:::

## Installation du plugin

Ce plugin est un plugin commercial. Pour connaître la procédure d’activation, consultez : [Guide d’activation des plugins commerciaux](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Ajout d’une source de données

Dans « Gestion des sources de données », cliquez sur « Add new », sélectionnez OceanBase, puis renseignez les informations de connexion.

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

Voici les paramètres de connexion courants :

| Paramètre | Description |
| --- | --- |
| Data source name | Nom d’identification de la source de données, utilisé comme référence dans les blocs de pages, les autorisations, les workflows et les API. Il ne peut pas être modifié après la création. |
| Data source display name | Nom affiché dans l’interface pour la source de données. Il est recommandé d’utiliser un nom compréhensible par les utilisateurs métier, par exemple « Base métier OceanBase » ou « Base de rapports ». |
| Host / Port | Adresse et port de connexion OceanBase en mode de compatibilité MySQL. Le port dépend de la configuration réelle du locataire ou du proxy. |
| Database | Nom de la base de données OceanBase à laquelle se connecter. |
| Username / Password | Nom d’utilisateur et mot de passe utilisés pour se connecter à OceanBase. NocoBase peut uniquement lire les objets auxquels ce compte a accès ; il n’accorde pas d’autorisations et ne lit pas les objets privés d’autres comptes. |
| Table prefix | Préfixe des noms de tables. Une fois configuré, NocoBase ne lit que les tables et les vues correspondant à ce préfixe et génère dans NocoBase des noms de tables sans préfixe. |
| Collections / Add all collections | Contrôle le périmètre de connexion. Lorsque « Add all collections » est activé, NocoBase connecte toutes les tables et vues du périmètre actuel ; lorsqu’il est désactivé, seules les objets sélectionnés dans « Collections » sont connectés. |
| Enabled the data source | Indique si cette source de données est activée. Lorsqu’elle est désactivée, sa configuration est conservée, mais les blocs de pages, les autorisations, les workflows et les API ne peuvent plus lire ses données. |

:::tip Conseil

Si OceanBase contient de nombreux objets, réduisez d’abord le périmètre à l’aide de `Database`, `Table prefix` et de « Collections ». En ne connectant que les tables et les vues utilisées par l’application actuelle, vous simplifierez la configuration ultérieure des autorisations, la création des pages et la maintenance de la synchronisation.

:::

## Sélection des tables de données

Après avoir renseigné les informations de connexion, vous pouvez cliquer sur « Load Collections » pour lire les tables de données et les vues disponibles dans OceanBase. Les résultats de la lecture dépendent du compte de connexion, de `Database`, de `Table prefix` et de la configuration de « Collections ».

« Add all collections » est activé par défaut, ce qui signifie que toutes les tables et vues du périmètre actuel sont connectées. Si vous souhaitez connecter uniquement certains objets, désactivez « Add all collections », puis cochez les tables de données ou les vues nécessaires dans la liste.

![add_new_database_configure_load_collection](https://static-docs.nocobase.com/add_new_database_configure_load_collection.png)

:::warning Attention

Une source de données externe peut connecter au maximum 500 tables de données ou vues à la fois. Si OceanBase contient de nombreux objets, il est recommandé de réduire d’abord le périmètre à l’aide de `Database`, `Table prefix` ou de « Collections ».

:::

## Synchronisation et configuration des champs

La structure des tables OceanBase externes est gérée côté base de données. NocoBase ne crée pas de champs dans OceanBase, ne modifie pas le type des champs et ne supprime pas les champs réels.

Lorsque la structure des tables change côté OceanBase, vous pouvez exécuter « Sync from database » dans la source de données afin de relire les métadonnées des tables et des champs. La synchronisation met à jour les tables de données, les champs, les clés primaires, les clés uniques et les informations de mappage des types de champs enregistrés dans NocoBase, mais ne supprime ni les tables réelles ni les données dans OceanBase.

Après la synchronisation des champs, vous pouvez configurer dans NocoBase le titre du champ, le type de champ (Field type) et le composant du champ (Field interface). Si vous devez créer des champs de relation NocoBase, les métadonnées de relation sont également enregistrées dans NocoBase ; aucun champ de clé étrangère réel n’est automatiquement ajouté aux tables OceanBase.

## Mappage des types de champs

NocoBase identifie les types de champs OceanBase selon la logique de compatibilité MySQL et les mappe automatiquement vers un Field type et un Field interface appropriés. Vous pouvez ajuster le mode d’affichage dans la configuration du champ.

Les mappages courants sont les suivants :

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

Les types de champs OceanBase non pris en charge sont affichés séparément dans la configuration des champs. Ces champs doivent être adaptés par développement avant de pouvoir être utilisés comme des champs ordinaires dans NocoBase.

:::

## Clé primaire et identifiant unique des enregistrements

Pour les tables de données utilisées dans les blocs de pages et l’édition, il est recommandé de disposer d’une clé primaire ou d’un champ unique. NocoBase utilise en priorité la clé primaire comme identifiant unique de l’enregistrement.

Si vous connectez une vue, une table sans clé primaire ou une table à clé primaire composée, vous devez définir manuellement « Record unique key » dans la configuration de la table de données. En l’absence d’un identifiant unique disponible, les blocs de pages risquent de ne pas pouvoir afficher, modifier ou supprimer correctement les enregistrements.

![edit_collection](https://static-docs.nocobase.com/edit_collection.png)

![edit_collection_configure](https://static-docs.nocobase.com/edit_collection_configure.png)

## Liens associés

- [Base de données externe](./index.md) — Consultez les informations générales sur la configuration et la gestion des bases de données externes
- [Gestion des sources de données](../data-source-manager/index.md) — Consultez le point d’accès aux sources de données et leur mode de gestion
- [Champs des tables de données](../data-modeling/collection-fields/index.md) — Consultez les informations sur les types de champs et leur mappage