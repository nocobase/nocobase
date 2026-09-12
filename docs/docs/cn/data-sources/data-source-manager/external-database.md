---
title: "外部数据库"
description: "NocoBase 外部数据库：连接已有 MySQL/PostgreSQL/MariaDB/KingbaseES/OceanBase/MSSQL/Oracle/ClickHouse/Doris 数据库，读取数据表结构、配置字段映射和关系字段。"
keywords: "外部数据库,MySQL,PostgreSQL,MariaDB,KingbaseES,OceanBase,MSSQL,Oracle,ClickHouse,Doris,数据表同步,字段映射,NocoBase"
---

# 外部数据库

## 介绍

外部数据库用于把已经存在的业务数据库接入 NocoBase ，读取外部数据库中的数据表、字段和视图，让这些数据表可以在页面区块、权限、工作流和 API 中使用。

与[主数据库](../data-source-main/index.md)不同，外部数据库的表结构由原系统、数据库客户端维护，NocoBase 负责读取表结构和视图，不会修改外部数据库的真实表结构。

外部数据库支持的数据库版本和商业版本如下：

| 数据库 | 支持版本 | 社区版 | 标准版 | 专业版 | 企业版 |
| --- | --- | --- | --- | --- | --- |
| MySQL | >= 5.7 | ❌ | ✅ | ✅ | ✅ |
| PostgreSQL | >= 9.5 | ❌ | ✅ | ✅ | ✅ |
| MariaDB | >= 10.3 | ❌ | ✅ | ✅ | ✅ |
| MSSQL | 2014-2019 | ❌ | ✅ | ✅ | ✅ |
| KingbaseES | >=V9 | ❌ | ❌ | ✅ | ✅ |
| OceanBase | >=4.3 | ❌ | ❌ | ❌ | ✅ |
| Oracle | >= 11g | ❌ | ❌ | ❌ | ✅ |
| ClickHouse | >= 20.2 | ❌ | ❌ | ❌ | ✅ |
| Doris | >= 2.1.0 | ❌ | ❌ | ❌ | ✅ |

:::tip 提示

KingbaseES 只支持 PostgreSQL 兼容模式，OceanBase、ClickHouse、Doris 只支持 MySQL 兼容模式。

:::

外部数据库适用场景：

- 连接已有业务系统（如老 ERP、MES、WMS）数据库，利用 NocoBase 的能力，在不改动原数据库表结构的前提下，快速搭建管理界面、权限控制、工作流和报表。
- 为已有系统补充轻量应用能力，比如审批、数据修正、异常处理、运营看板等，不需要替换原系统。
- 对已有数据库做只读查询、统计分析或 BI 展示，减少对原业务系统页面的依赖。
- 分阶段迁移历史系统，先在 NocoBase 中接入旧库继续使用，再逐步把新业务数据放到主数据库中维护。
- 数据库结构仍由 DBA、迁移脚本或原业务系统维护，NocoBase 只负责读取结构、配置界面和使用数据。

:::warning 注意

外部数据库不是 NocoBase 的系统数据库。NocoBase 不会接管外部数据库的备份、还原、迁移和表结构，这些仍然需要在外部数据库维护。

:::

## 插件安装

外部数据库由对应的数据源插件提供。安装并启用插件后，才能在「数据源管理」的「Add new」菜单中选择对应数据库类型。

| 数据库 | 对应插件 | 安装方式 |
| --- | --- | --- |
| MySQL | `@nocobase/plugin-data-source-external-mysql` | 需要商业授权，安装并启用插件后使用。 |
| PostgreSQL | `@nocobase/plugin-data-source-external-postgres` | 需要商业授权，安装并启用插件后使用。 |
| MariaDB | `@nocobase/plugin-data-source-external-mariadb` | 需要商业授权，安装并启用插件后使用。 |
| KingbaseES | `@nocobase/plugin-data-source-kingbase` | 需要商业授权，安装并启用插件后使用。 |
| OceanBase | `@nocobase/plugin-data-source-oceanbase` | 需要商业授权，安装并启用插件后使用。 |
| MSSQL | `@nocobase/plugin-data-source-external-mssql` | 需要商业授权，安装并启用插件后使用。 |
| Oracle | `@nocobase/plugin-data-source-external-oracle` | 需要商业授权，安装并启用插件后使用。 |
| ClickHouse | `@nocobase/plugin-data-source-external-clickhouse` | 需要商业授权，安装并启用插件后使用。 |
| Doris | `@nocobase/plugin-data-source-external-doris` | 需要商业授权，安装并启用插件后使用。 |

