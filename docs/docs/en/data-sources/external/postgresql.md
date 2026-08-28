---
pkg: "@nocobase/plugin-data-source-external-postgres"
title: "External data source - PostgreSQL"
description: "Connect PostgreSQL as an external NocoBase database, including version support, plugin installation, connection configuration, Schema, SSL, permissions, and field mapping."
keywords: "external data source,PostgreSQL,external database,Schema,SSL,field mapping,NocoBase"
---

# PostgreSQL

## Introduction

PostgreSQL can be connected to NocoBase as an external database. NocoBase reads PostgreSQL tables, fields, and views and uses them as collections in the external data source.

Unlike the [main database](../main/index.md), the original business system, database client, or migration scripts continue to maintain the real PostgreSQL schema. NocoBase reads structure, stores field metadata, and configures blocks, permissions, workflows, and APIs.

| Setting | Description |
| --- | --- |
| Supported version | PostgreSQL >= 9.5. |
| Commercial editions | Standard, Professional, and Enterprise. |
| Plugin | `@nocobase/plugin-data-source-external-postgres`. |

Use external PostgreSQL to connect existing ERP, MES, WMS, or CRM databases; build management pages without migrating historical data; apply permissions, workflows, corrections, or reports to existing tables; and leave schema maintenance to DBAs, migration scripts, or the original system.

:::warning Note

External PostgreSQL is not the NocoBase system database. NocoBase does not manage its backup, restore, migrations, or schema changes.

:::

## Plugin installation

This is a commercial plugin. See the [commercial plugin activation guide](https://www.nocobase.com/en/blog/nocobase-commercial-license-activation-guide) for activation.

## Add a data source

In **Data source management**, click **Add new**, select PostgreSQL, and enter the connection information.

![Add PostgreSQL](https://static-docs.nocobase.com/20260709204045.png)

| Setting | Description |
| --- | --- |
| Data source name | Internal identifier used by blocks, permissions, workflows, and APIs. It cannot be changed after creation. |
| Data source display name | Name shown in the interface, such as ERP PostgreSQL or Reporting database. |
| Host / Port | PostgreSQL server address and port. The usual default port is `5432`. |
| Database | The PostgreSQL database to connect. |
| Username / Password | Connection credentials. NocoBase reads only objects that this account is allowed to access; it does not grant access to other users' private objects. |
| Schema | The PostgreSQL schema to read, such as `public`. When several schemas exist, set only the schema required by the current business use. |
| Table prefix | Limits reading to matching tables and views, and removes the prefix from the NocoBase collection name. |
| Collections / Add all collections | Controls the imported scope. With **Add all collections** enabled, NocoBase imports all tables and views in scope; otherwise it imports only selected objects. |
| Enabled the data source | Disables or enables access through blocks, permissions, workflows, and APIs while keeping the configuration. |
| SSL options | PostgreSQL SSL settings, including SSL mode, unauthorized-certificate handling, and CA, client-certificate, and client-key paths. |

:::tip Tip

For a database with many objects, narrow the scope with `Schema`, `Table prefix`, and **Collections**. Import only tables and views that the application needs so that permission configuration, page building, and later synchronization remain manageable.

:::

## Select collections

After connection settings are entered, click **Load Collections** to read available PostgreSQL tables and views. Results depend on the connection account, `Schema`, `Table prefix`, and **Collections** settings.

**Add all collections** is enabled by default and imports every table and view in the current scope. Disable it and select individual tables or views when only part of the database is needed.

![Select PostgreSQL collections](https://static-docs.nocobase.com/20260709204309.png)

:::warning Note

One external data source can import at most 500 tables or views. Narrow the scope with `Schema`, `Table prefix`, or **Collections** when PostgreSQL has many objects.

:::

## Synchronize and configure fields

PostgreSQL maintains the external table structure. NocoBase does not create columns, change column types, or delete real fields in external PostgreSQL.

When the PostgreSQL schema changes, use **Sync from database** to reread collection and field metadata. Synchronization updates NocoBase collections, fields, primary keys, unique keys, and type mappings; it does not delete real PostgreSQL tables or data.

After synchronization, configure field titles, Field types, and Field interfaces in NocoBase. NocoBase relation fields are relation metadata only and do not automatically add real foreign-key columns to PostgreSQL.

## Field type mapping

NocoBase automatically maps PostgreSQL types to suitable Field types and Field interfaces. You can adjust the display interface in field configuration.

| PostgreSQL type | NocoBase Field type | Available Field interfaces |
| --- | --- | --- |
| `BOOLEAN` | `boolean` | Checkbox, Switch. |
| `SMALLINT`, `INTEGER`, `SERIAL`, `SMALLSERIAL` | `integer`, `boolean`, `sort` | Integer, Sort, Checkbox, Switch, Select, Radio group. |
| `BIGINT`, `BIGSERIAL` | `bigInt`, `sort` | Integer, Sort, Checkbox, Switch, Select, Radio group, Unix timestamp, Created at, Updated at. |
| `REAL` | `float` | Number, Percent. |
| `DOUBLE PRECISION` | `double` | Number, Percent. |
| `DECIMAL`, `NUMERIC` | `decimal` | Number, Percent, Currency. |
| `VARCHAR`, `CHAR` | `string`, `password`, `uuid`, `nanoid` | Input, Email, Phone, Password, Color, Icon, Select, Radio group, UUID, Nano ID. |
| `TEXT` | `text`, `json` | Textarea, Markdown, Vditor, Rich text, URL, JSON. |
| `UUID` | `uuid` | UUID. |
| `JSON`, `JSONB` | `json` | JSON. |
| `TIMESTAMP` | `date` | Date, Time, Created at, Updated at. |
| `DATE` | `dateOnly` | Date. |
| `TIME` | `time` | Time. |
| `POINT`, `LINESTRING`, `POLYGON`, `CIRCLE` | `point`, `lineString`, `polygon`, `circle` | Point, Line string, Polygon, Circle, JSON. |
| `ARRAY` | `array` | Multiple select, Checkbox group. |

:::warning Note

Unsupported PostgreSQL types are shown separately in field configuration. They require development support before they can be used as normal NocoBase fields.

:::

## Primary key and Record unique key

Collections used for block display and editing should have a primary key or unique field. NocoBase uses the primary key as the Record unique key when available.

For views, tables without a primary key, or composite-primary-key tables, configure **Record unique key** manually. Without a usable identifier, blocks might not view, edit, or delete records correctly.

![Primary key and Record unique key](https://static-docs.nocobase.com/20260709204742.png)
![Configure Record unique key](https://static-docs.nocobase.com/20260709204827.png)

## Related links

- [External databases](./index.md) - General external-database configuration and management.
- [Data source management](../data-source-manager/index.md) - Data-source entry points and management.
- [Collection fields](../data-modeling/collection-fields/index.md) - Field types and mapping.
