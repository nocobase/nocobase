---
pkg: "@nocobase/plugin-data-source-external-doris"
title: "外部数据源 - Doris"
description: "了解如何把 Doris 作为 NocoBase 外部数据库接入，包括 MySQL 兼容端口、FE query_port、表范围、只读分析场景和字段映射。"
keywords: "外部数据源,Doris,外部数据库,MySQL 兼容端口,FE query_port,报表,字段映射,NocoBase"
---

# Doris

## 介绍

Doris 可以作为外部数据库接入 NocoBase。接入后，NocoBase 会读取 Doris 中的数据表、字段和视图，并把它们作为外部数据源中的数据表使用。

Doris 更适合分析查询、宽表明细、指标统计和报表展示。跟事务型数据库不同，它不适合作为 NocoBase 中频繁新增、编辑、删除业务记录的数据源。

| 配置项 | 说明 |
| --- | --- |
| 支持版本 | Doris >= 2.1.0。 |
| 商业版本 | 企业版支持。 |
| 对应插件 | `@nocobase/plugin-data-source-external-doris`。 |
| 连接方式 | 使用 Doris 的 MySQL 兼容端口，也就是 FE query_port。 |
| 使用建议 | 主要用于查看、筛选、统计和报表展示。 |

适合使用外部 Doris 的场景：

- 接入数仓明细表、聚合表、宽表或指标表
- 在 NocoBase 中搭建运营看板、统计报表或查询页面
- 给业务人员提供只读查询入口，减少直接访问数据库客户端
- 对已有 Doris 数据做权限控制和可视化展示

:::warning 注意

Doris 在 NocoBase 中建议按只读分析数据源使用。不要把它作为常规业务表的写入数据源，也不建议在页面中配置新增、编辑、删除类操作。

:::

## 插件安装

该插件为商业插件，详细的激活方式请参考：[商业插件激活指南](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## 添加数据源

在「数据源管理」中点击「Add new」，选择 Doris，然后填写连接信息。
![20260709211333](https://static-docs.nocobase.com/20260709211333.png)

常见连接配置如下：

| 配置 | 说明 |
| --- | --- |
| Data source name | 数据源标识名称，用于页面区块、权限、工作流和 API 中引用。创建后不能修改。 |
| Data source display name | 数据源在界面中显示的名称，建议使用业务人员能理解的名称，比如「Doris 数仓」「指标库」。 |
| Host / Port | Doris FE 地址和 MySQL 兼容端口，也就是 `query_port`。不要填写 HTTP 端口。 |
| Database | 要连接的 Doris database 名称。 |
| Username / Password | 用于连接 Doris 的账号和密码。NocoBase 只能读取这个账号有权限访问的对象，不会授权或读取其他账号私有对象。 |
| Table prefix | 表名前缀。配置后，NocoBase 只读取匹配该前缀的数据表，并在 NocoBase 中生成不带前缀的数据表名称。 |
| Enabled the data source | 是否启用这个数据源。关闭后，数据源配置会保留，但页面区块、权限、工作流和 API 无法继续读取它的数据。 |

:::tip 提示

Doris 插件通过 MySQL 兼容协议接入。配置前先确认 Doris FE 的 `query_port` 可以从 NocoBase 访问，并且账号具备读取目标 database、table 和 column 元数据的权限。

:::

## 接入范围

Doris 页面不提供「Collections」勾选表格。接入范围主要由 `Database`、连接账号权限和 `Table prefix` 控制。

如果 Doris 中表很多，建议先为 NocoBase 准备专门的 database、账号或表名前缀，只暴露当前应用需要查看和统计的表。

:::warning 注意

单个外部数据源一次最多接入 500 张数据表或视图。如果 Doris 中对象很多，建议先通过 database、账号权限或 `Table prefix` 收窄范围。

:::

## 同步和配置字段

外部 Doris 的表结构由数据库侧维护。NocoBase 不会在外部 Doris 中创建字段、修改字段类型或删除真实字段。

当 Doris 侧表结构发生变化时，可以在数据源中执行「Sync from database」，重新读取表和字段元数据。同步会更新 NocoBase 中保存的数据表、字段、主键、唯一键和字段类型映射信息，但不会删除 Doris 中的真实表或数据。

字段同步后，可以在 NocoBase 中配置字段标题、字段类型（Field type）和字段组件（Field interface）。如果需要建立 NocoBase 关系字段，也是在 NocoBase 中保存关系元数据，不会在 Doris 表里自动新增真实外键字段。

## 字段类型映射

NocoBase 会把 Doris 字段类型按 MySQL 兼容逻辑和 Doris 特有类型映射到合适的 Field type 和 Field interface。你可以在字段配置中调整界面展示方式。

常见映射如下：

| Doris 字段类型 | NocoBase Field type | 可选 Field interface |
| --- | --- | --- |
| `TINYINT`、`SMALLINT` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group。 |
| `INT`、`INTEGER` | `integer`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Select、Radio group。 |
| `BIGINT` | `bigInt`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `LARGEINT` | `bigInt` | Integer。 |
| `FLOAT` | `float`、`sort` | Number、Percent、Sort。 |
| `DOUBLE` | `double`、`sort` | Number、Percent、Sort。 |
| `DECIMAL`、`DECIMALV3` | `decimal` | Number、Percent、Currency。 |
| `BOOLEAN` | `boolean` | Checkbox、Switch。 |
| `CHAR` | `string` | Input、Email、Phone。 |
| `VARCHAR` | `string`、`uuid`、`nanoid`、`encryption` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `TEXT`、`STRING` | `text` | Textarea、Markdown、Vditor、Rich text、URL。 |
| `DATE`、`DATEV2` | `date` | Date。 |
| `DATETIME`、`DATETIMEV2` | `datetime` | Date、Time、Created at、Updated at。 |
| `JSON`、`JSONB` | `json` | JSON。 |
| `HLL`、`BITMAP`、`QUANTILE_STATE`、`AGG_STATE` | `json` | JSON。 |
| `VARIANT`、`ARRAY`、`MAP`、`STRUCT` | `json` | JSON。 |
| `IPV4`、`IPV6` | `string` | Input。 |

`VARIANT` 是 Apache Doris 2.1.0 起提供的动态类型。使用低于 2.1.0 的 Doris 时，不能接入这类字段。

:::warning 注意

Doris 中的聚合状态类型、半结构化类型和复杂类型更适合展示或调试，不一定适合作为表单录入字段。遇到复杂类型时，建议在 Doris 侧准备更适合业务查看的视图或明细表，再接入 NocoBase。

:::

## 主键和记录唯一标识

Doris 的数据模型和键模型不一定等同于业务唯一标识。用于页面区块展示的数据表，仍然建议准备一个可以唯一定位记录的字段。

如果接入的是无唯一字段的表或视图，需要在数据表配置中手动设置「Record unique key」。没有可用唯一标识时，页面区块可能无法正确查看记录详情，也不适合配置编辑或删除操作。

![20260709211439](https://static-docs.nocobase.com/20260709211439.png)
![20260709211454](https://static-docs.nocobase.com/20260709211454.png)

## 相关链接

- [外部数据库](./index.md) — 查看外部数据库的通用配置和管理说明
- [数据源管理](../data-source-manager/index.md) — 查看数据源入口和数据源管理方式
- [数据表字段](../data-modeling/collection-fields/index.md) — 查看字段类型和字段映射说明
