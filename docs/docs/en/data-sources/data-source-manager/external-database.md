# Overview

## Introduction

Use an existing external database as a data source. Currently, the supported external databases are MySQL, MariaDB, and PostgreSQL.

## Usage Instructions

### Adding an External Database

After activating the plugin, you can select and add it from the Add new dropdown menu in the data source management.

![20240507204316](https://static-docs.nocobase.com/20240507204316.png)

Fill in the information of the database you need to connect to.

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

### Data Table Synchronization

After establishing a connection with the external database, all data tables in the data source will be directly read. The external database does not support directly adding data tables or modifying table structures. If modifications are needed, they can be made through the database client, and then the "Refresh" button can be clicked on the interface to synchronize.

![20240507204725](https://static-docs.nocobase.com/20240507204725.png)

### Configuring Fields

The external database will automatically read the fields of the existing data tables and display them. You can quickly view and configure the title of the field, the data type (Field type), and the UI type (Field interface). You can also click the "Edit" button to modify more configurations.

![20240507210537](https://static-docs.nocobase.com/20240507210537.png)

Because the external database does not support modifying table structures, the only type available when adding new fields is the relationship field. Relationship fields are not real fields, but are used to establish connections between tables.

![20240507220140](https://static-docs.nocobase.com/20240507220140.png)

For more content, refer to the [Collection Fields/Overview](/handbook/data-modeling/collection-fields) section.

### Field Type Mapping

NocoBase will automatically map the corresponding data type (Field type) and UI type (Field Interface) for the field types of the external database.

- Data type (Field type): Used to define the kind, format, and structure of data that the field can store.
- UI type (Field Interface): Refers to the type of control used to display and input field values in the user interface.

The table below shows the mapping of field types for PostgreSQL, MySQL/MariaDB to NocoBase Data Type and NocoBase Interface Type.

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
| ENUM | ENUM | enum | select<br/>radioGroup |
| ARRAY |  -  | array | multipleSelect<br/>checkboxGroup |
| BIT | BIT | - | - |
| SET | SET | set | multipleSelect<br/>checkboxGroup |
| RANGE | - | - | - |

### Unsupported Field Types

Unsupported field types will be displayed separately. These fields need to be developed for adaptation before they can be used.

![20240507221854](https://static-docs.nocobase.com/20240507221854.png)

### Filter Target Key

Data tables that are displayed as blocks must have a filter target key configured. The filter target key refers to filtering data based on a specific field, and the field value must be unique. The filter target key defaults to the primary key field of the data table. If it is a view or a data table without a primary key, or a data table with a composite primary key, you need to customize the filter target key.

![20240507210230](https://static-docs.nocobase.com/20240507210230.png)

Only data tables that have set a filter target key can be added to the page.

![20240507222827](https://static-docs.nocobase.com/20240507222827.png)