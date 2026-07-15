---
pkg: "@nocobase/plugin-data-source-manager"
title: "主数据源 - MySQL"
description: "了解 MySQL 作为 NocoBase 主数据库时的支持版本、插件安装方式、使用说明和字段映射。"
keywords: "主数据源,MySQL,主数据库,字段映射,NocoBase"
---

# MySQL

## 介绍

MySQL 可以作为 NocoBase 的主数据库使用，用于存储 NocoBase 系统表数据和主数据源中的业务数据。主数据库在部署 NocoBase 时配置，应用运行后不可删除。

| 配置项 | 说明 |
| --- | --- |
| 支持版本 | >= 8.0.17。 |
| 商业版本 | 社区版、标准版、专业版、企业版均支持。 |
| 数据库类型 | MySQL。 |

MySQL 适合作为常规业务系统的主数据库。

## 插件安装

MySQL 为内置能力，无需单独安装插件。

## 使用说明

1. 部署 NocoBase 时，在数据库连接配置中选择或填写 MySQL 对应的连接参数。
2. 启动 NocoBase 后，在「数据源管理」中进入「Main」数据源，可以管理主数据库中的数据表和字段。
3. 如需接入数据库中已经存在的表，可以在主数据库管理页使用「从数据库同步」。
4. 配置数据表字段时，可以参考[数据表](../data-modeling/collection.md)、[字段](../data-modeling/collection-fields/index.md)目录选择字段类型和字段组件。

## 字段类型映射

在主数据库中，通过 NocoBase 页面创建字段时，NocoBase 会根据字段配置创建对应的 MySQL 字段。通过「从数据库同步」接入已有表时，NocoBase 会根据 MySQL 字段类型，自动映射到合适的 Field type 和 Field interface。你可以在字段配置中调整界面展示方式。

常见映射如下：

| MySQL 字段类型 | NocoBase Field type | 可选 Field interface |
| --- | --- | --- |
| `TINYINT`、`SMALLINT`、`MEDIUMINT` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group。 |
| `INT`、`INTEGER` | `integer`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Select、Radio group。 |
| `BIGINT` | `bigInt`、`snowflakeId`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `FLOAT`、`DOUBLE` | `float` | Number、Percent。 |
| `DECIMAL` | `decimal` | Number、Percent、Currency。 |
| `CHAR`、`VARCHAR` | `string`、`uuid`、`nanoid`、`encryption` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `TINYTEXT`、`TEXT`、`MEDIUMTEXT`、`LONGTEXT` | `text` | Textarea、Markdown、Vditor、Rich text、URL。 |
| `DATE` | `dateOnly` | Date。 |
| `TIME` | `time` | Time。 |
| `DATETIME` | `datetimeNoTz`、`datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `TIMESTAMP` | `datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `YEAR` | `string`、`integer` | Input、Integer、Date。 |
| `JSON` | `json`、`array` | JSON。 |

:::warning 注意

不支持的 MySQL 字段类型会在字段配置中单独展示。这类字段需要开发适配后才能在 NocoBase 中作为普通字段使用。

:::

更多通用配置见[主数据源介绍](./index.md)。
