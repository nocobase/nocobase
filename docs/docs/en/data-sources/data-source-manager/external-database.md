---
title: "External databases"
description: "Connect existing MySQL, PostgreSQL, MariaDB, KingbaseES, OceanBase, MSSQL, Oracle, ClickHouse, and Doris databases to NocoBase, then map their fields and relations."
keywords: "external database,MySQL,PostgreSQL,MariaDB,KingbaseES,OceanBase,MSSQL,Oracle,ClickHouse,Doris,field mapping,NocoBase"
---

# External databases

## Introduction

An **external database** connects an existing business database to NocoBase. NocoBase reads tables, fields, and views so they can be used in page blocks, permissions, workflows, and APIs.

Unlike the [main database](../data-source-main/index.md), the original system and database tools maintain the external schema. NocoBase reads the structure and views; it does not change real tables in the external database.

| Database | Supported version | Community | Standard | Professional | Enterprise |
| --- | --- | --- | --- | --- | --- |
| MySQL | >= 5.7 | No | Yes | Yes | Yes |
| PostgreSQL | >= 9.5 | No | Yes | Yes | Yes |
| MariaDB | >= 10.3 | No | Yes | Yes | Yes |
| MSSQL | 2014-2019 | No | Yes | Yes | Yes |
| KingbaseES | >= V9 | No | No | Yes | Yes |
| OceanBase | >= 4.3 | No | No | No | Yes |
| Oracle | >= 11g | No | No | No | Yes |
| ClickHouse | >= 20.2 | No | No | No | Yes |
| Doris | >= 2.1.0 | No | No | No | Yes |

:::tip Tip

KingbaseES supports only PostgreSQL compatibility mode. OceanBase, ClickHouse, and Doris support only MySQL compatibility mode.

:::

Typical use cases include:

- Connect an existing ERP, MES, WMS, or CRM database and build management pages, permissions, workflows, and reports without changing its schema.
- Add lightweight approval, data-correction, exception-handling, or operations-dashboard capabilities without replacing the original system.
- Query, analyze, or display existing data for reporting or BI.
- Migrate a historical system gradually: keep the old database connected first, then put new business data in the main database over time.
- Leave the database structure to DBAs, migration scripts, or the original system while NocoBase provides pages and data usage.

:::warning Note

An external database is not the NocoBase system database. NocoBase does not manage its backup, restore, migrations, or schema changes.

:::

## Plugin installation

Each external database is supplied by a data-source plugin. Install and enable the plugin before its database type appears in **Data source management** > **Add new**.

| Database | Plugin | Installation |
| --- | --- | --- |
| MySQL | `@nocobase/plugin-data-source-external-mysql` | Requires a commercial license; install and enable it. |
| PostgreSQL | `@nocobase/plugin-data-source-external-postgres` | Requires a commercial license; install and enable it. |
| MariaDB | `@nocobase/plugin-data-source-external-mariadb` | Requires a commercial license; install and enable it. |
| KingbaseES | `@nocobase/plugin-data-source-kingbase` | Requires a commercial license; install and enable it. |
| OceanBase | `@nocobase/plugin-data-source-oceanbase` | Requires a commercial license; install and enable it. |
| MSSQL | `@nocobase/plugin-data-source-external-mssql` | Requires a commercial license; install and enable it. |
| Oracle | `@nocobase/plugin-data-source-external-oracle` | Requires a commercial license; install and enable it. |
| ClickHouse | `@nocobase/plugin-data-source-external-clickhouse` | Requires a commercial license; install and enable it. |
| Doris | `@nocobase/plugin-data-source-external-doris` | Requires a commercial license; install and enable it. |

