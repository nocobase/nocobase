---
pkg: "@nocobase/plugin-data-source-external-clickhouse"
title: "External data source - ClickHouse"
description: "Learn how to connect ClickHouse as an external database in NocoBase, including the MySQL-compatible port, SSL, collection scope, read-only analytics use cases, and field mapping."
keywords: "external data source,ClickHouse,external database,MySQL-compatible port,reporting,field mapping,NocoBase"
---

# ClickHouse

## Introduction

ClickHouse can be connected to NocoBase as an external database. NocoBase reads tables, fields, and views from ClickHouse and makes them available as collections in the external data source.

ClickHouse is better suited to analytical queries, log analysis, metric aggregation, and reporting. Unlike transactional databases, it is not suitable as a data source for frequently creating, editing, and deleting business records in NocoBase.

| Setting | Description |
| --- | --- |
| Supported version | ClickHouse >= 20.2. |
| Commercial editions | Available in the Enterprise edition. |
| Plugin | `@nocobase/plugin-data-source-external-clickhouse`. |
| Connection method | Connect through the ClickHouse MySQL-compatible port. |
| Recommended use | Primarily for viewing, filtering, aggregation, and reporting. |

External ClickHouse is suitable when you need to:

- Connect analytical data such as logs, event tracking data, metrics, or risk-control data
- Build operational dashboards, reports, or query pages in NocoBase
- Provide business users with a read-only query entry point instead of direct database-client access
- Apply permissions and visual presentation to existing ClickHouse data

:::warning Note

Use ClickHouse in NocoBase as a read-only analytical data source. Do not use it as the write data source for regular business collections, and do not configure create, edit, or delete actions in pages.

:::

## Plugin installation

This is a commercial plugin. For activation instructions, see the [Commercial plugin activation guide](https://www.nocobase.com/en/blog/nocobase-commercial-license-activation-guide).

## Add a data source

In **Data source management**, click **Add new**, select ClickHouse, and then enter the connection details.

![Add an external ClickHouse data source](https://static-docs.nocobase.com/20260709211117.png)

Common connection settings are as follows:

| Setting | Description |
| --- | --- |
| Data source name | The internal identifier used by blocks, permissions, workflows, and APIs. It cannot be changed after the data source is created. |
| Data source display name | The name displayed in the interface. Use a name that business users can recognize, such as `ClickHouse log database` or `Metrics database`. |
| Host / Port | The ClickHouse host address and MySQL-compatible port. Do not enter the HTTP port or native TCP port. |
| Database | The name of the ClickHouse database to connect to. |
| Username / Password | The account credentials used to connect to ClickHouse. NocoBase can read only objects that this account is allowed to access; it does not grant access to, or read, objects private to other accounts. |
| Table prefix | A table-name prefix. When configured, NocoBase reads only tables that match the prefix, and removes the prefix from the generated NocoBase collection names. |
| Use SSL | Whether to enable SSL. This is usually required when connecting to ClickHouse Cloud or a secure connection environment. |
| Enabled the data source | Whether to enable the data source. When disabled, its configuration is retained, but blocks, permissions, workflows, and APIs can no longer read its data. |

:::tip Tip

The ClickHouse plugin connects through the MySQL-compatible protocol. Before configuring the source, make sure the ClickHouse service has enabled its MySQL-compatible port and that the network, firewall, and account permissions allow NocoBase to connect.

:::

## Connection scope

ClickHouse pages do not provide a **Collections** selection list. The connection scope is primarily controlled by `Database`, connection-account permissions, and `Table prefix`.

When ClickHouse contains many tables, prepare a dedicated database, account, or table-name prefix for NocoBase. Expose only the tables that the current application needs to view and aggregate.

:::warning Note

An external data source can connect up to 500 tables or views at a time. When ClickHouse contains many objects, narrow the scope through the database, account permissions, or `Table prefix` first.

:::

## Synchronize and configure fields

The external ClickHouse schema is maintained in the database. NocoBase does not create fields, change field types, or delete actual fields in the external database.

When the ClickHouse schema changes, run **Sync from database** from the data source to read collection and field metadata again. Synchronization updates the collections, fields, primary keys, unique keys, and field-type mapping metadata stored in NocoBase. It does not delete actual ClickHouse tables or data.

After fields are synchronized, you can configure their titles, Field type, and Field interface in NocoBase. NocoBase relationship fields are also stored as relationship metadata in NocoBase and do not automatically add actual foreign-key columns to ClickHouse tables.

## Field type mapping

NocoBase converts ClickHouse types into a MySQL-compatible representation before mapping them to appropriate Field types and Field interfaces. You can adjust the display interface in field settings.

| ClickHouse type | NocoBase Field type | Available Field interfaces |
| --- | --- | --- |
| `Int8`, `Int16`, `Int32`, `UInt8`, `UInt16`, `UInt32` | `integer`, `unixTimestamp`, `sort` | Integer, Sort, Unix timestamp, Select, Radio group. |
| `Int64`, `UInt64` | `bigInt`, `unixTimestamp`, `sort` | Integer, Sort, Unix timestamp, Created at, Updated at. |
| `Float32`, `Float64` | `float` | Number, Percent. |
| `Decimal` | `decimal`, `double` | Number, Percent, Currency. |
| `String`, `FixedString` | `text`, `string` | Input, Textarea, Markdown, URL. |
| `Date`, `Date32` | `dateOnly` | Date. |
| `DateTime`, `DateTime64` | `datetimeNoTz`, `datetimeTz`, `date` | Date, Time, Created at, Updated at. |
| `UUID` | `string`, `uuid` | Input, UUID. |
| `Bool`, `Boolean` | `integer`, `boolean`, `sort` | Checkbox, Switch, Integer. |
| `Array` | `json`, `array` | JSON. |
| `Nullable(...)` | Mapped according to the inner field type | Depends on the inner field type. |
| `LowCardinality(...)` | Mapped according to the inner field type | Depends on the inner field type. |

:::warning Note

Some analytical or nested ClickHouse types cannot be mapped directly to regular business fields. For unsupported types, create a view or query table suitable for display in ClickHouse first, and then connect it to NocoBase.

:::

## Primary key and Record unique key

ClickHouse sorting keys and partition keys are not necessarily business-unique identifiers. Collections used for block display should still have a field that can uniquely identify each record.

For tables or views without a unique field, configure **Record unique key** manually in the collection settings. Without a usable unique identifier, blocks might not display record details correctly and are not suitable for edit or delete actions.

![Primary key and Record unique key](https://static-docs.nocobase.com/20260709211300.png)
![Configure Record unique key](https://static-docs.nocobase.com/20260709211239.png)

## Related links

- [External databases](./index.md) - General external-database configuration and management.
- [Data source management](../data-source-manager/index.md) - Data-source entry points and management.
- [Collection fields](../data-modeling/collection-fields/index.md) - Field types and field mapping.
