---
pkg: "@nocobase/plugin-data-source-manager"
title: "Main data source - PostgreSQL"
description: "Learn the supported version, plugin installation, usage, and field mapping for PostgreSQL as the NocoBase main database."
keywords: "main data source,PostgreSQL,main database,field mapping,NocoBase"
---

# PostgreSQL

## Introduction

PostgreSQL can be used as the NocoBase main database. It stores NocoBase system-table data and business data in the main data source. Configure the main database when deploying NocoBase; it cannot be deleted after the application is running.

| Setting | Description |
| --- | --- |
| Supported version | >= 10. |
| Commercial editions | Community, Standard, Professional, and Enterprise. |
| Database type | PostgreSQL. |

PostgreSQL supports inheritance collections, which are suitable for data models that need inheritance.

## Plugin installation

PostgreSQL is built in and does not require a separate plugin.

## Usage

1. Select or enter PostgreSQL connection settings when deploying NocoBase.
2. After NocoBase starts, open **Data source management**, select **Main**, and manage collections and fields in the main database.
3. To connect tables that already exist in the database, use **Sync from database** on the main-database management page.
4. When configuring fields, use [Collections](../data-modeling/collection.md) and [Collection fields](../data-modeling/collection-fields/index.md) to choose Field types and Field interfaces.

## Field type mapping

When you create a field in NocoBase, NocoBase creates the corresponding PostgreSQL column. When you synchronize an existing table, NocoBase maps the PostgreSQL column type to a suitable Field type and Field interface. You can adjust the display interface in field configuration.

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

For common configuration, see [Main database](./index.md).
