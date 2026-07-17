---
pkg: "@nocobase/plugin-data-source-external-postgres"
title: "Source de données externe - PostgreSQL"
description: "Découvrez comment connecter PostgreSQL à NocoBase en tant que base de données externe, notamment les versions prises en charge, l’installation du plugin, la configuration de la connexion, les schémas, SSL, les autorisations et le mappage des champs."
keywords: "source de données externe,PostgreSQL,base de données externe,Schema,SSL,mappage des champs,NocoBase"
---

# PostgreSQL

## Présentation

PostgreSQL peut être connecté à NocoBase en tant que base de données externe. Une fois la connexion établie, NocoBase lit les tables, les champs et les vues de PostgreSQL, puis les utilise comme tables de données dans la source de données externe.

Contrairement à la [base de données principale](../data-source-main/index.md), la structure réelle des tables PostgreSQL externes continue d’être gérée par le système métier d’origine, le client de base de données ou les scripts de migration. NocoBase se charge de lire la structure, d’enregistrer les métadonnées des champs et de configurer les blocs de page, les autorisations, les workflows et les API.

| Élément de configuration | Description |
| --- | --- |
| Versions prises en charge | PostgreSQL >= 9.5. |
| Versions commerciales | Prise en charge dans les éditions Standard, Professionnelle et Entreprise. |
| Plugin correspondant | `@nocobase/plugin-data-source-external-postgres`. |

Les scénarios adaptés à l’utilisation de PostgreSQL externe sont les suivants :

- Connecter les bases de données PostgreSQL de systèmes métier existants tels qu’un ERP, un MES, un WMS ou un CRM
- Créer une interface de gestion avec NocoBase sans migrer les données historiques
- Appliquer des autorisations, des traitements de workflow, des corrections de données ou des affichages de rapports aux tables existantes
- Continuer à faire gérer la structure de la base de données par les administrateurs de bases de données, les scripts de migration ou le système d’origine

:::warning Attention

PostgreSQL externe n’est pas la base de données système de NocoBase. NocoBase ne prend pas en charge ses sauvegardes, restaurations, migrations ni modifications de structure de tables.

:::

## Installation du plugin

