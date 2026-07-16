---
pkg: "@nocobase/plugin-data-source-oceanbase"
title: "Main data source - OceanBase"
description: "Learn the supported version, plugin installation, usage, and field mapping for OceanBase as the NocoBase main database."
keywords: "main data source,OceanBase,main database,field mapping,NocoBase"
---

# OceanBase

## Introduction

OceanBase can be used as the NocoBase main database. It stores NocoBase system-table data and business data in the main data source. Configure it when deploying NocoBase; it cannot be deleted after the application is running.

| Setting | Description |
| --- | --- |
| Supported version | >= 4.3. |
| Commercial editions | Enterprise. |
| Database type | MySQL compatibility mode. |

:::warning Note

OceanBase is supported as the main database only in MySQL compatibility mode.

:::

## Plugin installation

OceanBase is provided by `@nocobase/plugin-data-source-oceanbase` and requires a commercial license.

## Usage

1. Select or enter OceanBase connection settings when deploying NocoBase.
2. After NocoBase starts, open **Data source management**, select **Main**, and manage collections and fields in the main database.
3. To connect tables that already exist in the database, use **Sync from database** on the main-database management page.
4. When configuring fields, use [Collections](../data-modeling/collection.md) and [Collection fields](../data-modeling/collection-fields/index.md) to choose Field types and Field interfaces.

## Field type mapping

When you create a field in NocoBase, NocoBase creates the corresponding OceanBase column. When you synchronize an existing table, NocoBase uses MySQL-compatible mapping to select a suitable Field type and Field interface. You can adjust the display interface in field configuration.

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

Unsupported OceanBase types are shown separately in field configuration. They require development support before they can be used as normal NocoBase fields.

:::

For common configuration, see [Main database](./index.md).
