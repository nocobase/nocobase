# External Database

## Introduction

Use an existing external database as a data source. Currently supported external databases include MySQL, MariaDB, PostgreSQL, MSSQL, and Oracle.

## Usage Instructions

### Adding an External Database

After activating the plugin, you can select and add it from the "Add new" dropdown menu in data source management.


![20240507204316](https://static-docs.nocobase.com/20240507204316.png)


Fill in the information for the database you need to connect to.


![20240507204820](https://static-docs.nocobase.com/20240507204820.png)


### Collection Synchronization

After establishing a connection with an external database, all collections within the data source will be read directly. External databases do not support adding collections or modifying the table structure directly. If modifications are needed, you can perform them through a database client and then click the "Refresh" button in the interface to synchronize.


![20240507204725](https://static-docs.nocobase.com/20240507204725.png)


### Configuring Fields

The external database will automatically read and display the fields of existing collections. You can quickly view and configure the field's title, data type (Field type), and UI type (Field interface). You can also click the "Edit" button to modify more configurations.


![20240507210537](https://static-docs.nocobase.com/20240507210537.png)


Because external databases do not support modifying the table structure, the only available type when adding a new field is the association field. Association fields are not actual fields but are used to establish connections between collections.


![20240507220140](https://static-docs.nocobase.com/20240507220140.png)


For more details, see the [Collection Fields/Overview](/data-sources/data-modeling/collection-fields) chapter.

### Field Type Mapping

NocoBase automatically maps the field types from the external database to the corresponding data type (Field type) and UI type (Field Interface).

- Data type (Field type): Defines the kind, format, and structure of data that a field can store.
- UI type (Field interface): Refers to the type of control used in the user interface to display and input field values.

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

### Unsupported Field Types

Unsupported field types are displayed separately. These fields require development adaptation before they can be used.


![20240507221854](https://static-docs.nocobase.com/20240507221854.png)


### Filter Target Key

Collections displayed as blocks must have a Filter target key configured. The filter target key is used to filter data based on a specific field, and the field value must be unique. By default, the filter target key is the collection's primary key field. For views, collections without a primary key, or collections with a composite primary key, you need to define a custom filter target key.


![20240507210230](https://static-docs.nocobase.com/20240507210230.png)


Only collections that have a filter target key configured can be added to the page.


![20240507222827](https://static-docs.nocobase.com/20240507222827.png)