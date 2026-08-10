---
pkg: "@nocobase/plugin-data-source-kingbase"
title: "External data source - KingbaseES"
description: "Learn how to connect KingbaseES as an external database in NocoBase, including supported versions, PostgreSQL compatibility mode, connection settings, schemas, permissions, and field mapping."
keywords: "external data source,KingbaseES,external database,PostgreSQL compatibility mode,field mapping,NocoBase"
---

# KingbaseES

## Introduction

KingbaseES can be connected to NocoBase as an external database. NocoBase reads tables, fields, and views from KingbaseES and makes them available as collections in the external data source.

Unlike a [main data source](../main/index.md), the actual schema of an external KingbaseES database continues to be maintained by the original business system, database client, or migration scripts. NocoBase reads the schema, stores field metadata, and lets you configure blocks, permissions, workflows, and APIs.

| Setting | Description |
| --- | --- |
| Supported version | KingbaseES >= V9. |
| Commercial editions | Available in Professional and Enterprise editions. |
| Plugin | `@nocobase/plugin-data-source-kingbase`. |
| Database mode | Only PostgreSQL compatibility mode is supported. |

External KingbaseES is suitable when you need to:

- Connect an existing KingbaseES business database in a government, enterprise, intranet, or localized environment
- Build management pages in NocoBase without migrating historical data
- Apply permissions, workflow processing, data corrections, or reporting to existing tables
- Keep the database schema maintained by DBAs, migration scripts, or the original system

:::warning Note

KingbaseES is supported as an external database only in PostgreSQL compatibility mode. If the database does not use PostgreSQL compatibility mode, NocoBase cannot read its schema and field types through the current plugin.

:::

## Plugin installation

This is a commercial plugin. For activation instructions, see the [Commercial plugin activation guide](https://www.nocobase.com/en/blog/nocobase-commercial-license-activation-guide).

## Add a data source

In **Data source management**, click **Add new**, select KingbaseES, and then enter the connection details.

![Add an external KingbaseES data source](https://static-docs.nocobase.com/20260709210325.png)

Common connection settings are as follows:

| Setting | Description |
| --- | --- |
| Data source name | The internal identifier used by blocks, permissions, workflows, and APIs. It cannot be changed after the data source is created. |
| Data source display name | The name displayed in the interface. Use a name that business users can recognize, such as `Government KingbaseES` or `Reporting database`. |
| Host / Port | The KingbaseES host address and port. Use the port configured for the database. |
| Database | The name of the KingbaseES database to connect to. |
| Username / Password | The account credentials used to connect to KingbaseES. NocoBase can read only objects that this account is allowed to access; it does not grant access to, or read, objects private to other accounts. |
| Schema | The schema to read. If the database contains multiple schemas, specify only the schema required by the current business application. |
| Table prefix | A table-name prefix. When configured, NocoBase reads only tables and views that match the prefix, and removes the prefix from the generated NocoBase collection names. |
| Collections / Add all collections | Controls the connection scope. With **Add all collections** enabled, NocoBase connects all tables and views in the current scope. When disabled, it connects only the objects selected in **Collections**. |
| Enabled the data source | Whether to enable the data source. When disabled, its configuration is retained, but blocks, permissions, workflows, and APIs can no longer read its data. |

:::tip Tip

When KingbaseES contains many objects, narrow the scope through `Schema`, `Table prefix`, and **Collections** first. Connecting only the tables and views used by the current application keeps permissions, page building, and synchronization easier to maintain.

:::

## Select collections

After entering connection details, click **Load Collections** to read available tables and views from KingbaseES. The results depend on the connection account, `Schema`, `Table prefix`, and **Collections** settings.

By default, **Add all collections** is enabled, which connects all tables and views in the current scope. To connect only selected objects, disable **Add all collections** and select the required tables or views from the list.

![Select external KingbaseES collections](https://static-docs.nocobase.com/20260709210603.png)

:::warning Note

An external data source can connect up to 500 tables or views at a time. When KingbaseES contains many objects, narrow the scope through `Schema`, `Table prefix`, or **Collections** first.

:::

## Synchronize and configure fields

The external KingbaseES schema is maintained in the database. NocoBase does not create fields, change field types, or delete actual fields in the external database.

When the KingbaseES schema changes, run **Sync from database** from the data source to read collection and field metadata again. Synchronization updates the collections, fields, primary keys, unique keys, and field-type mapping metadata stored in NocoBase. It does not delete actual KingbaseES tables or data.

After fields are synchronized, you can configure their titles, Field type, and Field interface in NocoBase. NocoBase relationship fields are also stored as relationship metadata in NocoBase and do not automatically add actual foreign-key columns to KingbaseES tables.

## Field type mapping

NocoBase identifies KingbaseES types according to PostgreSQL compatibility rules and automatically maps them to appropriate Field types and Field interfaces. You can adjust the display interface in field settings.

| KingbaseES type | NocoBase Field type | Available Field interfaces |
| --- | --- | --- |
| `BOOLEAN` | `boolean` | Checkbox, Switch. |
| `SMALLINT`, `INTEGER` | `integer`, `sort` | Integer, Sort, Select, Radio group. |
| `BIGINT` | `bigInt`, `snowflakeId`, `unixTimestamp`, `sort` | Integer, Sort, Unix timestamp, Created at, Updated at. |
| `REAL`, `DOUBLE PRECISION` | `float` | Number, Percent. |
| `DECIMAL`, `NUMERIC` | `decimal` | Number, Percent, Currency. |
| `VARCHAR`, `CHAR` | `string`, `uuid`, `nanoid`, `encryption`, `datetimeNoTz` | Input, Email, Phone, Password, Color, Icon, Select, Radio group, UUID, Nano ID. |
| `TEXT` | `text` | Textarea, Markdown, Vditor, Rich text, URL. |
| `UUID` | `uuid` | UUID. |
| `JSON`, `JSONB` | `json`, `array` | JSON. |
| `TIMESTAMP WITHOUT TIME ZONE` | `datetimeNoTz` | Date, Time, Created at, Updated at. |
| `TIMESTAMP WITH TIME ZONE` | `datetimeTz`, `date` | Date, Time, Created at, Updated at. |
| `DATE` | `dateOnly` | Date. |
| `TIME WITHOUT TIME ZONE` | `time` | Time. |
| `POINT`, `PATH`, `POLYGON`, `CIRCLE` | `json` | JSON. |
| `ARRAY` | `array` | Multiple select, Checkbox group, JSON. |

:::warning Note

Unsupported KingbaseES types are displayed separately in field settings. They require development support before they can be used as regular NocoBase fields.

:::

## Primary key and Record unique key

Collections used for block display and editing should have a primary key or unique field. NocoBase uses the primary key as the Record unique key when available.

For views, tables without a primary key, or composite-primary-key tables, configure **Record unique key** manually in the collection settings. Without a usable identifier, blocks might not view, edit, or delete records correctly.

![Primary key and Record unique key](https://static-docs.nocobase.com/20260709210636.png)
![Configure Record unique key](https://static-docs.nocobase.com/20260709210651.png)

## Related links

- [External databases](./index.md) - General external-database configuration and management.
- [Data source management](../data-source-manager/index.md) - Data-source entry points and management.
- [Collection fields](../data-modeling/collection-fields/index.md) - Field types and field mapping.
