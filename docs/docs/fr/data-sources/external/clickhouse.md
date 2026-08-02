---
pkg: "@nocobase/plugin-data-source-external-clickhouse"
title: "Source de données externe - ClickHouse"
description: "Découvrez comment connecter ClickHouse à NocoBase en tant que base de données externe, notamment le port compatible MySQL, SSL, la portée des tables, les scénarios d’analyse en lecture seule et le mappage des champs."
keywords: "source de données externe,ClickHouse,base de données externe,port compatible MySQL,rapports,mappage des champs,NocoBase"
---

# ClickHouse

## Présentation

ClickHouse peut être connecté à NocoBase en tant que base de données externe. Une fois la connexion établie, NocoBase lit les tables de données, les champs et les vues de ClickHouse, puis les utilise comme tables de données dans la source de données externe.

ClickHouse est particulièrement adapté aux requêtes analytiques, à l’analyse des journaux, aux statistiques de métriques et à l’affichage de rapports. Contrairement aux bases de données transactionnelles, il n’est pas adapté à une source de données utilisée pour ajouter, modifier et supprimer fréquemment des enregistrements métier dans NocoBase.

| Élément de configuration | Description |
| --- | --- |
| Versions prises en charge | ClickHouse >= 20.2. |
| Version commerciale | Prise en charge par l’édition Enterprise. |
| Plugin correspondant | `@nocobase/plugin-data-source-external-clickhouse`. |
| Mode de connexion | Connexion via le port compatible MySQL de ClickHouse. |
| Recommandation d’utilisation | Principalement pour la consultation, le filtrage, les statistiques et l’affichage de rapports. |

Scénarios adaptés à l’utilisation de ClickHouse comme source externe :

- Connecter des données analytiques telles que les journaux, les événements de suivi, les métriques et les données de gestion des risques
- Créer dans NocoBase des tableaux de bord opérationnels, des rapports statistiques ou des pages de requête
- Fournir aux équipes métier un point d’accès en lecture seule aux requêtes, afin de réduire les accès directs aux clients de base de données
- Contrôler les autorisations et afficher sous forme visuelle des données ClickHouse existantes

:::warning Remarque

Dans NocoBase, il est recommandé d’utiliser ClickHouse comme source de données d’analyse en lecture seule. Ne l’utilisez pas comme source d’écriture pour les tables métier classiques et il n’est pas non plus recommandé de configurer dans les pages des opérations d’ajout, de modification ou de suppression.

:::

## Installation du plugin

