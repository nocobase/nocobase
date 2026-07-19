---
pkg: "@nocobase/plugin-data-source-kingbase"
title: "Source de données externe - KingbaseES"
description: "Découvrez comment intégrer KingbaseES à NocoBase en tant que base de données externe, notamment les versions prises en charge, le mode de compatibilité PostgreSQL, la configuration de la connexion, les schémas, les permissions et le mappage des champs."
keywords: "source de données externe,KingbaseES,Renmin Jindang,base de données externe,mode de compatibilité PostgreSQL,mappage des champs,NocoBase"
---

# KingbaseES

## Présentation

KingbaseES peut être intégré à NocoBase en tant que base de données externe. Une fois connectée, NocoBase lit les tables, les champs et les vues de KingbaseES, puis les utilise comme tables de données de la source de données externe.

Contrairement à la [base de données principale](../main/index.md), la structure réelle des tables de KingbaseES externe reste gérée par le système métier d'origine, le client de base de données ou les scripts de migration. NocoBase se charge de lire la structure, d'enregistrer les métadonnées des champs et de configurer les blocs de page, les permissions, les workflows et les API.

| Élément de configuration | Description |
| --- | --- |
| Versions prises en charge | KingbaseES >= V9. |
| Éditions commerciales | Les éditions Professional et Enterprise sont prises en charge. |
| Plugin correspondant | `@nocobase/plugin-data-source-kingbase`. |
| Mode de base de données | Seul le mode de compatibilité PostgreSQL est pris en charge. |

Les scénarios adaptés à l'utilisation de KingbaseES externe sont les suivants :

- Connecter une base métier KingbaseES existante dans un environnement gouvernemental ou d'entreprise, un réseau interne ou un environnement utilisant des technologies nationales
- Créer une interface de gestion avec NocoBase sans migrer les données historiques
- Appliquer des contrôles de permissions, des traitements par workflow, des corrections de données ou des affichages de rapports aux tables existantes
- Continuer à faire gérer la structure de la base de données par le DBA, les scripts de migration ou le système d'origine

:::warning Attention

Lorsqu'il est utilisé comme base de données externe, KingbaseES ne prend en charge que le mode de compatibilité PostgreSQL. Si la base de données n'est pas configurée dans ce mode, NocoBase ne pourra pas lire la structure des tables et les types de champs avec le plugin actuel.

:::

## Installation du plugin

