---
pkg: "@nocobase/plugin-data-source-external-doris"
title: "Source de données externe - Doris"
description: "Découvrez comment intégrer Doris à NocoBase en tant que base de données externe, notamment le port compatible MySQL, le FE query_port, le périmètre des tables, les scénarios d’analyse en lecture seule et le mappage des champs."
keywords: "source de données externe,Doris,base de données externe,port compatible MySQL,FE query_port,rapports,mappage des champs,NocoBase"
---

# Doris

## Présentation

Doris peut être intégré à NocoBase en tant que base de données externe. Après l’intégration, NocoBase lit les tables de données, les champs et les vues de Doris, puis les utilise comme tables de données dans la source de données externe.

Doris est particulièrement adapté aux requêtes analytiques, aux détails de tables larges, aux statistiques d’indicateurs et à l’affichage de rapports. Contrairement aux bases de données transactionnelles, il ne convient pas comme source de données pour ajouter, modifier ou supprimer fréquemment des enregistrements métier dans NocoBase.

| Élément de configuration | Description |
| --- | --- |
| Versions prises en charge | Doris >= 2.1.0. |
| Version commerciale | Prise en charge dans l’édition Enterprise. |
| Plugin correspondant | `@nocobase/plugin-data-source-external-doris`. |
| Mode de connexion | Utilise le port compatible MySQL de Doris, c’est-à-dire le FE query_port. |
| Recommandation d’utilisation | Principalement pour la consultation, le filtrage, les statistiques et l’affichage de rapports. |

Scénarios adaptés à l’utilisation de Doris comme source externe :

- Intégrer des tables de détails, des tables agrégées, des tables larges ou des tables d’indicateurs de l’entrepôt de données
- Créer dans NocoBase des tableaux de bord opérationnels, des rapports statistiques ou des pages de requête
- Fournir aux équipes métier un point d’accès aux requêtes en lecture seule afin de réduire les accès directs aux clients de base de données
- Contrôler les autorisations et visualiser les données Doris existantes

:::warning Attention

Dans NocoBase, il est recommandé d’utiliser Doris comme source de données d’analyse en lecture seule. Ne l’utilisez pas comme source d’écriture pour les tables métier courantes et il n’est pas recommandé de configurer dans les pages des opérations d’ajout, de modification ou de suppression.

:::

## Installation du plugin

