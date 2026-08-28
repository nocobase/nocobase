---
pkg: "@nocobase/plugin-data-source-external-doris"
title: "External data source - Doris"
description: "Learn how to connect Doris as an external database in NocoBase, including the MySQL-compatible port, FE query_port, collection scope, read-only analytics use cases, and field mapping."
keywords: "external data source,Doris,external database,MySQL-compatible port,FE query_port,reporting,field mapping,NocoBase"
---

# Doris

## Introduction

Doris can be connected to NocoBase as an external database. NocoBase reads tables, fields, and views from Doris and makes them available as collections in the external data source.

Doris is better suited to analytical queries, wide-table details, metric aggregation, and reporting. Unlike transactional databases, it is not suitable as a data source for frequently creating, editing, and deleting business records in NocoBase.

| Setting | Description |
| --- | --- |
| Supported version | Doris >= 2.1.0. |
| Commercial editions | Available in the Enterprise edition. |
| Plugin | `@nocobase/plugin-data-source-external-doris`. |
| Connection method | Connect through the Doris MySQL-compatible port, the FE `query_port`. |
| Recommended use | Primarily for viewing, filtering, aggregation, and reporting. |

External Doris is suitable when you need to:

- Connect data-warehouse detail tables, aggregate tables, wide tables, or metric tables
- Build operational dashboards, reports, or query pages in NocoBase
- Provide business users with a read-only query entry point instead of direct database-client access
- Apply permissions and visual presentation to existing Doris data

:::warning Note

Use Doris in NocoBase as a read-only analytical data source. Do not use it as the write data source for regular business collections, and do not configure create, edit, or delete actions in pages.

:::

## Plugin installation

This is a commercial plugin. For activation instructions, see the [Commercial plugin activation guide](https://www.nocobase.com/en/blog/nocobase-commercial-license-activation-guide).

## Add a data source

In **Data source management**, click **Add new**, select Doris, and then enter the connection details.

![Add an external Doris data source](https://static-docs.nocobase.com/20260709211333.png)

Common connection settings are as follows:

| Setting | Description |
| --- | --- |
| Data source name | The internal identifier used by blocks, permissions, workflows, and APIs. It cannot be changed after the data source is created. |
| Data source display name | The name displayed in the interface. Use a name that business users can recognize, such as `Doris data warehouse` or `Metrics database`. |
| Host / Port | The Doris FE address and MySQL-compatible port, which is `query_port`. Do not enter the HTTP port. |
| Database | The name of the Doris database to connect to. |
| Username / Password | The account credentials used to connect to Doris. NocoBase can read only objects that this account is allowed to access; it does not grant access to, or read, objects private to other accounts. |
| Table prefix | A table-name prefix. When configured, NocoBase reads only tables that match the prefix, and removes the prefix from the generated NocoBase collection names. |
| Enabled the data source | Whether to enable the data source. When disabled, its configuration is retained, but blocks, permissions, workflows, and APIs can no longer read its data. |

:::tip Tip

The Doris plugin connects through the MySQL-compatible protocol. Before configuring the source, make sure the Doris FE `query_port` is reachable from NocoBase and that the account can read metadata for the target database, tables, and columns.

:::

## Connection scope

Doris pages do not provide a **Collections** selection list. The connection scope is primarily controlled by `Database`, connection-account permissions, and `Table prefix`.

When Doris contains many tables, prepare a dedicated database, account, or table-name prefix for NocoBase. Expose only the tables that the current application needs to view and aggregate.

:::warning Note

An external data source can connect up to 500 tables or views at a time. When Doris contains many objects, narrow the scope through the database, account permissions, or `Table prefix` first.

:::

## Synchronize and configure fields

The external Doris schema is maintained in the database. NocoBase does not create fields, change field types, or delete actual fields in the external database.

When the Doris schema changes, run **Sync from database** from the data source to read collection and field metadata again. Synchronization updates the collections, fields, primary keys, unique keys, and field-type mapping metadata stored in NocoBase. It does not delete actual Doris tables or data.

After fields are synchronized, you can configure their titles, Field type, and Field interface in NocoBase. NocoBase relationship fields are also stored as relationship metadata in NocoBase and do not automatically add actual foreign-key columns to Doris tables.

## Field type mapping

NocoBase maps Doris types to appropriate Field types and Field interfaces according to MySQL compatibility rules and Doris-specific types. You can adjust the display interface in field settings.

| Doris type | NocoBase Field type | Available Field interfaces |
| --- | --- | --- |
| `TINYINT`, `SMALLINT` | `integer`, `boolean`, `sort` | Integer, Sort, Checkbox, Switch, Select, Radio group. |
| `INT`, `INTEGER` | `integer`, `unixTimestamp`, `sort` | Integer, Sort, Unix timestamp, Select, Radio group. |
| `BIGINT` | `bigInt`, `unixTimestamp`, `sort` | Integer, Sort, Unix timestamp, Created at, Updated at. |
| `LARGEINT` | `bigInt` | Integer. |
| `FLOAT` | `float`, `sort` | Number, Percent, Sort. |
| `DOUBLE` | `double`, `sort` | Number, Percent, Sort. |
| `DECIMAL`, `DECIMALV3` | `decimal` | Number, Percent, Currency. |
| `BOOLEAN` | `boolean` | Checkbox, Switch. |
| `CHAR` | `string` | Input, Email, Phone. |
| `VARCHAR` | `string`, `uuid`, `nanoid`, `encryption` | Input, Email, Phone, Password, Color, Icon, Select, Radio group, UUID, Nano ID. |
| `TEXT`, `STRING` | `text` | Textarea, Markdown, Vditor, Rich text, URL. |
| `DATE`, `DATEV2` | `date` | Date. |
| `DATETIME`, `DATETIMEV2` | `datetime` | Date, Time, Created at, Updated at. |
| `JSON`, `JSONB` | `json` | JSON. |
| `HLL`, `BITMAP`, `QUANTILE_STATE`, `AGG_STATE` | `json` | JSON. |
| `VARIANT`, `ARRAY`, `MAP`, `STRUCT` | `json` | JSON. |
| `IPV4`, `IPV6` | `string` | Input. |

`VARIANT` is a dynamic type available in Apache Doris 2.1.0 and later. When using a Doris version earlier than 2.1.0, you cannot connect fields of this type.

:::warning Note

Aggregate-state, semi-structured, and complex types in Doris are better suited to display or debugging and might not be appropriate for form input. For complex types, prepare a view or detail table better suited to business viewing in Doris before connecting it to NocoBase.

:::

## Primary key and Record unique key

Doris data and key models are not necessarily business-unique identifiers. Collections used for block display should still have a field that can uniquely identify each record.

For tables or views without a unique field, configure **Record unique key** manually in the collection settings. Without a usable unique identifier, blocks might not display record details correctly and are not suitable for edit or delete actions.

![Primary key and Record unique key](https://static-docs.nocobase.com/20260709211439.png)
![Configure Record unique key](https://static-docs.nocobase.com/20260709211454.png)

## Related links

- [External databases](./index.md) - General external-database configuration and management.
- [Data source management](../data-source-manager/index.md) - Data-source entry points and management.
- [Collection fields](../data-modeling/collection-fields/index.md) - Field types and field mapping.
