---
title: "Base de données externe"
description: "Base de données externe NocoBase : connectez des bases de données MySQL/PostgreSQL/MariaDB/KingbaseES/OceanBase/MSSQL/Oracle/ClickHouse/Doris existantes, lisez la structure des tables, configurez le mappage des champs et les champs de relation."
keywords: "Base de données externe,MySQL,PostgreSQL,MariaDB,KingbaseES,OceanBase,MSSQL,Oracle,ClickHouse,Doris,synchronisation des tables,mappage des champs,NocoBase"
---

# Base de données externe

## Présentation

Les bases de données externes permettent d’intégrer à NocoBase des bases de données métier existantes, de lire leurs tables, champs et vues, puis d’utiliser ces tables dans les blocs de page, les autorisations, les workflows et les API.

Contrairement à la [base de données principale](../main/index.md), la structure des tables d’une base de données externe est maintenue par le système d’origine ou le client de base de données. NocoBase se charge de lire la structure des tables et les vues, sans modifier la structure réelle de la base de données externe.

Les versions de bases de données et les éditions commerciales prises en charge sont les suivantes :

| Base de données | Versions prises en charge | Édition communautaire | Édition standard | Édition professionnelle | Édition entreprise |
| --- | --- | --- | --- | --- | --- |
| MySQL | >= 5.7 | ❌ | ✅ | ✅ | ✅ |
| PostgreSQL | >= 9.5 | ❌ | ✅ | ✅ | ✅ |
| MariaDB | >= 10.3 | ❌ | ✅ | ✅ | ✅ |
| MSSQL | 2014-2019 | ❌ | ✅ | ✅ | ✅ |
| KingbaseES | >=V9 | ❌ | ❌ | ✅ | ✅ |
| OceanBase | >=4.3 | ❌ | ❌ | ❌ | ✅ |
| Oracle | >= 11g | ❌ | ❌ | ❌ | ✅ |
| ClickHouse | Selon la documentation du plugin correspondant | ❌ | ❌ | ❌ | ✅ |
| Doris | Selon la documentation du plugin correspondant | ❌ | ❌ | ❌ | ✅ |

:::tip Conseil

KingbaseES prend uniquement en charge le mode de compatibilité PostgreSQL. OceanBase, ClickHouse et Doris prennent uniquement en charge le mode de compatibilité MySQL.

:::

Les bases de données externes sont adaptées aux scénarios suivants :

- Connecter la base de données d’un système métier existant, comme un ancien ERP, MES ou WMS, afin d’utiliser les capacités de NocoBase pour créer rapidement une interface de gestion, un contrôle des autorisations, des workflows et des rapports, sans modifier la structure des tables de la base d’origine.
- Ajouter des fonctionnalités applicatives légères à un système existant, comme l’approbation, la correction des données, le traitement des anomalies ou les tableaux de bord opérationnels, sans remplacer le système d’origine.
- Effectuer des requêtes en lecture seule, des analyses statistiques ou des présentations BI à partir d’une base de données existante, afin de réduire la dépendance aux pages du système métier d’origine.
- Migrer progressivement un ancien système : connecter d’abord l’ancienne base à NocoBase pour continuer à l’utiliser, puis stocker progressivement les nouvelles données métier dans la base de données principale.
- La structure de la base de données reste gérée par le DBA, les scripts de migration ou le système métier d’origine ; NocoBase se charge uniquement de lire la structure, de configurer l’interface et d’utiliser les données.

:::warning Attention

Une base de données externe n’est pas la base de données système de NocoBase. NocoBase ne prend pas en charge la sauvegarde, la restauration, la migration ni la structure des tables de la base de données externe ; ces opérations doivent toujours être gérées dans la base de données externe.

:::

## Installation du plugin

Les bases de données externes sont fournies par les plugins de source de données correspondants. Après avoir installé et activé le plugin, vous pouvez sélectionner le type de base de données correspondant dans le menu « Add new » de « Gestion des sources de données ».

