:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Base de données externe

## Introduction

Vous pouvez utiliser une base de données externe existante comme **source de données**. Actuellement, NocoBase prend en charge les bases de données externes suivantes : MySQL, MariaDB, PostgreSQL, MSSQL et Oracle.

## Instructions d'utilisation

### Ajout d'une base de données externe

Une fois le **plugin** activé, vous pourrez sélectionner et ajouter une base de données externe via le menu déroulant « Add new » dans la gestion des **sources de données**.

![20240507204316](https://static-docs.nocobase.com/20240507204316.png)

Renseignez les informations de la base de données à laquelle vous souhaitez vous connecter.

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

### Synchronisation des **collections**

Une fois la connexion établie avec une base de données externe, NocoBase lira directement toutes les **collections** présentes dans la **source de données**. Les bases de données externes ne permettent pas d'ajouter des **collections** ou de modifier la structure des tables directement depuis NocoBase. Si des modifications sont nécessaires, vous devrez les effectuer via un client de base de données, puis cliquer sur le bouton « Rafraîchir » dans l'interface NocoBase pour synchroniser les changements.

![20240507204725](https://static-docs.nocobase.com/20240507204725.png)

### Configuration des champs

La base de données externe lira automatiquement les champs des **collections** existantes et les affichera. Vous pouvez rapidement consulter et configurer le titre du champ, son type de données (Field type) et son type d'interface utilisateur (Field interface). Vous pouvez également cliquer sur le bouton « Modifier » pour ajuster d'autres configurations.

![20240507210537](https://static-docs.nocobase.com/20240507210537.png)

Étant donné que les bases de données externes ne permettent pas de modifier la structure des tables, le seul type de champ disponible lors de l'ajout d'un nouveau champ est le champ de relation. Les champs de relation ne sont pas des champs physiques dans la base de données, mais ils servent à établir des connexions entre les **collections**.

![20240507220140](https://static-docs.nocobase.com/20240507220140.png)

Pour plus de détails, consultez le chapitre [Champs de **collection**/Vue d'ensemble](/data-sources/data-modeling/collection-fields).

### Mappage des types de champs

NocoBase mappe automatiquement les types de champs de la base de données externe aux types de données (Field type) et aux types d'interface utilisateur (Field Interface) correspondants.

- Type de données (Field type) : Définit le type, le format et la structure des données qu'un champ peut stocker.
- Type d'interface utilisateur (Field interface) : Désigne le type de contrôle utilisé dans l'interface utilisateur pour afficher et saisir les valeurs d'un champ.

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
| CIRCLE |  | circle | json<br/>circle |
| PATH<br/>GEOMETRY(LINESTRING) | LINESTRING | lineString | Json<br/>lineString |
| POINT<br/>GEOMETRY(POINT) | POINT | point | json<br/>point |
| POLYGON<br/>GEOMETRY(POLYGON) | POLYGON | polygon | json<br/>polygon |
| GEOMETRY | GEOMETRY |  -  |  -  |
| BLOB | BLOB | blob |  -  |
| ENUM | ENUM | enum | select<br/>radioGroup |
| ARRAY |  -  | array | multipleSelect<br/>checkboxGroup |
| BIT | BIT | - | - |
| SET | SET | set | multipleSelect<br/>checkboxGroup |
| RANGE | - | - | - |

### Types de champs non pris en charge

Les types de champs non pris en charge sont affichés séparément. Ces champs nécessitent une adaptation par le développement avant de pouvoir être utilisés.

![20240507221854](https://static-docs.nocobase.com/20240507221854.png)

### Clé cible de filtre

Les **collections** affichées sous forme de blocs doivent avoir une clé cible de filtre (Filter target key) configurée. La clé cible de filtre est utilisée pour filtrer les données en fonction d'un champ spécifique, et la valeur de ce champ doit être unique. Par défaut, la clé cible de filtre est le champ de clé primaire de la **collection**. Pour les vues, les **collections** sans clé primaire ou les **collections** avec une clé primaire composite, vous devrez définir une clé cible de filtre personnalisée.

![20240507210230](https://static-docs.nocobase.com/20240507210230.png)

Seules les **collections** pour lesquelles une clé cible de filtre est configurée peuvent être ajoutées à la page.

![20240507222827](https://static-docs.nocobase.com/20240507222827.png)