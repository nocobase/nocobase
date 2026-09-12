---
pkg: "@nocobase/plugin-data-source-external-oracle"
title: "外部数据源 - Oracle"
description: "了解如何把 Oracle 作为 NocoBase 外部数据库接入，包括支持版本、插件安装、Thin/Thick 连接模式、Client directory、权限和字段映射。"
keywords: "外部数据源,Oracle,外部数据库,Thin,Thick,Client directory,字段映射,NocoBase"
---

# Oracle

## 介绍

Oracle 可以作为外部数据库接入 NocoBase。接入后，NocoBase 会读取 Oracle 中的数据表、字段和视图，并把它们作为外部数据源中的数据表使用。

跟[主数据库](../main/index.md)不同，外部 Oracle 的真实表结构仍由原业务系统、数据库客户端或迁移脚本维护。NocoBase 负责读取结构、保存字段元数据、配置页面区块、权限、工作流和 API。

| 配置项 | 说明 |
| --- | --- |
| 支持版本 | Oracle >= 11g。 |
| 商业版本 | 企业版支持。 |
| 对应插件 | `@nocobase/plugin-data-source-external-oracle`。 |
| 连接模式 | Oracle Database 12.1 及以上版本通常使用 Thin 模式；早于 12.1 的版本使用 Thick 模式。 |

适合使用外部 Oracle 的场景：

- 接入已有 ERP、MES、WMS、CRM 等业务系统的 Oracle 数据库
- 在不迁移历史数据的情况下，用 NocoBase 搭建管理界面
- 对已有表做权限控制、流程处理、数据修正或报表展示
- 数据库结构继续由 DBA、迁移脚本或原系统维护

:::warning 注意

外部 Oracle 不是 NocoBase 的系统数据库。NocoBase 不会接管它的备份、还原、迁移和表结构变更。

:::

## 插件安装

