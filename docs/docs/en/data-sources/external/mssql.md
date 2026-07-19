---
pkg: "@nocobase/plugin-data-source-external-mssql"
title: "External data source - MSSQL"
description: "Learn how to connect MSSQL/SQL Server as an external database in NocoBase, including supported versions, plugin installation, connection settings, encrypted connections, permissions, and field mapping."
keywords: "external data source,MSSQL,SQL Server,external database,field mapping,NocoBase"
---

# MSSQL

## Introduction

MSSQL (SQL Server) can be connected to NocoBase as an external database. NocoBase reads tables, fields, and views from SQL Server and makes them available as collections in the external data source.

Unlike a [main data source](../main/index.md), the actual schema of an external MSSQL database continues to be maintained by the original business system, database client, or migration scripts. NocoBase reads the schema, stores field metadata, and lets you configure blocks, permissions, workflows, and APIs.

| Setting | Description |
| --- | --- |
| Supported version | SQL Server 2014-2019. |
| Commercial editions | Available in Standard, Professional, and Enterprise editions. |
| Plugin | `@nocobase/plugin-data-source-external-mssql`. |
| Connection features | Supports **Encrypt connection** and **Trust server certificate**. |

External MSSQL is suitable when you need to:

- Connect an SQL Server database used by an existing ERP, MES, WMS, CRM, or other business system
- Build management pages in NocoBase without migrating historical data
- Apply permissions, workflow processing, data corrections, or reporting to existing tables
- Keep the database schema maintained by DBAs, migration scripts, or the original system

:::warning Note

An external MSSQL database is not a NocoBase system database. NocoBase does not manage its backups, restores, migrations, or schema changes.

:::

## Plugin installation

This is a commercial plugin. For activation instructions, see the [Commercial plugin activation guide](https://www.nocobase.com/en/blog/nocobase-commercial-license-activation-guide).

## Add a data source

In **Data source management**, click **Add new**, select MSSQL, and then enter the connection details.

![Add an external MSSQL data source](https://static-docs.nocobase.com/20260709210022.png)

Common connection settings are as follows:

| Setting | Description |
| --- | --- |
| Data source name | The internal identifier used by blocks, permissions, workflows, and APIs. It cannot be changed after the data source is created. |
| Data source display name | The name displayed in the interface. Use a name that business users can recognize, such as `ERP SQL Server` or `Finance database`. |
| Host / Port | The SQL Server host address and port. The default port is usually `1433`. |
| Database | The name of the SQL Server database to connect to. |
| Username / Password | The account credentials used to connect to SQL Server. NocoBase can read only objects that this account is allowed to access; it does not grant access to, or read, objects private to other accounts. |
| Table prefix | A table-name prefix. When configured, NocoBase reads only tables and views that match the prefix, and removes the prefix from the generated NocoBase collection names. |
| Encrypt connection | Whether to enable an encrypted connection. Enable it when the database enforces encryption or the network connection requires encryption. |
| Trust server certificate | Whether to trust the server certificate. You might need to enable it for test environments or self-signed certificates; use a trusted certificate in production. |
| Collections / Add all collections | Controls the connection scope. With **Add all collections** enabled, NocoBase connects all tables and views in the current scope. When disabled, it connects only the objects selected in **Collections**. |
| Enabled the data source | Whether to enable the data source. When disabled, its configuration is retained, but blocks, permissions, workflows, and APIs can no longer read its data. |

:::tip Tip

When SQL Server contains many objects, narrow the scope through `Database`, `Table prefix`, and **Collections** first. Connecting only the tables and views used by the current application keeps permissions, page building, and synchronization easier to maintain.

:::

## Select collections

After entering connection details, click **Load Collections** to read available tables and views from SQL Server. The results depend on the connection account, `Database`, `Table prefix`, and **Collections** settings.

By default, **Add all collections** is enabled, which connects all tables and views in the current scope. To connect only selected objects, disable **Add all collections** and select the required tables or views from the list.

![Select external SQL Server collections](https://static-docs.nocobase.com/add_new_database_configure_load_collection.png)

:::warning Note

An external data source can connect up to 500 tables or views at a time. When SQL Server contains many objects, narrow the scope through `Database`, `Table prefix`, or **Collections** first.

:::

## Synchronize and configure fields

The external MSSQL schema is maintained in SQL Server. NocoBase does not create fields, change field types, or delete actual fields in the external database.

When the SQL Server schema changes, run **Sync from database** from the data source to read collection and field metadata again. Synchronization updates the collections, fields, primary keys, unique keys, and field-type mapping metadata stored in NocoBase. It does not delete actual SQL Server tables or data.

After fields are synchronized, you can configure their titles, Field type, and Field interface in NocoBase. NocoBase relationship fields are also stored as relationship metadata in NocoBase and do not automatically add actual foreign-key columns to SQL Server tables.

## Field type mapping

NocoBase automatically maps SQL Server types to appropriate Field types and Field interfaces. You can adjust the display interface in field settings.

| SQL Server type | NocoBase Field type | Available Field interfaces |
| --- | --- | --- |
| `BIT` | `bit` | Checkbox, Switch. |
| `TINYINT`, `SMALLINT` | `integer`, `boolean`, `sort` | Integer, Sort, Checkbox, Switch, Select, Radio group. |
| `INT` | `integer`, `unixTimestamp`, `sort` | Integer, Sort, Unix timestamp, Select, Radio group. |
| `BIGINT` | `bigInt`, `unixTimestamp`, `sort` | Integer, Sort, Unix timestamp, Created at, Updated at. |
| `DECIMAL`, `MONEY`, `SMALLMONEY` | `decimal` | Number, Percent, Currency. |
| `NUMERIC`, `FLOAT`, `REAL` | `float` | Number, Percent. |
| `CHAR`, `VARCHAR`, `NCHAR`, `NVARCHAR` | `string`, `uuid`, `nanoid` | Input, Email, Phone, Password, Color, Icon, Select, Radio group, UUID, Nano ID. |
| `TEXT`, `NTEXT` | `text` | Textarea, Markdown, Vditor, Rich text, URL. |
| `DATE` | `dateOnly` | Date. |
| `TIME` | `time` | Time. |
| `DATETIME`, `DATETIME2` | `datetimeNoTz` | Date, Time, Created at, Updated at. |
| `DATETIMEOFFSET` | `datetimeTz` | Date, Time, Created at, Updated at. |
| `UNIQUEIDENTIFIER` | `uuid`, `string` | UUID, Input. |
| `JSON` | `json`, `array` | JSON. |

:::warning Note

Unsupported SQL Server types are displayed separately in field settings. They require development support before they can be used as regular NocoBase fields.

:::

## Primary key and Record unique key

Collections used for block display and editing should have a primary key or unique field. NocoBase uses the primary key as the Record unique key when available.

For views, tables without a primary key, or composite-primary-key tables, configure **Record unique key** manually in the collection settings. Without a usable identifier, blocks might not view, edit, or delete records correctly.

![Primary key and Record unique key](https://static-docs.nocobase.com/20260709210154.png)
![Configure Record unique key](https://static-docs.nocobase.com/20260709210214.png)

## Related links

- [External databases](./index.md) - General external-database configuration and management.
- [Data source management](../data-source-manager/index.md) - Data-source entry points and management.
- [Collection fields](../data-modeling/collection-fields/index.md) - Field types and field mapping.
