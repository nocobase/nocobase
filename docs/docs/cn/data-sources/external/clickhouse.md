---
pkg: "@nocobase/plugin-data-source-external-clickhouse"
title: "外部数据源 - ClickHouse"
description: "了解如何把 ClickHouse 作为 NocoBase 外部数据库接入，包括 MySQL 兼容端口、SSL、表范围、只读分析场景和字段映射。"
keywords: "外部数据源,ClickHouse,外部数据库,MySQL 兼容端口,报表,字段映射,NocoBase"
---

# ClickHouse

## 介绍

ClickHouse 可以作为外部数据库接入 NocoBase。接入后，NocoBase 会读取 ClickHouse 中的数据表、字段和视图，并把它们作为外部数据源中的数据表使用。

ClickHouse 更适合分析查询、日志分析、指标统计和报表展示。跟事务型数据库不同，它不适合作为 NocoBase 中频繁新增、编辑、删除业务记录的数据源。

| 配置项 | 说明 |
| --- | --- |
| 支持版本 | ClickHouse >= 20.2。 |
| 商业版本 | 企业版支持。 |
| 对应插件 | `@nocobase/plugin-data-source-external-clickhouse`。 |
| 连接方式 | 使用 ClickHouse 的 MySQL 兼容端口连接。 |
| 使用建议 | 主要用于查看、筛选、统计和报表展示。 |

适合使用外部 ClickHouse 的场景：

- 接入日志、埋点、指标、风控等分析型数据
- 在 NocoBase 中搭建运营看板、统计报表或查询页面
- 给业务人员提供只读查询入口，减少直接访问数据库客户端
- 对已有 ClickHouse 数据做权限控制和可视化展示

:::warning 注意

ClickHouse 在 NocoBase 中建议按只读分析数据源使用。不要把它作为常规业务表的写入数据源，也不建议在页面中配置新增、编辑、删除类操作。

:::

## 插件安装

该插件为商业插件，详细的激活方式请参考：[商业插件激活指南](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## 添加数据源

在「数据源管理」中点击「Add new」，选择 ClickHouse，然后填写连接信息。
![20260709211117](https://static-docs.nocobase.com/20260709211117.png)

常见连接配置如下：

| 配置 | 说明 |
| --- | --- |
| Data source name | 数据源标识名称，用于页面区块、权限、工作流和 API 中引用。创建后不能修改。 |
| Data source display name | 数据源在界面中显示的名称，建议使用业务人员能理解的名称，比如「ClickHouse 日志库」「指标库」。 |
| Host / Port | ClickHouse 主机地址和 MySQL 兼容端口。不要填写 HTTP 端口或原生 TCP 端口。 |
| Database | 要连接的 ClickHouse database 名称。 |
| Username / Password | 用于连接 ClickHouse 的账号和密码。NocoBase 只能读取这个账号有权限访问的对象，不会授权或读取其他账号私有对象。 |
| Table prefix | 表名前缀。配置后，NocoBase 只读取匹配该前缀的数据表，并在 NocoBase 中生成不带前缀的数据表名称。 |
| Use SSL | 是否启用 SSL。连接 ClickHouse Cloud 或安全连接环境时通常需要启用。 |
| Enabled the data source | 是否启用这个数据源。关闭后，数据源配置会保留，但页面区块、权限、工作流和 API 无法继续读取它的数据。 |

:::tip 提示

ClickHouse 插件通过 MySQL 兼容协议接入。配置前先确认 ClickHouse 服务已经启用 MySQL 兼容端口，并且网络、防火墙和账号权限允许 NocoBase 访问。

:::

## 接入范围

ClickHouse 页面不提供「Collections」勾选表格。接入范围主要由 `Database`、连接账号权限和 `Table prefix` 控制。

如果 ClickHouse 中表很多，建议先为 NocoBase 准备专门的 database、账号或表名前缀，只暴露当前应用需要查看和统计的表。

:::warning 注意

单个外部数据源一次最多接入 500 张数据表或视图。如果 ClickHouse 中对象很多，建议先通过 database、账号权限或 `Table prefix` 收窄范围。

:::

## 同步和配置字段

外部 ClickHouse 的表结构由数据库侧维护。NocoBase 不会在外部 ClickHouse 中创建字段、修改字段类型或删除真实字段。

当 ClickHouse 侧表结构发生变化时，可以在数据源中执行「Sync from database」，重新读取表和字段元数据。同步会更新 NocoBase 中保存的数据表、字段、主键、唯一键和字段类型映射信息，但不会删除 ClickHouse 中的真实表或数据。

字段同步后，可以在 NocoBase 中配置字段标题、字段类型（Field type）和字段组件（Field interface）。如果需要建立 NocoBase 关系字段，也是在 NocoBase 中保存关系元数据，不会在 ClickHouse 表里自动新增真实外键字段。

## 字段类型映射

NocoBase 会把 ClickHouse 字段类型转换为 MySQL 兼容风格后，再映射到合适的 Field type 和 Field interface。你可以在字段配置中调整界面展示方式。

常见映射如下：

| ClickHouse 字段类型 | NocoBase Field type | 可选 Field interface |
| --- | --- | --- |
| `Int8`、`Int16`、`Int32`、`UInt8`、`UInt16`、`UInt32` | `integer`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Select、Radio group。 |
| `Int64`、`UInt64` | `bigInt`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `Float32`、`Float64` | `float` | Number、Percent。 |
| `Decimal` | `decimal`、`double` | Number、Percent、Currency。 |
| `String`、`FixedString` | `text`、`string` | Input、Textarea、Markdown、URL。 |
| `Date`、`Date32` | `dateOnly` | Date。 |
| `DateTime`、`DateTime64` | `datetimeNoTz`、`datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `UUID` | `string`、`uuid` | Input、UUID。 |
| `Bool`、`Boolean` | `integer`、`boolean`、`sort` | Checkbox、Switch、Integer。 |
| `Array` | `json`、`array` | JSON。 |
| `Nullable(...)` | 按内部字段类型映射 | 取决于内部字段类型。 |
| `LowCardinality(...)` | 按内部字段类型映射 | 取决于内部字段类型。 |

:::warning 注意

ClickHouse 中部分分析型或嵌套类型可能无法直接映射为普通业务字段。遇到不支持的字段类型时，可以先在 ClickHouse 侧创建适合展示的视图或查询表，再接入 NocoBase。

:::

## 主键和记录唯一标识

ClickHouse 的排序键、分区键不一定等同于业务唯一标识。用于页面区块展示的数据表，仍然建议准备一个可以唯一定位记录的字段。

如果接入的是无唯一字段的表或视图，需要在数据表配置中手动设置「Record unique key」。没有可用唯一标识时，页面区块可能无法正确查看记录详情，也不适合配置编辑或删除操作。

![20260709211300](https://static-docs.nocobase.com/20260709211300.png)
![20260709211239](https://static-docs.nocobase.com/20260709211239.png)

## 相关链接

- [外部数据库](./index.md) — 查看外部数据库的通用配置和管理说明
- [数据源管理](../data-source-manager/index.md) — 查看数据源入口和数据源管理方式
- [数据表字段](../data-modeling/collection-fields/index.md) — 查看字段类型和字段映射说明