Ce plugin est un plugin commercial. Pour plus d’informations sur son activation, consultez le [Guide d’activation des plugins commerciaux](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Ajouter une source de données

Dans « Gestion des sources de données », cliquez sur « Add new », sélectionnez Doris, puis renseignez les informations de connexion.
![20260709211333](https://static-docs.nocobase.com/20260709211333.png)

Voici les configurations de connexion courantes :

| Configuration | Description |
| --- | --- |
| Data source name | Nom d’identification de la source de données, utilisé comme référence dans les blocs de page, les autorisations, les workflows et les API. Il ne peut plus être modifié après la création. |
| Data source display name | Nom affiché de la source de données dans l’interface. Il est recommandé d’utiliser un nom compréhensible par les équipes métier, par exemple « Entrepôt de données Doris » ou « Base d’indicateurs ». |
| Host / Port | Adresse FE de Doris et port compatible MySQL, c’est-à-dire `query_port`. Ne renseignez pas le port HTTP. |
| Database | Nom de la base de données Doris à laquelle se connecter. |
| Username / Password | Nom d’utilisateur et mot de passe utilisés pour se connecter à Doris. NocoBase peut uniquement lire les objets auxquels ce compte a accès ; il n’accorde pas d’autorisations et ne lit pas les objets privés d’autres comptes. |
| Table prefix | Préfixe des noms de tables. Une fois configuré, NocoBase ne lit que les tables correspondant à ce préfixe et génère dans NocoBase des noms de tables sans préfixe. |
| Enabled the data source | Indique si cette source de données est activée. Lorsqu’elle est désactivée, sa configuration est conservée, mais les blocs de page, les autorisations, les workflows et les API ne peuvent plus lire ses données. |

:::tip Conseil

Le plugin Doris se connecte via le protocole compatible MySQL. Avant la configuration, vérifiez que le `query_port` du FE Doris est accessible depuis NocoBase et que le compte dispose des autorisations de lecture des métadonnées de la base de données, des tables et des colonnes ciblées.

:::

## Périmètre de l’intégration

Les pages Doris ne proposent pas de tableau de sélection « Collections ». Le périmètre de l’intégration est principalement contrôlé par `Database`, les autorisations du compte de connexion et `Table prefix`.

Si Doris contient un grand nombre de tables, il est recommandé de préparer pour NocoBase une base de données, un compte ou un préfixe de noms de tables dédié, afin de n’exposer que les tables nécessaires à la consultation et aux statistiques de l’application actuelle.

:::warning Attention

Une même source de données externe peut intégrer au maximum 500 tables de données ou vues à la fois. Si Doris contient beaucoup d’objets, il est recommandé de réduire d’abord le périmètre à l’aide de la base de données, des autorisations du compte ou de `Table prefix`.

:::

## Synchronisation et configuration des champs

La structure des tables Doris est gérée côté base de données. NocoBase ne crée pas de champs, ne modifie pas les types de champs et ne supprime pas les champs réels dans Doris externe.

Lorsque la structure d’une table côté Doris change, vous pouvez exécuter « Sync from database » dans la source de données afin de relire les métadonnées des tables et des champs. La synchronisation met à jour les informations enregistrées dans NocoBase concernant les tables de données, les champs, les clés primaires, les clés uniques et le mappage des types de champs, mais ne supprime ni les tables ni les données réelles dans Doris.

Après la synchronisation des champs, vous pouvez configurer dans NocoBase le titre du champ, le type de champ (Field type) et le composant du champ (Field interface). Si vous devez créer des champs de relation NocoBase, les métadonnées de relation sont également enregistrées dans NocoBase ; aucun champ de clé étrangère réel n’est automatiquement ajouté aux tables Doris.

## Mappage des types de champs

NocoBase mappe les types de champs Doris vers un Field type et un Field interface appropriés selon la logique de compatibilité MySQL et les types spécifiques à Doris. Vous pouvez ajuster le mode d’affichage dans la configuration des champs.

Les mappages courants sont les suivants :

| Type de champ Doris | NocoBase Field type | Field interface disponible |
| --- | --- | --- |
| `TINYINT`、`SMALLINT` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group。 |
| `INT`、`INTEGER` | `integer`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Select、Radio group。 |
| `BIGINT` | `bigInt`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `LARGEINT` | `bigInt` | Integer。 |
| `FLOAT` | `float`、`sort` | Number、Percent、Sort。 |
| `DOUBLE` | `double`、`sort` | Number、Percent、Sort。 |
| `DECIMAL`、`DECIMALV3` | `decimal` | Number、Percent、Currency。 |
| `BOOLEAN` | `boolean` | Checkbox、Switch。 |
| `CHAR` | `string` | Input、Email、Phone。 |
| `VARCHAR` | `string`、`uuid`、`nanoid`、`encryption` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `TEXT`、`STRING` | `text` | Textarea、Markdown、Vditor、Rich text、URL。 |
| `DATE`、`DATEV2` | `date` | Date。 |
| `DATETIME`、`DATETIMEV2` | `datetime` | Date、Time、Created at、Updated at。 |
| `JSON`、`JSONB` | `json` | JSON。 |
| `HLL`、`BITMAP`、`QUANTILE_STATE`、`AGG_STATE` | `json` | JSON。 |
| `VARIANT`、`ARRAY`、`MAP`、`STRUCT` | `json` | JSON。 |
| `IPV4`、`IPV6` | `string` | Input。 |

`VARIANT` est un type dynamique fourni par Apache Doris depuis la version 2.1.0. Lorsqu’une version de Doris antérieure à 2.1.0 est utilisée, ce type de champ ne peut pas être intégré.

:::warning Attention

Les types d’état d’agrégation, les types semi-structurés et les types complexes de Doris sont davantage adaptés à l’affichage ou au débogage et ne conviennent pas nécessairement comme champs de saisie de formulaire. Pour les types complexes, il est recommandé de préparer côté Doris des vues ou des tables de détails mieux adaptées à la consultation métier, puis de les intégrer à NocoBase.

:::

## Clé primaire et identifiant unique des enregistrements

Le modèle de données et le modèle de clés de Doris ne correspondent pas nécessairement à l’identifiant métier unique. Pour les tables de données utilisées dans les blocs de page, il est néanmoins recommandé de prévoir un champ permettant d’identifier chaque enregistrement de manière unique.

Si vous intégrez une table ou une vue dépourvue de champ unique, vous devez définir manuellement « Record unique key » dans la configuration de la table de données. En l’absence d’un identifiant unique utilisable, les blocs de page peuvent ne pas afficher correctement les détails des enregistrements et il n’est pas recommandé d’y configurer des opérations de modification ou de suppression.

![20260709211439](https://static-docs.nocobase.com/20260709211439.png)
![20260709211454](https://static-docs.nocobase.com/20260709211454.png)

## Liens associés

- [Bases de données externes](./index.md) — Consulter les informations générales sur la configuration et la gestion des bases de données externes
- [Gestion des sources de données](../data-source-manager/index.md) — Consulter le point d’entrée et les modes de gestion des sources de données
- [Champs des tables de données](../data-modeling/collection-fields/index.md) — Consulter les informations sur les types de champs et leur mappage