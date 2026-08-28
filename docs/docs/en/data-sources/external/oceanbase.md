---
pkg: "@nocobase/plugin-data-source-oceanbase"
title: "External data source - OceanBase"
description: "Learn how to connect OceanBase as an external database in NocoBase, including supported versions, MySQL compatibility mode, connection settings, collection scope, permissions, and field mapping."
keywords: "external data source,OceanBase,external database,MySQL compatibility mode,field mapping,NocoBase"
---

# OceanBase

## Introduction

OceanBase can be connected to NocoBase as an external database. NocoBase reads tables, fields, and views from OceanBase and makes them available as collections in the external data source.

Unlike a [main data source](../main/index.md), the actual schema of an external OceanBase database continues to be maintained by the original business system, database client, or migration scripts. NocoBase reads the schema, stores field metadata, and lets you configure blocks, permissions, workflows, and APIs.

| Setting | Description |
| --- | --- |
| Supported version | OceanBase >= 4.3. |
| Commercial editions | Available in the Enterprise edition. |
| Plugin | `@nocobase/plugin-data-source-oceanbase`. |
| Database mode | Only MySQL compatibility mode is supported. |

External OceanBase is suitable when you need to:

- Connect a business database in an existing OceanBase MySQL tenant
- Build management pages in NocoBase without migrating historical data
- Apply permissions, workflow processing, data corrections, or reporting to existing tables
- Keep the database schema maintained by DBAs, migration scripts, or the original system

:::warning Note

OceanBase is supported as an external database only in MySQL compatibility mode. If it uses Oracle compatibility mode, NocoBase cannot read its schema and field types through the current plugin.

:::

## Plugin installation

This is a commercial plugin. For activation instructions, see the [Commercial plugin activation guide](https://www.nocobase.com/en/blog/nocobase-commercial-license-activation-guide).

## Add a data source

In **Data source management**, click **Add new**, select OceanBase, and then enter the connection details.

![Add an external OceanBase data source](https://static-docs.nocobase.com/20240507204820.png)

Common connection settings are as follows:

| Setting | Description |
| --- | --- |
| Data source name | The internal identifier used by blocks, permissions, workflows, and APIs. It cannot be changed after the data source is created. |
| Data source display name | The name displayed in the interface. Use a name that business users can recognize, such as `OceanBase business database` or `Reporting database`. |
| Host / Port | The OceanBase MySQL-compatible connection address and port. Use the port configured for the tenant or proxy. |
| Database | The name of the OceanBase database to connect to. |
| Username / Password | The account credentials used to connect to OceanBase. NocoBase can read only objects that this account is allowed to access; it does not grant access to, or read, objects private to other accounts. |
| Table prefix | A table-name prefix. When configured, NocoBase reads only tables and views that match the prefix, and removes the prefix from the generated NocoBase collection names. |
| Collections / Add all collections | Controls the connection scope. With **Add all collections** enabled, NocoBase connects all tables and views in the current scope. When disabled, it connects only the objects selected in **Collections**. |
| Enabled the data source | Whether to enable the data source. When disabled, its configuration is retained, but blocks, permissions, workflows, and APIs can no longer read its data. |

:::tip Tip

When OceanBase contains many objects, narrow the scope through `Database`, `Table prefix`, and **Collections** first. Connecting only the tables and views used by the current application keeps permissions, page building, and synchronization easier to maintain.

:::

## Select collections

After entering connection details, click **Load Collections** to read available tables and views from OceanBase. The results depend on the connection account, `Database`, `Table prefix`, and **Collections** settings.

By default, **Add all collections** is enabled, which connects all tables and views in the current scope. To connect only selected objects, disable **Add all collections** and select the required tables or views from the list.

![Select external OceanBase collections](https://static-docs.nocobase.com/add_new_database_configure_load_collection.png)

:::warning Note

An external data source can connect up to 500 tables or views at a time. When OceanBase contains many objects, narrow the scope through `Database`, `Table prefix`, or **Collections** first.

:::

## Synchronize and configure fields

The external OceanBase schema is maintained in the database. NocoBase does not create fields, change field types, or delete actual fields in the external database.

When the OceanBase schema changes, run **Sync from database** from the data source to read collection and field metadata again. Synchronization updates the collections, fields, primary keys, unique keys, and field-type mapping metadata stored in NocoBase. It does not delete actual OceanBase tables or data.

After fields are synchronized, you can configure their titles, Field type, and Field interface in NocoBase. NocoBase relationship fields are also stored as relationship metadata in NocoBase and do not automatically add actual foreign-key columns to OceanBase tables.

## Field type mapping

NocoBase identifies OceanBase types according to MySQL compatibility rules and automatically maps them to appropriate Field types and Field interfaces. You can adjust the display interface in field settings.

| OceanBase type | NocoBase Field type | Available Field interfaces |
| --- | --- | --- |
| `TINYINT`, `SMALLINT`, `MEDIUMINT` | `integer`, `boolean`, `sort` | Integer, Sort, Checkbox, Switch, Select, Radio group. |
| `INT`, `INTEGER` | `integer`, `unixTimestamp`, `sort` | Integer, Sort, Unix timestamp, Select, Radio group. |
| `BIGINT` | `bigInt`, `snowflakeId`, `unixTimestamp`, `sort` | Integer, Sort, Unix timestamp, Created at, Updated at. |
| `FLOAT`, `DOUBLE` | `float` | Number, Percent. |
| `DECIMAL` | `decimal` | Number, Percent, Currency. |
| `CHAR`, `VARCHAR` | `string`, `uuid`, `nanoid`, `encryption` | Input, Email, Phone, Password, Color, Icon, Select, Radio group, UUID, Nano ID. |
| `TEXT` | `text` | Textarea, Markdown, Vditor, Rich text, URL. |
| `DATE` | `dateOnly` | Date. |
| `TIME` | `time` | Time. |
| `DATETIME` | `datetimeNoTz`, `datetimeTz`, `date` | Date, Time, Created at, Updated at. |
| `TIMESTAMP` | `datetimeTz`, `date` | Date, Time, Created at, Updated at. |
| `JSON` | `json`, `array` | JSON. |

:::warning Note

Unsupported OceanBase types are displayed separately in field settings. They require development support before they can be used as regular NocoBase fields.

:::

## Primary key and Record unique key

Collections used for block display and editing should have a primary key or unique field. NocoBase uses the primary key as the Record unique key when available.

For views, tables without a primary key, or composite-primary-key tables, configure **Record unique key** manually in the collection settings. Without a usable identifier, blocks might not view, edit, or delete records correctly.

![Primary key and Record unique key](https://static-docs.nocobase.com/edit_collection.png)

![Configure Record unique key](https://static-docs.nocobase.com/edit_collection_configure.png)

## Related links

- [External databases](./index.md) - General external-database configuration and management.
- [Data source management](../data-source-manager/index.md) - Data-source entry points and management.
- [Collection fields](../data-modeling/collection-fields/index.md) - Field types and field mapping.
