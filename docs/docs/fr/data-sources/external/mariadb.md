---
pkg: "@nocobase/plugin-data-source-external-mariadb"
title: "Source de données externe - MariaDB"
description: "Découvrez comment connecter MariaDB à NocoBase en tant que base de données externe, notamment les versions prises en charge, l’installation du plugin, la configuration de la connexion, la portée des tables, les autorisations et la correspondance des champs."
keywords: "source de données externe,MariaDB,base de données externe,correspondance des champs,NocoBase"
---

# MariaDB

## Présentation

MariaDB peut être connecté à NocoBase en tant que base de données externe. Une fois la connexion établie, NocoBase lit les tables, les champs et les vues de MariaDB, puis les utilise comme tables de données dans la source de données externe.

Contrairement à la [base de données principale](../main/index.md), la structure réelle des tables de MariaDB externe continue d’être gérée par le système métier d’origine, le client de base de données ou les scripts de migration. NocoBase se charge de lire la structure, d’enregistrer les métadonnées des champs et de configurer les blocs de page, les autorisations, les workflows et les API.

| Élément de configuration | Description |
| --- | --- |
| Versions prises en charge | MariaDB >= 10.3. |
| Éditions commerciales | Les éditions Standard, Professionnelle et Entreprise sont prises en charge. |
| Plugin correspondant | `@nocobase/plugin-data-source-external-mariadb`. |
| Protocole compatible | La connexion utilise le protocole MySQL, et la correspondance des champs suit globalement la logique de compatibilité MySQL. |

Les scénarios adaptés à l’utilisation de MariaDB externe sont les suivants :

- Connecter la base de données MariaDB de systèmes métier existants tels qu’un ERP, un MES, un WMS ou un CRM
- Créer une interface de gestion avec NocoBase sans migrer les données historiques
- Gérer les autorisations, les processus, la correction des données ou l’affichage des rapports pour des tables existantes
- Continuer à gérer la structure de la base de données avec un DBA, des scripts de migration ou le système d’origine

:::warning Attention

MariaDB externe n’est pas la base de données système de NocoBase. NocoBase ne prend pas en charge ses sauvegardes, restaurations, migrations ni modifications de structure des tables.

:::

## Installation du plugin

