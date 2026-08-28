---
pkg: "@nocobase/plugin-data-source-external-postgres"
title: "Source de données externe - PostgreSQL"
description: "Découvrez comment connecter PostgreSQL à NocoBase en tant que base de données externe, notamment les versions prises en charge, l’installation du plug-in, la configuration de la connexion, les schémas, SSL, les autorisations et le mappage des champs."
keywords: "source de données externe,PostgreSQL,base de données externe,Schema,SSL,mappage des champs,NocoBase"
---

# PostgreSQL

## Introduction

PostgreSQL peut être connecté à NocoBase en tant que base de données externe. Une fois la connexion établie, NocoBase lit les tables, les champs et les vues de PostgreSQL, puis les utilise comme tables de données dans la source de données externe.

Contrairement à la [base de données principale](../main/index.md), la structure réelle des tables PostgreSQL externes continue d’être gérée par le système métier d’origine, le client de base de données ou les scripts de migration. NocoBase se charge de lire la structure, d’enregistrer les métadonnées des champs et de configurer les blocs de page, les autorisations, les flux de travail et les API.

| Élément de configuration | Description |
| --- | --- |
| Versions prises en charge | PostgreSQL >= 9.5. |
| Versions commerciales | Pris en charge par les éditions Standard, Professionnelle et Entreprise. |
| Plug-in correspondant | `@nocobase/plugin-data-source-external-postgres`. |

Les scénarios adaptés à l’utilisation d’un PostgreSQL externe sont les suivants :

- Connecter les bases de données PostgreSQL de systèmes métier existants tels qu’un ERP, un MES, un WMS ou un CRM
- Créer une interface de gestion avec NocoBase sans migrer les données historiques
- Gérer les autorisations, les processus, la correction des données ou l’affichage de rapports pour des tables existantes
- Continuer à faire gérer la structure de la base de données par le DBA, les scripts de migration ou le système d’origine

:::warning Attention

PostgreSQL externe n’est pas la base de données système de NocoBase. NocoBase ne prend pas en charge ses sauvegardes, restaurations, migrations ni modifications de structure des tables.

:::

## Installation du plug-in