![Add a database](https://static-docs.nocobase.com/add_new_database.png)

If a database type is missing from **Add new**, check that its plugin is installed and enabled, the commercial license includes it, and the current user can manage data sources.

## Usage

### Add an external database

After the plugin is activated, choose the database type from **Add new** and provide its connection information.

![Add an external database](https://static-docs.nocobase.com/20240507204316.png)

![Configure an external database](https://static-docs.nocobase.com/20240507204820.png)

### Synchronize collections

After an external database is connected, NocoBase reads its collections. It cannot create collections or change the external schema. Make schema changes through database tools, then use the refresh action to synchronize metadata.

![Synchronize external collections](https://static-docs.nocobase.com/20240507204725.png)

### Configure fields

NocoBase reads and displays existing fields. You can configure their title, **Field type**, and **Field interface**, or use **Edit** for additional configuration.

![Configure external fields](https://static-docs.nocobase.com/20240507210537.png)

Because an external database schema cannot be changed from NocoBase, the only field type you can add is a relation field. A relation field is not a real database column; it connects collections in NocoBase.

![Add an external relation field](https://static-docs.nocobase.com/20240507220140.png)

See [Collection fields](../data-modeling/collection-fields/index.md) for details.

### Field type mapping

NocoBase maps external database types to a corresponding **Field type** and **Field interface**. Field type defines the kind, format, and structure of stored data; Field interface defines the control used to display and enter the value.

| PostgreSQL | MySQL / MariaDB | NocoBase Field type | NocoBase Field interface |
| --- | --- | --- | --- |
| BOOLEAN | BOOLEAN, TINYINT(1) | `boolean` | `checkbox`, `switch` |
| SMALLINT, INTEGER, SERIAL, SMALLSERIAL | TINYINT, SMALLINT, MEDIUMINT, INTEGER | `integer`, `boolean`, `sort` | `integer`, `sort`, `checkbox`, `switch`, `select`, `radioGroup` |
| BIGINT, BIGSERIAL | BIGINT | `bigInt`, `sort` | `integer`, `sort`, `checkbox`, `switch`, `select`, `radioGroup`, `unixTimestamp`, `createdAt`, `updatedAt` |
| REAL | FLOAT | `float` | `number`, `percent` |
| DOUBLE PRECISION | DOUBLE PRECISION | `double` | `number`, `percent` |
| DECIMAL, NUMERIC | DECIMAL | `decimal` | `number`, `percent`, `currency` |
| VARCHAR, CHAR | VARCHAR, CHAR | `string`, `password`, `uuid`, `nanoid` | `input`, `email`, `phone`, `password`, `color`, `icon`, `select`, `radioGroup`, `uuid`, `nanoid` |
| TEXT | TEXT, TINYTEXT, MEDIUMTEXT, LONGTEXT | `text`, `json` | `textarea`, `markdown`, `vditor`, `richText`, `url`, `json` |
| UUID | - | `uuid` | `uuid` |
| JSON, JSONB | JSON | `json` | `json` |
| TIMESTAMP | DATETIME, TIMESTAMP | `date` | `date`, `time`, `createdAt`, `updatedAt` |
| DATE | DATE | `dateOnly` | `datetime` |
| TIME | TIME | `time` | `time` |
| - | YEAR | - | `datetime` |
| CIRCLE | - | `circle` | `json`, `circle` |
| POINT, GEOMETRY(POINT) | POINT | `point` | `json`, `point` |
| PATH, GEOMETRY(LINESTRING) | LINESTRING | `lineString` | `json`, `lineString` |
| POLYGON, GEOMETRY(POLYGON) | POLYGON | `polygon` | `json`, `polygon` |
| GEOMETRY | GEOMETRY | - | - |
| BLOB | BLOB | `blob` | - |
| ARRAY | - | `array` | `multipleSelect`, `checkboxGroup` |
| BIT | BIT | - | - |
| SET | SET | `set` | `multipleSelect`, `checkboxGroup` |
| RANGE | - | - | - |

### Unsupported field types

Unsupported field types are shown separately. They require development support before they can be used.

![Unsupported field types](https://static-docs.nocobase.com/20240507221854.png)

### Record unique key

A collection shown in a block needs a **Record unique key** to locate a record, usually a primary key or unique field.

For a view, table without a primary key, or composite-primary-key table, set the Record unique key manually in the collection configuration. Without a usable unique key, blocks might not be created correctly or might not be able to view and edit records.

![Edit a collection](https://static-docs.nocobase.com/edit_collection.png)

![Configure a collection](https://static-docs.nocobase.com/edit_collection_configure.png)
