---
title: "数据源概述"
description: "NocoBase 数据源与数据建模：主数据库、外部数据库、REST API、外部 NocoBase、数据源管理、普通表、树表、SQL 表、文件表。"
keywords: "数据源,数据建模,主数据库,外部数据库,REST API,外部 NocoBase,Collection,树表,SQL 表,NocoBase"
---

# 概述

数据建模是设计数据库时的关键步骤，它涉及对现实世界各类数据及其相互关系进行深入分析和抽象的过程。在这一过程中，我们试图揭示数据之间的内在联系，并将其形式化描述为数据模型，为信息系统的数据库结构奠定基础。NocoBase 是一个数据模型驱动的平台，具有以下特色：

## 支持接入各种来源数据

NocoBase 的数据源可以是常见的各类数据库、API（SDK）平台和文件。

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

NocoBase 提供了[数据源管理插件](./data-source-manager/index.md)，用于管理各数据源及其数据表。数据源管理插件只是提供所有数据源的管理界面，并不提供接入数据源的能力，它需要和各种数据源插件搭配使用。目前支持的数据源包括：

- [主数据源](./data-source-main/index.md)：NocoBase 主数据库，支持 PostgreSQL、MySQL、MariaDB、KingbaseES、OceanBase。
- [外部 PostgreSQL](./data-source-external-postgres/index.md)：接入已有 PostgreSQL 数据库。
- [外部 MySQL](./data-source-external-mysql/index.md)：接入已有 MySQL 数据库。
- [外部 MariaDB](./data-source-external-mariadb/index.md)：接入已有 MariaDB 数据库。
- [外部 MSSQL](./data-source-external-mssql/index.md)：接入已有 SQL Server 数据库。
- [外部 KingbaseES](./data-source-kingbase/index.md)：接入已有 KingbaseES 数据库。
- [外部 OceanBase](./external/oceanbase.md)：接入已有 OceanBase 数据库。
- [外部 Oracle](./data-source-external-oracle/index.md)：接入已有 Oracle 数据库。
- [外部 ClickHouse](./external/clickhouse.md)：接入已有 ClickHouse 数据库。
- [外部 Doris](./external/doris.md)：接入已有 Doris 数据库。
- [REST API 数据源](./data-source-rest-api/index.md)：把第三方系统的 REST API 映射为数据源。
- [外部 NocoBase 数据源](./data-source-external-nocobase/index.md)：连接另一个 NocoBase 应用中的数据表。

![20240512083651](https://static-docs.nocobase.com/20240512083651.png)

## 提供了多样的数据建模工具

**简易的数据表管理界面**：用于创建各种模型（数据表）或连接已有模型（数据表）。

![20240512090751](https://static-docs.nocobase.com/20240512090751.png)

**类 ER 图的可视化界面**：用于从用户和业务需求中提取实体和它们之间的关系，它提供了一种直观且易于理解的方式来描述数据模型，通过 ER 图可以更清晰地理解系统中的主要数据实体和它们之间的联系。

![20240512091042](https://static-docs.nocobase.com/20240410075906.png)

## 支持创建各种数据表

| 数据表 | 描述 |
| - | - |
| [普通数据表](/data-sources/data-source-main/general-collection) | 内置了常用的系统字段 |
| [日历数据表](/data-sources/calendar/calendar-collection) | 用于创建日历相关的事件表 |
| [评论表](/data-sources/collection-comment/) | 用于存储对数据的评论或反馈 |
| [树结构表](/data-sources/collection-tree/) | 树结构表，目前只支持邻接表设计 |
| [文件数据表](/data-sources/file-manager/file-collection) | 用于文件存储的管理 |
| [连接数据库视图](/data-sources/collection-view/) | 连接已有的数据库视图 |
| [SQL 数据表](/data-sources/collection-sql/) | 并不是实际的数据库表，而是快速的将 SQL 查询，结构化的展示出来 |
| [连接外部数据](/data-sources/collection-fdw) | 基于数据库的 FDW 技术实现的连接远程数据表 |

![20240512102212](https://static-docs.nocobase.com/20240512102212.png)

更多内容查看 「[数据表 / 概述](/data-sources/data-modeling/collection)」 章节

## 提供了丰富的字段类型

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

更多内容查看 「[数据表字段 / 概述](/data-sources/data-modeling/collection-fields/)」 章节
