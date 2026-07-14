---
pkg: "@nocobase/plugin-data-source-manager"
title: "数据源管理"
description: "数据源管理插件：管理主数据库、外部数据库、REST API 数据源和外部 NocoBase 数据源，提供统一的数据源管理界面。"
keywords: "数据源管理,主数据库,外部数据库,数据表同步,REST API 数据源,NocoBase"
---
# 数据源管理

## 介绍

NocoBase 提供了数据源管理插件，用于管理数据源及其数据表。数据源管理插件只是提供所有数据源的管理界面，并不提供接入数据源的能力，它需要和各种数据源插件搭配使用。目前支持接入的数据源包括：

- [Main Database](/data-sources/data-source-main/)：NocoBase 主数据库，支持 MySQL、PostgreSQL、MariaDB、KingbaseES、OceanBase。
- [External PostgreSQL](/data-sources/data-source-external-postgres/)：使用外部的 PostgreSQL 数据库作为数据源。
- [External MySQL](/data-sources/data-source-external-mysql/)：使用外部的 MySQL 数据库作为数据源。
- [External MariaDB](/data-sources/data-source-external-mariadb/)：使用外部的 MariaDB 数据库作为数据源。
- [External MSSQL](/data-sources/data-source-external-mssql/)：使用外部的 MSSQL（SQL Server）数据库作为数据源。
- [External KingbaseES](/data-sources/data-source-kingbase/)：使用外部的 KingbaseES 数据库作为数据源。
- [External OceanBase](/data-sources/external/oceanbase)：使用外部的 OceanBase 数据库作为数据源。
- [External Oracle](/data-sources/data-source-external-oracle/)：使用外部的 Oracle 数据库作为数据源。
- [External ClickHouse](/data-sources/external/clickhouse)：使用外部的 ClickHouse 数据库作为数据源，通常用于查询、统计和报表展示。
- [External Doris](/data-sources/external/doris)：使用外部的 Doris 数据库作为数据源，通常用于查询、统计和报表展示。
- [REST API 数据源](/data-sources/data-source-rest-api/)：将 REST API 来源的数据接入 NocoBase。
- [External NocoBase](/data-sources/data-source-external-nocobase/)：通过远端 NocoBase API 将另一个 NocoBase 应用作为外部数据源。

除此之外，可以通过插件扩展更多类型，可以是常见的各类数据库，也可以是提供 API（SDK）的平台。

## 安装

内置插件，无需单独安装。

## 使用说明

应用初始化安装时，会默认提供一个用于存储 NocoBase 数据的数据源，称之为主数据库。更多内容查看 [主数据库](/data-sources/data-source-main/index.md) 文档。

### 外部数据源

支持外部数据库作为数据源。更多内容查看 [外部数据库 / 介绍](/data-sources/data-source-manager/external-database.md) 文档。

![nocobase_doc-2025-10-29-19-45-33](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-45-33.png)

### 支持同步数据库自建表

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

也可以接入 HTTP API 来源的数据，更多内容查看 [REST API 数据源](/data-sources/data-source-rest-api/index.md) 文档。

### 外部 NocoBase 数据源

可以通过远端 NocoBase API 将另一个 NocoBase 应用作为外部数据源接入。更多内容查看 [外部 NocoBase](/data-sources/data-source-external-nocobase/index.md) 文档。