Ce plugin est un plugin commercial. Pour plus d’informations sur son activation, consultez le [guide d’activation des plugins commerciaux](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Ajout d’une source de données

Dans « Gestion des sources de données », cliquez sur « Add new », sélectionnez PostgreSQL, puis renseignez les informations de connexion.
![20260709204045](https://static-docs.nocobase.com/20260709204045.png)

Les paramètres de connexion courants sont les suivants :

| Configuration | Description |
| --- | --- |
| Data source name | Nom d’identification de la source de données, utilisé comme référence dans les blocs de page, les autorisations, les workflows et les API. Il ne peut plus être modifié après la création. |
| Data source display name | Nom d’affichage de la source de données dans l’interface. Il est recommandé d’utiliser un nom compréhensible par les utilisateurs métier, comme « PostgreSQL ERP » ou « Base de rapports ». |
| Host / Port | Adresse de l’hôte et port PostgreSQL. Le port par défaut est généralement `5432`. |
| Database | Nom de la base de données PostgreSQL à laquelle se connecter. |
| Username / Password | Nom d’utilisateur et mot de passe utilisés pour se connecter à PostgreSQL. NocoBase peut uniquement lire les objets auxquels ce compte a accès et n’accorde pas d’autorisations ni ne lit les objets privés d’autres comptes. |
| Schema | Schéma PostgreSQL à lire, par exemple `public`. Si la base de données contient plusieurs schémas, il est recommandé de ne renseigner que celui nécessaire à l’activité concernée. |
| Table prefix | Préfixe des noms de tables. Une fois configuré, NocoBase ne lit que les tables et les vues correspondant à ce préfixe et génère dans NocoBase des noms de tables sans préfixe. |
| Collections / Add all collections | Contrôle le périmètre de connexion. Lorsque « Add all collections » est activé, NocoBase connecte toutes les tables et vues du périmètre actuel ; lorsqu’il est désactivé, seules les objets sélectionnés dans « Collections » sont connectés. |
| Enabled the data source | Indique si cette source de données est activée. Lorsqu’elle est désactivée, sa configuration est conservée, mais les blocs de page, les autorisations, les workflows et les API ne peuvent plus lire ses données. |
| SSL options | Configuration de la connexion SSL de PostgreSQL. Il est possible de définir le mode SSL, d’indiquer s’il faut refuser les certificats non autorisés, ainsi que les chemins des certificats CA, du certificat client et de la clé client. |

:::tip Conseil

Si PostgreSQL contient beaucoup d’objets, réduisez d’abord le périmètre à l’aide de `Schema`, `Table prefix` et de « Collections ». En ne connectant que les tables et les vues utilisées par l’application actuelle, vous simplifierez la configuration ultérieure des autorisations, la création des pages et la maintenance de la synchronisation.

:::

## Sélection des tables de données

Après avoir renseigné les informations de connexion, vous pouvez cliquer sur « Load Collections » pour lire les tables et les vues disponibles dans PostgreSQL. Les résultats de la lecture dépendent du compte de connexion, de `Schema`, de `Table prefix` et de la configuration « Collections ».

« Add all collections » est activé par défaut, ce qui signifie que toutes les tables et vues du périmètre actuel sont connectées. Si vous souhaitez connecter uniquement certains objets, désactivez « Add all collections », puis cochez les tables ou les vues nécessaires dans la liste.

![20260709204309](https://static-docs.nocobase.com/20260709204309.png)

:::warning Attention

Une source de données externe peut connecter au maximum 500 tables ou vues à la fois. Si PostgreSQL contient beaucoup d’objets, il est recommandé de réduire d’abord le périmètre à l’aide de `Schema`, `Table prefix` ou de « Collections ».

:::

## Synchronisation et configuration des champs

La structure des tables PostgreSQL externes est gérée côté base de données. NocoBase ne crée pas de champs dans PostgreSQL externe, ne modifie pas les types de champs et ne supprime pas les champs réels.

Lorsque la structure d’une table change côté PostgreSQL, vous pouvez exécuter « Sync from database » dans la source de données afin de relire les métadonnées des tables et des champs. La synchronisation met à jour dans NocoBase les informations enregistrées sur les tables de données, les champs, les clés primaires, les clés uniques et le mappage des types de champs, mais ne supprime ni les tables ni les données réelles dans PostgreSQL.

Après la synchronisation des champs, vous pouvez configurer dans NocoBase le libellé du champ, son type (Field type) et son composant (Field interface). Si vous devez créer des champs de relation NocoBase, les métadonnées de relation sont également enregistrées dans NocoBase ; aucun champ de clé étrangère réel n’est automatiquement ajouté à la table PostgreSQL.

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

Les types de champs PostgreSQL non pris en charge sont affichés séparément dans la configuration des champs. Ces champs doivent être adaptés par développement avant de pouvoir être utilisés comme des champs ordinaires dans NocoBase.

:::

## Clé primaire et identifiant unique des enregistrements

Pour les tables de données utilisées dans les blocs de page pour l’affichage et la modification, il est recommandé de disposer d’une clé primaire ou d’un champ unique. NocoBase utilise en priorité la clé primaire comme identifiant unique de l’enregistrement.

Si vous connectez une vue, une table sans clé primaire ou une table à clé primaire composite, vous devez définir manuellement « Record unique key » dans la configuration de la table de données. En l’absence d’un identifiant unique disponible, les blocs de page risquent de ne pas pouvoir afficher, modifier ou supprimer correctement les enregistrements.

![20260709204742](https://static-docs.nocobase.com/20260709204742.png)
![20260709204827](https://static-docs.nocobase.com/20260709204827.png)

## Liens associés

- [Base de données externe](./index.md) — Consultez les informations générales sur la configuration et la gestion des bases de données externes
- [Gestion des sources de données](../data-source-manager/index.md) — Consultez l’accès aux sources de données et leur mode de gestion
- [Champs des tables de données](../data-modeling/collection-fields/index.md) — Consultez les informations sur les types de champs et leur mappage