Ce plugin est un plugin commercial. Pour connaître les modalités d'activation, consultez le [guide d'activation des plugins commerciaux](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Ajouter une source de données

Dans « Data source management », cliquez sur « Add new », sélectionnez KingbaseES, puis renseignez les informations de connexion.

![20260709210325](https://static-docs.nocobase.com/20260709210325.png)

Voici les paramètres de connexion courants :

| Paramètre | Description |
| --- | --- |
| Data source name | Nom d'identification de la source de données, utilisé comme référence dans les blocs de page, les permissions, les workflows et les API. Il ne peut plus être modifié après la création. |
| Data source display name | Nom affiché dans l'interface pour la source de données. Il est recommandé d'utiliser un nom compréhensible par les utilisateurs métier, comme « KingbaseES des services publics » ou « Base de rapports ». |
| Host / Port | Adresse de l'hôte et port de KingbaseES. Le port doit correspondre à la configuration réelle de la base de données. |
| Database | Nom de la base de données KingbaseES à laquelle se connecter. |
| Username / Password | Nom d'utilisateur et mot de passe utilisés pour se connecter à KingbaseES. NocoBase ne peut lire que les objets auxquels ce compte a accès ; il n'accorde pas de permissions et ne lit pas les objets privés d'autres comptes. |
| Schema | Schéma à lire. Si la base de données contient plusieurs schémas, il est recommandé de ne renseigner que celui requis par l'activité actuelle. |
| Table prefix | Préfixe des noms de tables. Une fois configuré, NocoBase ne lit que les tables et les vues correspondant à ce préfixe, et génère dans NocoBase des noms de tables sans ce préfixe. |
| Collections / Add all collections | Contrôle le périmètre de l'intégration. Lorsque « Add all collections » est activé, NocoBase intègre toutes les tables et les vues du périmètre actuel ; lorsqu'il est désactivé, seuls les objets sélectionnés dans « Collections » sont intégrés. |
| Enabled the data source | Indique si cette source de données est activée. Lorsqu'elle est désactivée, sa configuration est conservée, mais les blocs de page, les permissions, les workflows et les API ne peuvent plus lire ses données. |

:::tip Conseil

Si KingbaseES contient beaucoup d'objets, réduisez d'abord le périmètre à l'aide de `Schema`, `Table prefix` et de « Collections ». N'intégrez que les tables et les vues utilisées par l'application actuelle afin de simplifier la configuration ultérieure des permissions, la création des pages et la maintenance de la synchronisation.

:::

## Sélectionner les tables de données

Après avoir renseigné les informations de connexion, cliquez sur « Load Collections » pour charger les tables et les vues disponibles dans KingbaseES. Les résultats dépendent du compte de connexion, de `Schema`, de `Table prefix` et de la configuration « Collections ».

Par défaut, « Add all collections » est activé, ce qui signifie que toutes les tables et les vues du périmètre actuel sont intégrées. Pour n'intégrer qu'une partie des objets, désactivez « Add all collections », puis cochez les tables ou les vues souhaitées dans la liste.

![20260709210603](https://static-docs.nocobase.com/20260709210603.png)

:::warning Attention

Une source de données externe peut intégrer au maximum 500 tables ou vues en une seule fois. Si KingbaseES contient beaucoup d'objets, il est recommandé de réduire d'abord le périmètre à l'aide de `Schema`, `Table prefix` ou de « Collections ».

:::

## Synchroniser et configurer les champs

La structure des tables de KingbaseES externe est gérée côté base de données. NocoBase ne crée pas de champs dans KingbaseES externe, ne modifie pas les types de champs et ne supprime pas les champs réels.

Lorsque la structure des tables change côté KingbaseES, vous pouvez exécuter « Sync from database » dans la source de données afin de relire les métadonnées des tables et des champs. La synchronisation met à jour dans NocoBase les informations enregistrées sur les tables de données, les champs, les clés primaires, les clés uniques et le mappage des types de champs, mais ne supprime ni les tables ni les données réelles dans KingbaseES.

Après la synchronisation des champs, vous pouvez configurer dans NocoBase le titre du champ, le type de champ (Field type) et le composant du champ (Field interface). Si vous devez créer des champs de relation NocoBase, les métadonnées de relation sont également enregistrées dans NocoBase ; aucun champ de clé étrangère réel n'est automatiquement ajouté aux tables KingbaseES.

## Mappage des types de champs

NocoBase identifie les types de champs KingbaseES selon la logique de compatibilité PostgreSQL et les mappe automatiquement vers un Field type et un Field interface appropriés. Vous pouvez ajuster le mode d'affichage dans la configuration du champ.

Les mappages courants sont les suivants :

| Type de champ KingbaseES | NocoBase Field type | Field interface disponibles |
| --- | --- | --- |
| `BOOLEAN` | `boolean` | Checkbox, Switch. |
| `SMALLINT`、`INTEGER` | `integer`、`sort` | Integer, Sort, Select, Radio group. |
| `BIGINT` | `bigInt`、`snowflakeId`、`unixTimestamp`、`sort` | Integer, Sort, Unix timestamp, Created at, Updated at. |
| `REAL`、`DOUBLE PRECISION` | `float` | Number, Percent. |
| `DECIMAL`、`NUMERIC` | `decimal` | Number, Percent, Currency. |
| `VARCHAR`、`CHAR` | `string`、`uuid`、`nanoid`、`encryption`、`datetimeNoTz` | Input, Email, Phone, Password, Color, Icon, Select, Radio group, UUID, Nano ID. |
| `TEXT` | `text` | Textarea, Markdown, Vditor, Rich text, URL. |
| `UUID` | `uuid` | UUID. |
| `JSON`、`JSONB` | `json`、`array` | JSON. |
| `TIMESTAMP WITHOUT TIME ZONE` | `datetimeNoTz` | Date, Time, Created at, Updated at. |
| `TIMESTAMP WITH TIME ZONE` | `datetimeTz`、`date` | Date, Time, Created at, Updated at. |
| `DATE` | `dateOnly` | Date. |
| `TIME WITHOUT TIME ZONE` | `time` | Time. |
| `POINT`、`PATH`、`POLYGON`、`CIRCLE` | `json` | JSON. |
| `ARRAY` | `array` | Multiple select, Checkbox group, JSON. |

:::warning Attention

Les types de champs KingbaseES non pris en charge sont affichés séparément dans la configuration des champs. Ces champs doivent faire l'objet d'une adaptation spécifique avant de pouvoir être utilisés comme des champs ordinaires dans NocoBase.

:::

## Clé primaire et identifiant unique des enregistrements

Pour les tables de données utilisées dans les blocs de page pour l'affichage et la modification, il est recommandé de disposer d'une clé primaire ou d'un champ unique. NocoBase utilise en priorité la clé primaire comme identifiant unique de l'enregistrement.

Si la source correspond à une vue, à une table sans clé primaire ou à une table avec une clé primaire composite, vous devez définir manuellement « Record unique key » dans la configuration de la table de données. En l'absence d'identifiant unique disponible, les blocs de page risquent de ne pas pouvoir afficher, modifier ou supprimer correctement les enregistrements.

![20260709210636](https://static-docs.nocobase.com/20260709210636.png)
![20260709210651](https://static-docs.nocobase.com/20260709210651.png)

## Liens associés

- [Base de données externe](./index.md) — Consulter la configuration générale et les instructions de gestion des bases de données externes
- [Gestion des sources de données](../data-source-manager/index.md) — Consulter l'accès aux sources de données et leur mode de gestion
- [Champs des tables de données](../data-modeling/collection-fields/index.md) — Consulter les types de champs et les instructions de mappage des champs