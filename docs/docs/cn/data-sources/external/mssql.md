---
pkg: "@nocobase/plugin-data-source-external-mssql"
title: "外部数据源 - MSSQL"
description: "了解如何把 MSSQL/SQL Server 作为 NocoBase 外部数据库接入，包括支持版本、插件安装、连接配置、加密连接、权限和字段映射。"
keywords: "外部数据源,MSSQL,SQL Server,外部数据库,字段映射,NocoBase"
---

# MSSQL

## 介绍

MSSQL（SQL Server）可以作为外部数据库接入 NocoBase。接入后，NocoBase 会读取 SQL Server 中的数据表、字段和视图，并把它们作为外部数据源中的数据表使用。

跟[主数据库](../main/index.md)不同，外部 MSSQL 的真实表结构仍由原业务系统、数据库客户端或迁移脚本维护。NocoBase 负责读取结构、保存字段元数据、配置页面区块、权限、工作流和 API。

| 配置项 | 说明 |
| --- | --- |
| 支持版本 | SQL Server 2014-2019。 |
| 商业版本 | 标准版、专业版、企业版支持。 |
| 对应插件 | `@nocobase/plugin-data-source-external-mssql`。 |
| 连接特性 | 支持配置「Encrypt connection」和「Trust server certificate」。 |

适合使用外部 MSSQL 的场景：

- 接入已有 ERP、MES、WMS、CRM 等业务系统的 SQL Server 数据库
- 在不迁移历史数据的情况下，用 NocoBase 搭建管理界面
- 对已有表做权限控制、流程处理、数据修正或报表展示
- 数据库结构继续由 DBA、迁移脚本或原系统维护

:::warning 注意

外部 MSSQL 不是 NocoBase 的系统数据库。NocoBase 不会接管它的备份、还原、迁移和表结构变更。

:::

## 插件安装

该插件为商业插件，详细的激活方式请参考：[商业插件激活指南](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## 添加数据源

在「数据源管理」中点击「Add new」，选择 MSSQL，然后填写连接信息。

![20260709210022](https://static-docs.nocobase.com/20260709210022.png)

常见连接配置如下：

| 配置 | 说明 |
| --- | --- |
| Data source name | 数据源标识名称，用于页面区块、权限、工作流和 API 中引用。创建后不能修改。 |
| Data source display name | 数据源在界面中显示的名称，建议使用业务人员能理解的名称，比如「ERP SQL Server」「财务库」。 |
| Host / Port | SQL Server 主机地址和端口。默认端口通常是 `1433`。 |
| Database | 要连接的 SQL Server 数据库名称。 |
| Username / Password | 用于连接 SQL Server 的账号和密码。NocoBase 只能读取这个账号有权限访问的对象，不会授权或读取其他账号私有对象。 |
| Table prefix | 表名前缀。配置后，NocoBase 只读取匹配该前缀的数据表和视图，并在 NocoBase 中生成不带前缀的数据表名称。 |
| Encrypt connection | 是否启用加密连接。数据库强制加密或网络链路需要加密时启用。 |
| Trust server certificate | 是否信任服务端证书。测试环境或自签名证书环境可能需要启用；生产环境建议使用可信证书。 |
| Collections / Add all collections | 控制接入范围。启用「Add all collections」时，NocoBase 会接入当前范围内的全部表和视图；关闭后，只接入你在「Collections」里勾选的对象。 |
| Enabled the data source | 是否启用这个数据源。关闭后，数据源配置会保留，但页面区块、权限、工作流和 API 无法继续读取它的数据。 |

:::tip 提示

如果 SQL Server 中对象很多，优先通过 `Database`、`Table prefix` 和「Collections」收窄范围。只接入当前应用会用到的表和视图，后续权限配置、页面搭建和同步维护都会更轻。

:::

## 选择数据表

填写连接信息后，可以点击「Load Collections」读取 SQL Server 中可用的数据表和视图。读取结果会受到连接账号、`Database`、`Table prefix` 和「Collections」配置影响。

默认会启用「Add all collections」，表示接入当前范围内的全部表和视图。如果只想接入部分对象，可以关闭「Add all collections」，然后在列表中勾选需要的数据表或视图。

![add_new_database_configure_load_collection](https://static-docs.nocobase.com/add_new_database_configure_load_collection.png)

:::warning 注意

单个外部数据源一次最多接入 500 张数据表或视图。如果 SQL Server 中对象很多，建议先通过 `Database`、`Table prefix` 或「Collections」收窄范围。

:::

## 同步和配置字段

外部 MSSQL 的表结构由数据库侧维护。NocoBase 不会在外部 SQL Server 中创建字段、修改字段类型或删除真实字段。

当 SQL Server 侧表结构发生变化时，可以在数据源中执行「Sync from database」，重新读取表和字段元数据。同步会更新 NocoBase 中保存的数据表、字段、主键、唯一键和字段类型映射信息，但不会删除 SQL Server 中的真实表或数据。

字段同步后，可以在 NocoBase 中配置字段标题、字段类型（Field type）和字段组件（Field interface）。如果需要建立 NocoBase 关系字段，也是在 NocoBase 中保存关系元数据，不会在 SQL Server 表里自动新增真实外键字段。

## 字段类型映射

NocoBase 会根据 SQL Server 字段类型，自动映射到合适的 Field type 和 Field interface。你可以在字段配置中调整界面展示方式。

常见映射如下：

| SQL Server 字段类型 | NocoBase Field type | 可选 Field interface |
| --- | --- | --- |
| `BIT` | `bit` | Checkbox、Switch。 |
| `TINYINT`、`SMALLINT` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group。 |
| `INT` | `integer`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Select、Radio group。 |
| `BIGINT` | `bigInt`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `DECIMAL`、`MONEY`、`SMALLMONEY` | `decimal` | Number、Percent、Currency。 |
| `NUMERIC`、`FLOAT`、`REAL` | `float` | Number、Percent。 |
| `CHAR`、`VARCHAR`、`NCHAR`、`NVARCHAR` | `string`、`uuid`、`nanoid` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `TEXT`、`NTEXT` | `text` | Textarea、Markdown、Vditor、Rich text、URL。 |
| `DATE` | `dateOnly` | Date。 |
| `TIME` | `time` | Time。 |
| `DATETIME`、`DATETIME2` | `datetimeNoTz` | Date、Time、Created at、Updated at。 |
| `DATETIMEOFFSET` | `datetimeTz` | Date、Time、Created at、Updated at。 |
| `UNIQUEIDENTIFIER` | `uuid`、`string` | UUID、Input。 |
| `JSON` | `json`、`array` | JSON。 |

:::warning 注意

不支持的 SQL Server 字段类型会在字段配置中单独展示。这类字段需要开发适配后才能在 NocoBase 中作为普通字段使用。

:::

## 主键和记录唯一标识

用于页面区块展示和编辑的数据表，建议有主键或唯一字段。NocoBase 会优先使用主键作为记录唯一标识。

如果接入的是视图、无主键表或联合主键表，需要在数据表配置中手动设置「Record unique key」。没有可用唯一标识时，页面区块可能无法正确查看、编辑或删除记录。

![20260709210154](https://static-docs.nocobase.com/20260709210154.png)
![20260709210214](https://static-docs.nocobase.com/20260709210214.png)

## 相关链接

- [外部数据库](./index.md) — 查看外部数据库的通用配置和管理说明
- [数据源管理](../data-source-manager/index.md) — 查看数据源入口和数据源管理方式
- [数据表字段](../data-modeling/collection-fields/index.md) — 查看字段类型和字段映射说明
