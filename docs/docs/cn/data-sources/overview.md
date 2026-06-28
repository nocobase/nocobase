---
title: "数据源概述"
description: "NocoBase 数据源与数据建模：主数据源、外部 MySQL/PostgreSQL/MariaDB/KingbaseES/OceanBase/MSSQL/Oracle/ClickHouse/Doris、数据源管理、普通表、树表、SQL 表、文件表、REST API"
keywords: "数据源,数据建模,主数据源,外部数据源,Collection,树表,SQL表"
---

# 概述

NocoBase 是数据模型驱动的产品，数据源是核心功能之一，在数据源中**数据建模「创建数据表、字段」**是使用 NocoBase 的必要步骤，后续页面搭建、业务流程设计、数据权限访问控制等功能会使用数据模型中的数据表和字段。

## 访问数据源

1. 点击系统功能中的数据源菜单，访问数据源主页。
2. 选择数据源列表。

![datasource_list](https://static-docs.nocobase.com/datasource_list.png)

## 支持的数据源

- 主数据库：部署 NocoBase 的时候配置的数据库，用于存储 NocoBase 的系统表数据，也支持存储用户业务表数据，支持的数据库：MySQL、PostgreSQL、MariaDB、KingbaseES、OceanBase。
- 外部数据库：使用外部已有的数据库，支持的数据库： MySQL、PostgreSQL、MariaDB、KingbaseES、OceanBase、MSSQL、Oracle、ClickHouse、Doris。
- API数据源：REST API、外部 NocoBase应用。

## 如何选择数据源

- 如果搭建全新的业务系统，建议使用 **主数据库**，可以使用 NocoBase 完整的能力。
- 如果是历史系统的功能补充、报表/BI分析、无API，建议使用 **外部数据库**，集成第三方系统历史数据库，操作数据库表的数据进行增删改查。
- 如果与第三方系统实时业务协同、数据同步，实现业务逻辑的复用，建议使用**REST API**。
- 如果 NocoBase 集成另外 NocoBase 要保留远端应用中配置的数据表、字段、关系字段等信息，建议使用 **NocoBase 应用数据源**，不需要重新配置。

### 了解更多数据源信息
- [主数据库](main/main-database)
- [外部数据库](external-database/external-database)
- [主数据库、外部数据库对比](main-vs-external-database)
- [REST API 数据源](rest-api/rest-api)
- [外部 NocoBase](external-nocobase/external-nocobase)

## 我想要……
| 我想要…… | 去哪里看 |
| --- | --- |
| 数据源怎么添加 | [数据源管理](/data-sources/data-source-manager) |
| 连接已有的数据库 | [数据源管理](/data-sources/data-source-manager) |
| 如何管理数据源 | [数据源管理](/data-sources/data-source-manager) |
| 从零创建业务数据表 | [主数据库建表](#主数据建表)、[外部数据库建表](#外部数据建表) |
| 同步数据库里新增或修改的数据表 |[同步主数据库结构](#主数据建表)、[同步外部数据库结构](#外部数据建表) |
| 理解字段类型和界面组件的关系 | [字段](#字段) |
| 通过 HTTP API 接入第三方数据 | [REST API 数据源](#rest-api-数据源) |