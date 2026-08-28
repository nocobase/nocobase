---
pkg: "@nocobase/plugin-data-source-external-mariadb"
title: "External data source - MariaDB"
description: "Learn how to connect MariaDB as an external database in NocoBase, including supported versions, plugin installation, connection settings, collection scope, permissions, and field mapping."
keywords: "external data source,MariaDB,external database,field mapping,NocoBase"
---

# MariaDB

## Introduction

MariaDB can be connected to NocoBase as an external database. NocoBase reads tables, fields, and views from MariaDB and makes them available as collections in the external data source.

Unlike a [main data source](../main/index.md), the actual schema of an external MariaDB database continues to be maintained by the original business system, database client, or migration scripts. NocoBase reads the schema, stores field metadata, and lets you configure blocks, permissions, workflows, and APIs.

| Setting | Description |
| --- | --- |
| Supported version | MariaDB >= 10.3. |
| Commercial editions | Available in Standard, Professional, and Enterprise editions. |
| Plugin | `@nocobase/plugin-data-source-external-mariadb`. |
| Compatible protocol | Connects through the MySQL protocol. Field mapping generally follows MySQL compatibility rules. |

External MariaDB is suitable when you need to:

- Connect a MariaDB database used by an existing ERP, MES, WMS, CRM, or other business system
- Build management pages in NocoBase without migrating historical data
- Apply permissions, workflow processing, data corrections, or reporting to existing tables
- Keep the database schema maintained by DBAs, migration scripts, or the original system

:::warning Note

An external MariaDB database is not a NocoBase system database. NocoBase does not manage its backups, restores, migrations, or schema changes.

:::

## Plugin installation

This is a commercial plugin. For activation instructions, see the [Commercial plugin activation guide](https://www.nocobase.com/en/blog/nocobase-commercial-license-activation-guide).

## Add a data source

In **Data source management**, click **Add new**, select MariaDB, and then enter the connection details.

![Add an external MariaDB data source](https://static-docs.nocobase.com/20260709204413.png)

Common connection settings are as follows:

| Setting | Description |
| --- | --- |
| Data source name | The internal identifier used by blocks, permissions, workflows, and APIs. It cannot be changed after the data source is created. |
| Data source display name | The name displayed in the interface. Use a name that business users can recognize, such as `ERP MariaDB` or `Order database`. |
| Host / Port | The MariaDB host address and port. The default port is usually `3306`. |
| Database | The name of the MariaDB database to connect to. |
| Username / Password | The account credentials used to connect to MariaDB. NocoBase can read only objects that this account is allowed to access; it does not grant access to, or read, objects private to other accounts. |
| Table prefix | A table-name prefix. When configured, NocoBase reads only tables and views that match the prefix, and removes the prefix from the generated NocoBase collection names. |
| Collections / Add all collections | Controls the connection scope. With **Add all collections** enabled, NocoBase connects all tables and views in the current scope. When disabled, it connects only the objects selected in **Collections**. |
| Enabled the data source | Whether to enable the data source. When disabled, its configuration is retained, but blocks, permissions, workflows, and APIs can no longer read its data. |

:::tip Tip

When MariaDB contains many objects, narrow the scope through `Database`, `Table prefix`, and **Collections** first. Connecting only the tables and views used by the current application keeps permissions, page building, and synchronization easier to maintain.

:::

## Select collections

After entering connection details, click **Load Collections** to read available tables and views from MariaDB. The results depend on the connection account, `Database`, `Table prefix`, and **Collections** settings.

By default, **Add all collections** is enabled, which connects all tables and views in the current scope. To connect only selected objects, disable **Add all collections** and select the required tables or views from the list.

![Select external MariaDB collections](https://static-docs.nocobase.com/20260709204452.png)

:::warning Note

An external data source can connect up to 500 tables or views at a time. When MariaDB contains many objects, narrow the scope through `Database`, `Table prefix`, or **Collections** first.

:::

## Synchronize and configure fields

The external MariaDB schema is maintained in MariaDB. NocoBase does not create fields, change field types, or delete actual fields in the external database.

When the MariaDB schema changes, run **Sync from database** from the data source to read collection and field metadata again. Synchronization updates the collections, fields, primary keys, unique keys, and field-type mapping metadata stored in NocoBase. It does not delete actual MariaDB tables or data.

After fields are synchronized, you can configure their titles, Field type, and Field interface in NocoBase. NocoBase relationship fields are also stored as relationship metadata in NocoBase and do not automatically add actual foreign-key columns to MariaDB tables.

## Field type mapping

NocoBase automatically maps MariaDB types to appropriate Field types and Field interfaces. Common MariaDB mappings are largely the same as MySQL mappings, and you can adjust the display interface in field settings.

| MariaDB type | NocoBase Field type | Available Field interfaces |
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

Unsupported MariaDB types are displayed separately in field settings. They require development support before they can be used as regular NocoBase fields.

:::

## Primary key and Record unique key

Collections used for block display and editing should have a primary key or unique field. NocoBase uses the primary key as the Record unique key when available.

For views, tables without a primary key, or composite-primary-key tables, configure **Record unique key** manually in the collection settings. Without a usable identifier, blocks might not view, edit, or delete records correctly.

![Primary key and Record unique key](https://static-docs.nocobase.com/20260709205835.png)
![Configure Record unique key](https://static-docs.nocobase.com/20260709205854.png)

## Related links

- [External databases](./index.md) - General external-database configuration and management.
- [Data source management](../data-source-manager/index.md) - Data-source entry points and management.
- [Collection fields](../data-modeling/collection-fields/index.md) - Field types and field mapping.
