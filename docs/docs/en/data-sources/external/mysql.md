---
pkg: "@nocobase/plugin-data-source-external-mysql"
title: "External data source - MySQL"
description: "Connect MySQL as an external NocoBase database, including version support, plugin installation, connection configuration, table scope, permissions, and field mapping."
keywords: "external data source,MySQL,external database,field mapping,NocoBase"
---

# MySQL

## Introduction

MySQL can be connected to NocoBase as an external database. NocoBase reads MySQL tables, fields, and views and uses them as collections in the external data source.

Unlike the [main database](../main/index.md), the original business system, database client, or migration scripts maintain the real MySQL schema. NocoBase reads structure, stores field metadata, and configures blocks, permissions, workflows, and APIs.

| Setting | Description |
| --- | --- |
| Supported version | MySQL >= 5.7. |
| Commercial editions | Standard, Professional, and Enterprise. |
| Plugin | `@nocobase/plugin-data-source-external-mysql`. |
| Connection protocol | MySQL protocol. |

Use external MySQL to connect existing ERP, MES, WMS, or CRM databases, build management pages without migrating historical data, apply permissions and workflows to existing tables, and leave schema maintenance to DBAs or the original system.

:::warning Note

External MySQL is not the NocoBase system database. NocoBase does not manage its backup, restore, migrations, or schema changes.

:::

## Plugin installation

This is a commercial plugin. See the [commercial plugin activation guide](https://www.nocobase.com/en/blog/nocobase-commercial-license-activation-guide) for activation.

## Add a data source

In **Data source management**, click **Add new**, select MySQL, and enter the connection information.

![Add MySQL](https://static-docs.nocobase.com/20240507204820.png)

| Setting | Description |
| --- | --- |
| Data source name | Internal identifier used by blocks, permissions, workflows, and APIs. It cannot be changed after creation. |
| Data source display name | Name shown in the interface, such as ERP MySQL or Orders database. |
| Host / Port | MySQL server address and port. The usual default port is `3306`. |
| Database | The MySQL database to connect. |
| Username / Password | Credentials used to connect. NocoBase reads only objects that this account can access; it does not grant access to other users' private objects. |
| Table prefix | Limits reading to matching tables and views, and removes the prefix from the NocoBase collection name. |
| Collections / Add all collections | With **Add all collections** enabled, imports all tables and views in scope; otherwise imports only selected objects. |
| Enabled the data source | Disables access through blocks, permissions, workflows, and APIs while keeping the configuration. |

:::tip Tip

For a database with many objects, narrow the scope with `Database`, `Table prefix`, and **Collections**. Import only objects the application needs so that permissions, page building, and synchronization remain manageable.

:::

## Select collections

Click **Load Collections** to read available MySQL tables and views. Results depend on the connection account, `Database`, `Table prefix`, and **Collections** settings.

**Add all collections** is enabled by default. Disable it and select individual objects when only part of the database is needed.

![Select MySQL collections](https://static-docs.nocobase.com/add_new_database_configure_load_collection.png)

:::warning Note

One external data source can import at most 500 tables or views. Narrow the scope with `Database`, `Table prefix`, or **Collections** when MySQL has many objects.

:::

## Synchronize and configure fields

MySQL maintains the external table structure. NocoBase does not create columns, change column types, or delete real fields in external MySQL.

When the MySQL schema changes, use **Sync from database** to reread collection and field metadata. Synchronization updates NocoBase collections, fields, primary keys, unique keys, and type mappings; it does not delete real MySQL tables or data.

After synchronization, configure field titles, Field types, and Field interfaces in NocoBase. NocoBase relation fields are metadata only and do not automatically add real foreign-key columns to MySQL.

## Field type mapping

| MySQL type | NocoBase Field type | Available Field interfaces |
| --- | --- | --- |
| `TINYINT`, `SMALLINT`, `MEDIUMINT` | `integer`, `boolean`, `sort` | Integer, Sort, Checkbox, Switch, Select, Radio group. |
| `INT`, `INTEGER` | `integer`, `unixTimestamp`, `sort` | Integer, Sort, Unix timestamp, Select, Radio group. |
| `BIGINT` | `bigInt`, `snowflakeId`, `unixTimestamp`, `sort` | Integer, Sort, Unix timestamp, Created at, Updated at. |
| `FLOAT`, `DOUBLE` | `float` | Number, Percent. |
| `DECIMAL` | `decimal` | Number, Percent, Currency. |
| `CHAR`, `VARCHAR` | `string`, `uuid`, `nanoid`, `encryption` | Input, Email, Phone, Password, Color, Icon, Select, Radio group, UUID, Nano ID. |
| `TINYTEXT`, `TEXT`, `MEDIUMTEXT`, `LONGTEXT` | `text` | Textarea, Markdown, Vditor, Rich text, URL. |
| `DATE` | `dateOnly` | Date. |
| `TIME` | `time` | Time. |
| `DATETIME` | `datetimeNoTz`, `datetimeTz`, `date` | Date, Time, Created at, Updated at. |
| `TIMESTAMP` | `datetimeTz`, `date` | Date, Time, Created at, Updated at. |
| `YEAR` | `string`, `integer` | Input, Integer, Date. |
| `JSON` | `json`, `array` | JSON. |

:::warning Note

Unsupported MySQL types are shown separately in field configuration. They require development support before they can be used as normal NocoBase fields.

:::

## Primary key and Record unique key

Collections used for block display and editing should have a primary key or unique field. NocoBase uses the primary key as the Record unique key when available.

For views, tables without a primary key, or composite-primary-key tables, configure **Record unique key** manually. Without a usable identifier, blocks might not view, edit, or delete records correctly.

![Primary key and Record unique key](https://static-docs.nocobase.com/20260709205547.png)
![Configure Record unique key](https://static-docs.nocobase.com/20260709205609.png)

- [External databases](./index.md) - General external-database configuration and management.
- [Data source management](../data-source-manager/index.md) - Data-source entry points and management.
- [Collection fields](../data-modeling/collection-fields/index.md) - Field types and mapping.