Ce plug-in est un plug-in commercial. Pour plus de détails sur son activation, consultez le [guide d’activation des plug-ins commerciaux](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Ajouter une source de données

Dans « Gestion des sources de données », cliquez sur « Add new », sélectionnez PostgreSQL, puis renseignez les informations de connexion.
![20260709204045](https://static-docs.nocobase.com/20260709204045.png)

Voici les configurations de connexion courantes :

| Configuration | Description |
| --- | --- |
| Data source name | Nom d’identification de la source de données, utilisé comme référence dans les blocs de page, les autorisations, les flux de travail et les API. Il ne peut pas être modifié après la création. |
| Data source display name | Nom affiché dans l’interface pour la source de données. Il est recommandé d’utiliser un nom compréhensible par les utilisateurs métier, par exemple « PostgreSQL ERP » ou « Base de rapports ». |
| Host / Port | Adresse de l’hôte et port PostgreSQL. Le port par défaut est généralement `5432`. |
| Database | Nom de la base de données PostgreSQL à laquelle se connecter. |
| Username / Password | Nom d’utilisateur et mot de passe utilisés pour se connecter à PostgreSQL. NocoBase peut uniquement lire les objets auxquels ce compte a accès ; il n’accorde pas d’autorisations et ne lit pas les objets privés d’autres comptes. |
| Schema | Schéma PostgreSQL à lire, par exemple `public`. Si la base de données contient plusieurs schémas, il est recommandé de ne renseigner que celui nécessaire à l’activité actuelle. |
| Table prefix | Préfixe des noms de tables. Une fois configuré, NocoBase ne lit que les tables et les vues correspondant à ce préfixe, puis génère dans NocoBase des noms de tables sans préfixe. |
| Collections / Add all collections | Contrôle l’étendue de la connexion. Lorsque « Add all collections » est activé, NocoBase connecte toutes les tables et vues de la portée actuelle ; lorsqu’il est désactivé, seules les objets sélectionnés dans « Collections » sont connectés. |
| Enabled the data source | Indique si cette source de données est activée. Lorsqu’elle est désactivée, sa configuration est conservée, mais les blocs de page, les autorisations, les flux de travail et les API ne peuvent plus lire ses données. |
| SSL options | Configuration de la connexion SSL à PostgreSQL. Il est possible de définir le mode SSL, d’indiquer s’il faut refuser les certificats non autorisés, ainsi que les chemins vers le certificat CA, le certificat client et la clé client. |

:::tip Conseil

Si PostgreSQL contient beaucoup d’objets, réduisez d’abord la portée à l’aide de `Schema`, `Table prefix` et de « Collections ». Connectez uniquement les tables et les vues utilisées par l’application actuelle afin de simplifier la configuration ultérieure des autorisations, la création des pages et la maintenance de la synchronisation.

:::

## Sélectionner les tables de données

Après avoir renseigné les informations de connexion, cliquez sur « Load Collections » pour charger les tables et les vues disponibles dans PostgreSQL. Les résultats dépendent du compte de connexion, de `Schema`, de `Table prefix` et de la configuration « Collections ».

Par défaut, « Add all collections » est activé, ce qui signifie que toutes les tables et vues de la portée actuelle sont connectées. Pour ne connecter qu’une partie des objets, désactivez « Add all collections », puis cochez les tables ou les vues nécessaires dans la liste.

![20260709204309](https://static-docs.nocobase.com/20260709204309.png)

:::warning Attention

Une source de données externe peut connecter au maximum 500 tables ou vues en une seule fois. Si PostgreSQL contient beaucoup d’objets, il est recommandé de réduire d’abord la portée à l’aide de `Schema`, `Table prefix` ou de « Collections ».

:::

## Synchroniser et configurer les champs

La structure des tables PostgreSQL externes est gérée du côté de la base de données. NocoBase ne crée pas de champs dans PostgreSQL externe, ne modifie pas les types de champs et ne supprime pas les champs réels.

Lorsque la structure des tables change côté PostgreSQL, vous pouvez exécuter « Sync from database » dans la source de données afin de relire les métadonnées des tables et des champs. La synchronisation met à jour dans NocoBase les informations enregistrées sur les tables de données, les champs, les clés primaires, les clés uniques et le mappage des types de champs, mais ne supprime ni les tables ni les données réelles dans PostgreSQL.

Après la synchronisation des champs, vous pouvez configurer dans NocoBase le libellé du champ, son type (Field type) et son composant (Field interface). Si vous devez créer un champ de relation NocoBase, les métadonnées de relation sont également enregistrées dans NocoBase ; aucun véritable champ de clé étrangère n’est automatiquement ajouté à la table PostgreSQL.

## Mappage des types de champs

NocoBase mappe automatiquement les types de champs PostgreSQL vers un Field type et un Field interface appropriés. Vous pouvez ajuster le mode d’affichage dans la configuration du champ.

Les mappages courants sont les suivants :

| Type de champ PostgreSQL | NocoBase Field type | Field interface disponibles |
| --- | --- | --- |
| `BOOLEAN` | `boolean` | Checkbox, Switch. |
| `SMALLINT`、`INTEGER`、`SERIAL`、`SMALLSERIAL` | `integer`、`boolean`、`sort` | Integer, Sort, Checkbox, Switch, Select, Radio group. |
| `BIGINT`、`BIGSERIAL` | `bigInt`、`sort` | Integer, Sort, Checkbox, Switch, Select, Radio group, Unix timestamp, Created at, Updated at. |
| `REAL` | `float` | Number, Percent. |
| `DOUBLE PRECISION` | `double` | Number, Percent. |
| `DECIMAL`、`NUMERIC` | `decimal` | Number, Percent, Currency. |
| `VARCHAR`、`CHAR` | `string`、`password`、`uuid`、`nanoid` | Input, Email, Phone, Password, Color, Icon, Select, Radio group, UUID, Nano ID. |
| `TEXT` | `text`、`json` | Textarea, Markdown, Vditor, Rich text, URL, JSON. |
| `UUID` | `uuid` | UUID. |
| `JSON`、`JSONB` | `json` | JSON. |
| `TIMESTAMP` | `date` | Date, Time, Created at, Updated at. |
| `DATE` | `dateOnly` | Date. |
| `TIME` | `time` | Time. |
| `POINT`、`LINESTRING`、`POLYGON`、`CIRCLE` | `point`、`lineString`、`polygon`、`circle` | Point, Line string, Polygon, Circle, JSON. |
| `ARRAY` | `array` | Multiple select, Checkbox group. |

:::warning Attention

Les types de champs PostgreSQL non pris en charge sont affichés séparément dans la configuration des champs. Ils doivent faire l’objet d’une adaptation par développement avant de pouvoir être utilisés comme champs ordinaires dans NocoBase.

:::

## Clé primaire et identifiant unique des enregistrements

Pour les tables de données utilisées dans les blocs de page pour l’affichage et la modification, il est recommandé de disposer d’une clé primaire ou d’un champ unique. NocoBase utilise en priorité la clé primaire comme identifiant unique de l’enregistrement.

Si vous connectez une vue, une table sans clé primaire ou une table à clé primaire composite, vous devez définir manuellement « Record unique key » dans la configuration de la table de données. En l’absence d’un identifiant unique disponible, les blocs de page peuvent ne pas permettre d’afficher, de modifier ou de supprimer correctement les enregistrements.

![20260709204742](https://static-docs.nocobase.com/20260709204742.png)
![20260709204827](https://static-docs.nocobase.com/20260709204827.png)

## Liens associés

- [Base de données externe](./index.md) — Consultez la configuration générale et les instructions de gestion des bases de données externes
- [Gestion des sources de données](../data-source-manager/index.md) — Consultez l’accès aux sources de données et leur mode de gestion
- [Champs des tables de données](../data-modeling/collection-fields/index.md) — Consultez les explications sur les types de champs et leur mappage