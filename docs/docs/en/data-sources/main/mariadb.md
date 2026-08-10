---
pkg: "@nocobase/plugin-data-source-manager"
title: "Main data source - MariaDB"
description: "Learn the supported version, plugin installation, usage, and field mapping for MariaDB as the NocoBase main database."
keywords: "main data source,MariaDB,main database,field mapping,NocoBase"
---

# MariaDB

## Introduction

MariaDB can be used as the NocoBase main database. It stores NocoBase system-table data and business data in the main data source. Configure it when deploying NocoBase; it cannot be deleted after the application is running.

| Setting | Description |
| --- | --- |
| Supported version | >= 10.9. |
| Commercial editions | Community, Standard, Professional, and Enterprise. |
| Database type | MariaDB. |

MariaDB is similar to MySQL and is suitable as the main database for regular business systems.

## Plugin installation

MariaDB is built in and does not require a separate plugin.

## Usage

1. Select or enter MariaDB connection settings when deploying NocoBase.
2. After NocoBase starts, open **Data source management**, select **Main**, and manage collections and fields in the main database.
3. To connect tables that already exist in the database, use **Sync from database** on the main-database management page.
4. When configuring fields, use [Collections](../data-modeling/collection.md) and [Collection fields](../data-modeling/collection-fields/index.md) to choose Field types and Field interfaces.

## Field type mapping

When you create a field in NocoBase, NocoBase creates the corresponding MariaDB column. When you synchronize an existing table, NocoBase maps the MariaDB column type to a suitable Field type and Field interface. You can adjust the display interface in field configuration.

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

Unsupported MariaDB types are shown separately in field configuration. They require development support before they can be used as normal NocoBase fields.

:::

For common configuration, see [Main database](./index.md).
