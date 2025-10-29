# 数据源管理

<PluginInfo name="data-source-manager"></PluginInfo>

## 介绍

NocoBase 提供了数据源管理插件，用于管理数据源及其数据表。数据源管理插件只是提供所有数据源的管理界面，并不提供接入数据源的能力，它需要和各种数据源插件搭配使用。目前支持接入的数据源包括：

- [Main Database](/handbook/data-source-main)：NocoBase 主数据库，支持 MySQL、PostgreSQL、MariaDB 等关系型数据库。
- [External MySQL](/handbook/data-source-external-mysql)：使用外部的 MySQL 数据库作为数据源。
- [External MariaDB](/handbook/data-source-external-mariadb)：使用外部的 MariaDB 数据库作为数据源。
- [External PostgreSQL](/handbook/data-source-external-postgres)：使用外部的 PostgreSQL 数据库作为数据源。

除此之外，可以通过插件扩展更多类型，可以是常见的各类数据库，也可以是提供 API（SDK）的平台。

## 安装

内置插件，无需单独安装。

## 使用说明

应用初始化安装时，会默认提供一个用于存储 NocoBase 数据的数据源，称之为主数据库。更多内容查看 [主数据库](/handbook/data-source-main) 文档。

![20240322220423](https://static-docs.nocobase.com/20240322220423.png)

同时，也支持外部数据库作为数据源。更多内容查看 [外部数据库 / 介绍](/handbook/data-source-manager/external-database) 文档。

![20240507204316](https://static-docs.nocobase.com/20240507204316.png)

也可以接入 HTTP API 来源的数据，更多内容查看 [HTTP API 数据源](/handbook/data-source-http-api) 文档。
