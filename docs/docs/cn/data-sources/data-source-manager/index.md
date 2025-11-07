---
pkg: "@nocobase/plugin-data-source-manager"
---

# 数据源管理

## 介绍

NocoBase 提供了数据源管理插件，用于管理数据源及其数据表。数据源管理插件只是提供所有数据源的管理界面，并不提供接入数据源的能力，它需要和各种数据源插件搭配使用。目前支持接入的数据源包括：

- [Main Database](/data-sources/data-source-main)：NocoBase 主数据库，支持 MySQL、PostgreSQL、MariaDB 等关系型数据库。
- [External MySQL](/data-sources/data-source-external-mysql)：使用外部的 MySQL 数据库作为数据源。
- [External MariaDB](/data-sources/data-source-external-mariadb)：使用外部的 MariaDB 数据库作为数据源。
- [External PostgreSQL](/data-sources/data-source-external-postgres)：使用外部的 PostgreSQL 数据库作为数据源。
- [External MSSQL](/data-sources/data-source-external-mssql)：使用外部的 MSSQL（SQL Server）数据库作为数据源。
- [External Oracle](/data-sources/data-source-external-oracle)：使用外部的 Oracle 数据库作为数据源。

除此之外，可以通过插件扩展更多类型，可以是常见的各类数据库，也可以是提供 API（SDK）的平台。

## 安装

内置插件，无需单独安装。

## 使用说明

应用初始化安装时，会默认提供一个用于存储 NocoBase 数据的数据源，称之为主数据库。更多内容查看 [主数据库](/data-sources/data-source-main/) 文档。

### 外部数据源

支持外部数据库作为数据源。更多内容查看 [外部数据库 / 介绍](/data-sources/data-source-manager/external-database) 文档。

![nocobase_doc-2025-10-29-19-45-33](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-45-33.png)

### 支持同步数据库自建表

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

也可以接入 HTTP API 来源的数据，更多内容查看 [REST API 数据源](/data-sources/data-source-rest-api/) 文档。