Ce plugin est un plugin commercial. Pour connaître les modalités d’activation, consultez le [Guide d’activation des plugins commerciaux](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Ajouter une source de données

Dans « Gestion des sources de données », cliquez sur « Add new », sélectionnez MariaDB, puis renseignez les informations de connexion.

![20260709204413](https://static-docs.nocobase.com/20260709204413.png)

Les paramètres de connexion courants sont les suivants :

| Configuration | Description |
| --- | --- |
| Data source name | Nom d’identification de la source de données, utilisé pour y faire référence dans les blocs de page, les autorisations, les workflows et les API. Il ne peut plus être modifié après la création. |
| Data source display name | Nom affiché pour la source de données dans l’interface. Il est recommandé d’utiliser un nom compréhensible par les utilisateurs métier, par exemple « MariaDB ERP » ou « Base de données des commandes ». |
| Host / Port | Adresse de l’hôte et port de MariaDB. Le port par défaut est généralement `3306`. |
| Database | Nom de la base de données MariaDB à connecter. |
| Username / Password | Nom d’utilisateur et mot de passe utilisés pour se connecter à MariaDB. NocoBase peut uniquement lire les objets auxquels ce compte a accès ; il n’accorde pas d’autorisations et ne lit pas les objets privés d’autres comptes. |
| Table prefix | Préfixe des noms de tables. Une fois configuré, NocoBase ne lit que les tables et les vues correspondant à ce préfixe et génère dans NocoBase des noms de tables sans préfixe. |
| Collections / Add all collections | Contrôle la portée de la connexion. Lorsque « Add all collections » est activé, NocoBase connecte toutes les tables et vues de la portée actuelle ; lorsqu’il est désactivé, seuls les objets sélectionnés dans « Collections » sont connectés. |
| Enabled the data source | Indique si cette source de données est activée. Lorsqu’elle est désactivée, sa configuration est conservée, mais les blocs de page, les autorisations, les workflows et les API ne peuvent plus lire ses données. |

:::tip Conseil

Si MariaDB contient beaucoup d’objets, réduisez d’abord la portée à l’aide de `Database`, `Table prefix` et de « Collections ». Connectez uniquement les tables et les vues utilisées par l’application actuelle afin de simplifier la configuration ultérieure des autorisations, la création des pages et la maintenance de la synchronisation.

:::

## Sélectionner les tables de données

Après avoir renseigné les informations de connexion, vous pouvez cliquer sur « Load Collections » pour charger les tables et les vues disponibles dans MariaDB. Les résultats dépendent du compte de connexion, de `Database`, de `Table prefix` et de la configuration « Collections ».

Par défaut, « Add all collections » est activé, ce qui signifie que toutes les tables et vues de la portée actuelle sont connectées. Si vous souhaitez connecter uniquement certains objets, désactivez « Add all collections », puis sélectionnez les tables ou les vues nécessaires dans la liste.

![20260709204452](https://static-docs.nocobase.com/20260709204452.png)

:::warning Attention

Une même source de données externe peut connecter au maximum 500 tables ou vues à la fois. Si MariaDB contient beaucoup d’objets, il est recommandé de réduire d’abord la portée à l’aide de `Database`, `Table prefix` ou de « Collections ».

:::

## Synchroniser et configurer les champs

La structure des tables de MariaDB externe est gérée côté base de données. NocoBase ne crée pas de champs, ne modifie pas leur type et ne supprime pas les champs réels dans MariaDB externe.

Lorsque la structure d’une table change côté MariaDB, vous pouvez exécuter « Sync from database » dans la source de données afin de relire les métadonnées des tables et des champs. La synchronisation met à jour les informations enregistrées dans NocoBase concernant les tables de données, les champs, les clés primaires, les clés uniques et la correspondance des types de champs, mais elle ne supprime ni les tables ni les données réelles dans MariaDB.

Après la synchronisation des champs, vous pouvez configurer dans NocoBase le titre du champ, le type de champ (Field type) et le composant du champ (Field interface). Si vous devez créer un champ de relation NocoBase, les métadonnées de la relation sont également enregistrées dans NocoBase ; aucun champ de clé étrangère réel n’est automatiquement ajouté dans la table MariaDB.

## Correspondance des types de champs

NocoBase associe automatiquement les types de champs MariaDB à un Field type et à un Field interface appropriés. La correspondance des champs courants de MariaDB est globalement identique à celle de MySQL ; vous pouvez ajuster le mode d’affichage de l’interface dans la configuration du champ.

Les correspondances courantes sont les suivantes :

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

Les types de champs MariaDB non pris en charge sont affichés séparément dans la configuration des champs. Ces champs doivent faire l’objet d’une adaptation par développement avant de pouvoir être utilisés comme des champs ordinaires dans NocoBase.

:::

## Clé primaire et identifiant unique des enregistrements

Pour les tables de données utilisées dans les blocs de page et pour l’édition, il est recommandé de disposer d’une clé primaire ou d’un champ unique. NocoBase utilise en priorité la clé primaire comme identifiant unique de l’enregistrement.

Si vous connectez une vue, une table sans clé primaire ou une table à clé primaire composite, vous devez définir manuellement « Record unique key » dans la configuration de la table de données. En l’absence d’un identifiant unique disponible, les blocs de page peuvent ne pas permettre d’afficher, de modifier ou de supprimer correctement les enregistrements.

![20260709205835](https://static-docs.nocobase.com/20260709205835.png)
![20260709205854](https://static-docs.nocobase.com/20260709205854.png)

## Liens associés

- [Base de données externe](./index.md) — Consultez les informations générales sur la configuration et la gestion des bases de données externes
- [Gestion des sources de données](../data-source-manager/index.md) — Consultez l’accès aux sources de données et les modalités de leur gestion
- [Champs des tables de données](../data-modeling/collection-fields/index.md) — Consultez les informations sur les types de champs et leur correspondance