| Base de données | Plugin correspondant | Méthode d’installation |
| --- | --- | --- |
| MySQL | `@nocobase/plugin-data-source-external-mysql` | Une licence commerciale est requise. Installez et activez le plugin avant de l’utiliser. |
| PostgreSQL | `@nocobase/plugin-data-source-external-postgres` | Une licence commerciale est requise. Installez et activez le plugin avant de l’utiliser. |
| MariaDB | `@nocobase/plugin-data-source-external-mariadb` | Une licence commerciale est requise. Installez et activez le plugin avant de l’utiliser. |
| KingbaseES | `@nocobase/plugin-data-source-kingbase` | Une licence commerciale est requise. Installez et activez le plugin avant de l’utiliser. |
| OceanBase | `@nocobase/plugin-data-source-oceanbase` | Une licence commerciale est requise. Installez et activez le plugin avant de l’utiliser. |
| MSSQL | `@nocobase/plugin-data-source-external-mssql` | Une licence commerciale est requise. Installez et activez le plugin avant de l’utiliser. |
| Oracle | `@nocobase/plugin-data-source-external-oracle` | Une licence commerciale est requise. Installez et activez le plugin avant de l’utiliser. |
| ClickHouse | `@nocobase/plugin-data-source-external-clickhouse` | Une licence commerciale est requise. Installez et activez le plugin avant de l’utiliser. |
| Doris | `@nocobase/plugin-data-source-external-doris` | Une licence commerciale est requise. Installez et activez le plugin avant de l’utiliser. |