该插件为商业插件，详细的激活方式请参考：[商业插件激活指南](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

如果连接模式选择 Thick，需要在 NocoBase 运行环境中安装 Oracle Client libraries，并在数据源配置里填写「Client directory」。

## 安装 Oracle 客户端

Oracle Database 12.1 及以上版本通常使用 Thin 模式，不需要额外安装 Oracle Client。只有当你连接 Oracle Database 12.1 之前的版本，或者必须使用 Thick 模式时，才需要在 NocoBase 运行环境中安装 Oracle Client libraries。

在数据源配置中选择「Thick」模式后，需要确认 NocoBase 服务所在机器可以加载 Oracle Client。

![20241204164359](https://static-docs.nocobase.com/20241204164359.png)

Linux 环境可以参考下面的方式安装 Oracle Instant Client：

```bash
apt-get update
apt-get install -y unzip wget libaio1
wget https://download.oracle.com/otn_software/linux/instantclient/1925000/instantclient-basic-linux.x64-19.25.0.0.0dbru.zip
unzip instantclient-basic-linux.x64-19.25.0.0.0dbru.zip -d /opt/
echo /opt/instantclient_19_25 > /etc/ld.so.conf.d/oracle-instantclient.conf
ldconfig
```

如果 Oracle Client 不是安装在系统默认可加载的位置，需要在「Client directory」中填写客户端库目录。比如上面的安装方式，对应目录是 `/opt/instantclient_19_25`。

![20241204165940](https://static-docs.nocobase.com/20241204165940.png)

:::tip 提示

`Client directory` 只在 Thick 模式下需要配置。Thin 模式不使用这个配置。更多初始化规则可以参考 [node-oracledb 初始化文档](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html)。

:::

## 添加数据源

在「数据源管理」中点击「Add new」，选择 Oracle，然后填写连接信息。

![20241204164359](https://static-docs.nocobase.com/20241204164359.png)

常见连接配置如下：

| 配置 | 说明 |
| --- | --- |
| Data source name | 数据源标识名称，用于页面区块、权限、工作流和 API 中引用。创建后不能修改。 |
| Data source display name | 数据源在界面中显示的名称，建议使用业务人员能理解的名称，比如「ERP Oracle」「财务库」。 |
| Host / Port | Oracle 主机地址和端口。默认端口通常是 `1521`。 |
| ServerName | Oracle 服务名。填写数据库监听中配置的 service name。 |
| Username / Password | 用于连接 Oracle 的账号和密码。NocoBase 读取这个账号 Owner 下的数据表和视图，不会授权或读取其他 Owner 下的对象。 |
| Connection mode | Oracle 连接模式。Oracle Database 12.1 及以上版本通常使用 Thin 模式；早于 12.1 的版本使用 Thick 模式。 |
| Client directory | Oracle Thick 模式下的 Oracle Client libraries 目录。只有选择 Thick 模式时才需要配置。 |
| Table prefix | 表名前缀。配置后，NocoBase 只读取匹配该前缀的数据表和视图，并在 NocoBase 中生成不带前缀的数据表名称。 |
| Collections / Add all collections | 控制接入范围。启用「Add all collections」时，NocoBase 会接入当前 Owner 和前缀范围内的全部表和视图；关闭后，只接入你在「Collections」里勾选的对象。 |
| Enabled the data source | 是否启用这个数据源。关闭后，数据源配置会保留，但页面区块、权限、工作流和 API 无法继续读取它的数据。 |

:::tip 提示

Oracle 中的接入范围主要由连接账号 Owner、`Table prefix` 和「Collections」决定。如果同一个实例里对象很多，建议使用专门账号连接业务需要的 schema，减少无关对象进入 NocoBase。

:::

## 选择数据表

填写连接信息后，可以点击「Load Collections」读取 Oracle 中可用的数据表和视图。读取结果会受到连接账号 Owner、`Table prefix` 和「Collections」配置影响。

默认会启用「Add all collections」，表示接入当前范围内的全部表和视图。如果只想接入部分对象，可以关闭「Add all collections」，然后在列表中勾选需要的数据表或视图。

![add_new_database_configure_load_collection](https://static-docs.nocobase.com/add_new_database_configure_load_collection.png)

:::warning 注意

单个外部数据源一次最多接入 500 张数据表或视图。如果 Oracle 中对象很多，建议先通过连接账号 Owner、`Table prefix` 或「Collections」收窄范围。

:::

## 同步和配置字段

外部 Oracle 的表结构由数据库侧维护。NocoBase 不会在外部 Oracle 中创建字段、修改字段类型或删除真实字段。

当 Oracle 侧表结构发生变化时，可以在数据源中执行「Sync from database」，重新读取表和字段元数据。同步会更新 NocoBase 中保存的数据表、字段、主键、唯一键和字段类型映射信息，但不会删除 Oracle 中的真实表或数据。

字段同步后，可以在 NocoBase 中配置字段标题、字段类型（Field type）和字段组件（Field interface）。如果需要建立 NocoBase 关系字段，也是在 NocoBase 中保存关系元数据，不会在 Oracle 表里自动新增真实外键字段。

## 字段类型映射

NocoBase 会根据 Oracle 字段类型，自动映射到合适的 Field type 和 Field interface。你可以在字段配置中调整界面展示方式。

常见映射如下：

| Oracle 字段类型 | NocoBase Field type | 可选 Field interface |
| --- | --- | --- |
| `NUMBER` | `integer`、`float`、`boolean`、`bigInt`、`unixTimestamp`、`sort` | Integer、Number、Sort、Checkbox、Switch、Select、Radio group。 |
| `BINARY_FLOAT`、`BINARY_DOUBLE`、`FLOAT` | `float` | Number、Percent。 |
| `INTEGER`、`SMALLINT`、`PLSQL_INTEGER` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group。 |
| `CHAR`、`NCHAR`、`VARCHAR2`、`NVARCHAR2` | `string`、`uuid`、`nanoid`、`datetimeNoTz` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `LONG`、`NCLOB` | `string`、`text` | Input、Textarea、Markdown、Vditor、Rich text。 |
| `CLOB` | `string` | Input、Textarea、Rich text。 |
| `DATE` | `datetimeNoTz` | Date、Time、Created at、Updated at。 |
| `TIMESTAMP` | `datetimeNoTz` | Date、Time、Created at、Updated at。 |
| `TIMESTAMP WITH TIME ZONE`、`TIMESTAMP WITH LOCAL TIME ZONE` | `datetimeTz` | Date、Time、Created at、Updated at。 |
| `ROWID`、`UROWID` | `string`、`text`、`integer` | Input、Textarea、Integer。 |
| `JSON` | `json` | JSON。 |

:::warning 注意

`BLOB`、`BFILE` 等二进制对象类型不会自动作为普通文件字段使用。如果需要在页面中管理附件，通常建议在 NocoBase 中使用文件表或附件字段保存文件元信息。

:::

## 主键和记录唯一标识

用于页面区块展示和编辑的数据表，建议有主键或唯一字段。NocoBase 会优先使用主键作为记录唯一标识。

如果接入的是视图、无主键表或联合主键表，需要在数据表配置中手动设置「Record unique key」。没有可用唯一标识时，页面区块可能无法正确查看、编辑或删除记录。

![20260709210948](https://static-docs.nocobase.com/20260709210948.png)
![20260709211004](https://static-docs.nocobase.com/20260709211004.png)

## 相关链接

- [外部数据库](./index.md) — 查看外部数据库的通用配置和管理说明
- [数据源管理](../data-source-manager/index.md) — 查看数据源入口和数据源管理方式
- [数据表字段](../data-modeling/collection-fields/index.md) — 查看字段类型和字段映射说明
- [node-oracledb 初始化文档](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html) — 查看 Oracle Client libraries 的加载方式