Ce plugin est un plugin commercial. Pour connaître les modalités détaillées d’activation, consultez le [guide d’activation des plugins commerciaux](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Ajouter une source de données

Dans « Gestion des sources de données », cliquez sur « Add new », sélectionnez ClickHouse, puis renseignez les informations de connexion.
![20260709211117](https://static-docs.nocobase.com/20260709211117.png)

Voici les configurations de connexion courantes :

| Configuration | Description |
| --- | --- |
| Data source name | Nom d’identification de la source de données, utilisé pour la référencer dans les blocs de page, les autorisations, les workflows et les API. Il ne peut plus être modifié après la création. |
| Data source display name | Nom de la source de données affiché dans l’interface. Il est recommandé d’utiliser un nom compréhensible par les équipes métier, comme « Base de journaux ClickHouse » ou « Base de métriques ». |
| Host / Port | Adresse de l’hôte ClickHouse et port compatible MySQL. Ne renseignez pas le port HTTP ni le port TCP natif. |
| Database | Nom de la database ClickHouse à laquelle se connecter. |
| Username / Password | Nom d’utilisateur et mot de passe utilisés pour se connecter à ClickHouse. NocoBase peut uniquement lire les objets auxquels ce compte a accès et n’accorde pas d’autorisations ni ne lit les objets privés d’autres comptes. |
| Table prefix | Préfixe des noms de tables. Une fois configuré, NocoBase ne lit que les tables correspondant à ce préfixe et génère dans NocoBase des noms de tables sans préfixe. |
| Use SSL | Indique s’il faut activer SSL. Cette option doit généralement être activée pour ClickHouse Cloud ou dans un environnement de connexion sécurisé. |
| Enabled the data source | Indique s’il faut activer cette source de données. Lorsqu’elle est désactivée, sa configuration est conservée, mais les blocs de page, les autorisations, les workflows et les API ne peuvent plus lire ses données. |

:::tip Conseil

Le plugin ClickHouse se connecte via le protocole compatible MySQL. Avant la configuration, vérifiez que le service ClickHouse a activé le port compatible MySQL et que le réseau, le pare-feu ainsi que les autorisations du compte permettent à NocoBase d’y accéder.

:::

## Portée de la connexion

Les pages ClickHouse ne proposent pas de tableau de sélection « Collections ». La portée de la connexion est principalement contrôlée par `Database`, les autorisations du compte de connexion et `Table prefix`.

Si ClickHouse contient de nombreuses tables, il est recommandé de préparer pour NocoBase une database, un compte ou un préfixe de noms de tables dédié, afin de n’exposer que les tables nécessaires à la consultation et aux statistiques de l’application actuelle.

:::warning Remarque

Une même source de données externe peut connecter au maximum 500 tables ou vues en une seule fois. Si ClickHouse contient de nombreux objets, il est recommandé de réduire la portée au moyen d’une database, des autorisations du compte ou de `Table prefix`.

:::

## Synchronisation et configuration des champs

La structure des tables ClickHouse externes est gérée côté base de données. NocoBase ne crée pas de champs, ne modifie pas les types de champs et ne supprime pas les champs réels dans ClickHouse externe.

Lorsque la structure d’une table change côté ClickHouse, vous pouvez exécuter « Sync from database » dans la source de données afin de relire les métadonnées des tables et des champs. La synchronisation met à jour les informations enregistrées dans NocoBase concernant les tables de données, les champs, les clés primaires, les clés uniques et le mappage des types de champs, mais elle ne supprime ni les tables ni les données réelles dans ClickHouse.

Après la synchronisation des champs, vous pouvez configurer dans NocoBase le libellé du champ, son type (Field type) et son composant (Field interface). Si vous devez créer des champs de relation NocoBase, les métadonnées de relation sont également enregistrées dans NocoBase et aucun véritable champ de clé étrangère n’est automatiquement ajouté aux tables ClickHouse.

## Mappage des types de champs

NocoBase convertit les types de champs ClickHouse dans un style compatible MySQL, puis les mappe vers un Field type et un Field interface appropriés. Vous pouvez ajuster le mode d’affichage dans la configuration du champ.

Voici les mappages courants :

| Type de champ ClickHouse | NocoBase Field type | Field interface disponibles |
| --- | --- | --- |
| `Int8`、`Int16`、`Int32`、`UInt8`、`UInt16`、`UInt32` | `integer`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Select、Radio group。 |
| `Int64`、`UInt64` | `bigInt`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `Float32`、`Float64` | `float` | Number、Percent。 |
| `Decimal` | `decimal`、`double` | Number、Percent、Currency。 |
| `String`、`FixedString` | `text`、`string` | Input、Textarea、Markdown、URL。 |
| `Date`、`Date32` | `dateOnly` | Date。 |
| `DateTime`、`DateTime64` | `datetimeNoTz`、`datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `UUID` | `string`、`uuid` | Input、UUID。 |
| `Bool`、`Boolean` | `integer`、`boolean`、`sort` | Checkbox、Switch、Integer。 |
| `Array` | `json`、`array` | JSON。 |
| `Nullable(...)` | Mappé selon le type de champ interne | Dépend du type de champ interne. |
| `LowCardinality(...)` | Mappé selon le type de champ interne | Dépend du type de champ interne. |

:::warning Remarque

Certains types analytiques ou imbriqués de ClickHouse peuvent ne pas être directement mappables vers des champs métier ordinaires. Si un type de champ n’est pas pris en charge, vous pouvez d’abord créer côté ClickHouse une vue ou une table de requête adaptée à l’affichage, puis la connecter à NocoBase.

:::

## Clé primaire et identifiant unique des enregistrements

La clé de tri et la clé de partition de ClickHouse ne correspondent pas nécessairement à un identifiant métier unique. Pour les tables de données utilisées dans les blocs de page, il est tout de même recommandé de prévoir un champ permettant d’identifier chaque enregistrement de manière unique.

Si vous connectez une table ou une vue dépourvue de champ unique, vous devez définir manuellement « Record unique key » dans la configuration de la table de données. En l’absence d’un identifiant unique utilisable, les blocs de page peuvent ne pas parvenir à afficher correctement les détails des enregistrements et il n’est pas recommandé d’y configurer des opérations de modification ou de suppression.

![20260709211300](https://static-docs.nocobase.com/20260709211300.png)
![20260709211239](https://static-docs.nocobase.com/20260709211239.png)

## Liens associés

- [Base de données externe](./index.md) — Consulter la configuration générale et les instructions de gestion des bases de données externes
- [Gestion des sources de données](../data-source-manager/index.md) — Consulter l’accès aux sources de données et leur mode de gestion
- [Champs des tables de données](../data-modeling/collection-fields/index.md) — Consulter les types de champs et les instructions de mappage des champs