![ajouter une base de données](https://static-docs.nocobase.com/add_new_database.png)

Si le type de base de données recherché n’apparaît pas dans le menu « Add new », vérifiez généralement les points suivants :

- Le plugin correspondant est-il installé ?
- Le plugin est-il activé ?
- La licence commerciale actuelle inclut-elle ce plugin ?
- L’utilisateur actuel dispose-t-il des autorisations de gestion des sources de données ?


## Instructions d’utilisation

### Ajouter une base de données externe

Après avoir activé le plugin, vous pouvez le sélectionner et l’ajouter dans la liste déroulante Add new de la gestion des sources de données.

![20240507204316](https://static-docs.nocobase.com/20240507204316.png)

Renseignez les informations de la base de données à connecter.

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

### Synchronisation des tables

Une fois la connexion à la base de données externe établie, toutes les tables de la source de données sont directement lues. Les bases de données externes ne permettent pas d’ajouter directement des tables ni de modifier leur structure. Si vous devez effectuer une modification, utilisez un client de base de données, puis cliquez sur le bouton « Actualiser » dans l’interface pour synchroniser les changements.

![20240507204725](https://static-docs.nocobase.com/20240507204725.png)

### Configurer les champs

Les bases de données externes lisent automatiquement les champs des tables existantes et les affichent. Vous pouvez consulter et configurer rapidement le titre, le type de données (Field type) et le type d’interface utilisateur (Field interface) des champs, ou cliquer sur le bouton « Modifier » pour modifier d’autres paramètres.

![20240507210537](https://static-docs.nocobase.com/20240507210537.png)

Comme les bases de données externes ne permettent pas de modifier la structure des tables, seuls les champs de relation peuvent être sélectionnés lors de l’ajout de champs. Les champs de relation ne sont pas de vrais champs ; ils servent à établir des liens entre les tables.

![20240507220140](https://static-docs.nocobase.com/20240507220140.png)

Pour plus d’informations, consultez le chapitre [Champs des tables / Présentation](../data-modeling/collection-fields/index.md).

### Mappage des types de champs

NocoBase mappe automatiquement les types de champs des bases de données externes vers les types de données correspondants (Field type) et les types d’interface utilisateur (Field Interface).

- Type de données (Field type) : définit la nature, le format et la structure des données pouvant être stockées dans un champ ;
- Type d’interface utilisateur (Field interface) : désigne le type de contrôle utilisé dans l’interface utilisateur pour afficher et saisir les valeurs d’un champ.

| PostgreSQL | MySQL/MariaDB | NocoBase Data Type | NocoBase Interface Type |
| - | - | - | - |
| BOOLEAN | BOOLEAN<br/>TINYINT(1) | boolean | checkbox <br/> switch |
| SMALLINT<br/>INTEGER<br/>SERIAL<br/>SMALLSERIAL | TINYINT<br/>SMALLINT<br/>MEDIUMINT<br/>INTEGER | integer<br/>boolean<br/>sort | integer<br/>sort<br/>checkbox<br/>switch<br/>select<br/>radioGroup |
| BIGINT<br/>BIGSERIAL | BIGINT | bigInt<br/>sort | integer<br/>sort<br/>checkbox<br/>switch<br/>select<br/>radioGroup<br/>unixTimestamp<br/>createdAt<br/>updatedAt |
| REAL | FLOAT | float | number<br/>percent |
| DOUBLE PRECISION | DOUBLE PRECISION | double | number<br/>percent |
| DECIMAL<br/>NUMERIC | DECIMAL | decimal | number<br/>percent<br/>currency |
| VARCHAR<br/>CHAR | VARCHAR<br/>CHAR | string<br/>password<br/>uuid<br/>nanoid | input<br/>email<br/>phone<br/>password<br/>color<br/>icon<br/>select<br/>radioGroup<br/>uuid<br/>nanoid |
| TEXT | TEXT<br/>TINYTEXT<br/>MEDIUMTEXT<br/>LONGTEXT | text<br/>json | textarea<br/>markdown<br/>vditor<br/>richText<br/>url<br/>json |
| UUID | - | uuid | uuid |
| JSON<br/>JSONB | JSON | json | json |
| TIMESTAMP | DATETIME<br/>TIMESTAMP | date | date<br/>time<br/>createdAt<br/>updatedAt |
| DATE | DATE | dateOnly | datetime |
| TIME | TIME | time | time |
| - | YEAR |  | datetime |
| CIRCEL |  | circle | json<br/>circle |
| PATH<br/>GEOMETRY(LINESTRING) | LINESTRING | lineString | Json<br/>lineString |
| POINT<br/>GEOMETRY(POINT) | POINT | point | json<br/>point |
| POLYGON<br/>GEOMETRY(POLYGON) | POLYGON | polygon | json<br/>polygon |
| GEOMETRY | GEOMETRY |  -  |  -  |
| BLOB | BLOB | blob |  -  |
| ARRAY |  -  | array | multipleSelect<br/>checkboxGroup |
| BIT | BIT | - | - |
| SET | SET | set | multipleSelect<br/>checkboxGroup |
| RANGE | - | - | - |

### Types de champs non pris en charge

Les types de champs non pris en charge sont affichés séparément. Ils ne peuvent être utilisés qu’après l’adaptation du développement.

![20240507221854](https://static-docs.nocobase.com/20240507221854.png)

### Identifiant unique de l’enregistrement

Les tables affichées dans les blocs doivent posséder une « clé unique de l’enregistrement » (Record unique key). Cette clé sert à localiser un enregistrement dans un bloc de page ; il s’agit généralement de la clé primaire ou d’un champ unique.

Pour une vue, une table sans clé primaire ou une table avec une clé primaire composite, vous devez définir manuellement le « Record unique key » dans la configuration de la table. En l’absence d’un identifiant unique utilisable, les blocs de page peuvent ne pas pouvoir être créés correctement, ni permettre l’affichage ou la modification des enregistrements. Pour plus d’informations, consultez [Table ordinaire / Modifier la configuration](../data-source-main/general-collection.md#编辑配置).

![modifier la collection](https://static-docs.nocobase.com/edit_collection.png)

![configurer la collection](https://static-docs.nocobase.com/edit_collection_configure.png)