![add_new_database](https://static-docs.nocobase.com/add_new_database.png)

如果「Add new」菜单里没有目标数据库类型，通常需要先确认：

- 对应插件是否已经安装
- 插件是否已经启用
- 当前商业授权是否包含该插件
- 当前用户是否有数据源管理权限


## 使用说明

### 添加外部数据库

激活插件之后，才可以在数据源管理的 Add new 下拉菜单中选择并添加。

![20240507204316](https://static-docs.nocobase.com/20240507204316.png)

填写需要接入的数据库信息

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

### 数据表同步

外部数据库建立连接之后，会直接读取数据源里的所有数据表。外部数据库不支持直接添加数据表或修改表结构，如果需要修改，可以通过数据库客户端进行操作，再在界面上点击「刷新」按钮来同步。

![20240507204725](https://static-docs.nocobase.com/20240507204725.png)

### 配置字段

外部数据库会自动读取已有数据表的字段，并展示出来。可以快速查看并配置字段的标题、数据类型（Field type）和 UI 类型（Field interface），也可以点击「编辑」按钮，修改更多配置。

![20240507210537](https://static-docs.nocobase.com/20240507210537.png)

因为外部数据库不支持修改表结构，所以新增字段时，可选的类型只有关系字段。关系字段并不是真实的字段，而是用于建立表和表之间的连接。

![20240507220140](https://static-docs.nocobase.com/20240507220140.png)

更多内容查看[数据表字段 / 概述](../data-modeling/collection-fields/index.md)章节。

### 字段类型映射

NocoBase 会自动为外部数据库的字段类型，映射相对应的数据类型（Field type）和 UI 类型（Field Interface）。

- 数据类型（Field type）：用于定义字段可以存储的数据的种类、格式和结构；
- UI 类型（Field interface）：是指在用户界面中用于显示和输入字段值的控件类型。

| PostgreSQL | MySQL/MariaDB | NocoBase Data Type | NocoBase Interface Type |
| - | - | - | - |
| BOOLEAN | BOOLEAN<br/>TINYINT(1) | boolean | checkbox <br/> switch |
| SMALLINT<br/>INTEGER<br/>SERIAL<br/>SMALLSERIAL | TINYINT<br/>SMALLINT<br/>MEDIUMINT<br/>INTEGER | integer<br/>boolean<br/>sort | integer<br/>sort<br/>checkbox<br/>switch<br/>select<br/>radioGroup |
| BIGINT<br/>BIGSERIAL | BIGINT | bigInt<br/>sort | integer<br/>sort<br/>checkbox<br/>switch<br/>select<br/>radioGroup<br/>unixTimestamp<br/>createdAt<br/>updatedAt |
| REAL | FLOAT | float | number<br/>percent |
| DOUBLE PRECISION | DOUBLE PRECISION | double | number<br/>percent |
| DECIMAL<br/>NUMERIC | DECIMAL | decimal | number<br/>percent<br/>currency |
| VARCHAR<br/>CHAR | VARCHAR<br/>CHAR | string<br/>password<br/>uuid<br/>nanoid | input<br/>email<br/>phone<br/>password<br/>color<br/>icon<br/>select<br/>radioGroup<br/>uuid<br/>nanoid |
| TEXT | TEXT<br/>TINYTEXT<br/>MEDIUMTEXT<br/>LONGTEXT | text<br/>json | textarea<br/>markdown<br/>vditor<br/>richText<br/>url<br/>json |
| UUID | - | uuid | uuid |
| JSON<br/>JSONB | JSON | json | json |
| TIMESTAMP | DATETIME<br/>TIMESTAMP | date | date<br/>time<br/>createdAt<br/>updatedAt |
| DATE | DATE | dateOnly | datetime |
| TIME | TIME | time | time |
| - | YEAR |  | datetime |
| CIRCEL |  | circle | json<br/>circle |
| PATH<br/>GEOMETRY(LINESTRING) | LINESTRING | lineString | Json<br/>lineString |
| POINT<br/>GEOMETRY(POINT) | POINT | point | json<br/>point |
| POLYGON<br/>GEOMETRY(POLYGON) | POLYGON | polygon | json<br/>polygon |
| GEOMETRY | GEOMETRY |  -  |  -  |
| BLOB | BLOB | blob |  -  |
| ARRAY |  -  | array | multipleSelect<br/>checkboxGroup |
| BIT | BIT | - | - |
| SET | SET | set | multipleSelect<br/>checkboxGroup |
| RANGE | - | - | - |

### 不支持的字段类型

不支持的字段类型会单独展示出来，这些字段需要开发适配之后才能使用。

![20240507221854](https://static-docs.nocobase.com/20240507221854.png)

### 记录唯一标识

作为区块展示的数据表需要有「记录唯一标识」（Record unique key）。记录唯一标识用于在页面区块中定位一条记录，通常选择主键或唯一字段。

如果是视图、无主键表或联合主键表，需要在数据表配置中手动设置「Record unique key」。没有可用唯一标识时，页面区块可能无法正确创建区块、查看或编辑记录。更多说明可以参考[主数据库 / 编辑数据表](../main/index.md)。

![edit_collection](https://static-docs.nocobase.com/edit_collection.png)

![edit_collection_configure](https://static-docs.nocobase.com/edit_collection_configure.png)
