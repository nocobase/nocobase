---
title: "Data sources overview"
description: "NocoBase data sources and data modeling: main databases, external databases, REST APIs, external NocoBase, collections, and fields."
keywords: "data source,data modeling,main database,external database,REST API,external NocoBase,collection,NocoBase"
---

# Overview

Data modeling is a key part of database design. It analyzes and abstracts real-world data and the relationships between it, then describes those relationships as a data model for an information system. NocoBase is data-model driven and provides the following capabilities.

## Connect data from different sources

NocoBase data sources can be common databases, API or SDK platforms, and files.

![Data source types](https://static-docs.nocobase.com/20240512085558.png)

NocoBase provides the [Data Source Manager](./data-source-manager/index.md) to manage data sources and their collections. The manager provides the interface for managing all data sources; it does not connect to a source by itself. Use it together with the applicable data-source plugin.

Supported data sources include:

- [Main data source](./data-source-main/index.md): The NocoBase main database. It supports PostgreSQL, MySQL, MariaDB, KingbaseES, and OceanBase.
- [External PostgreSQL](./data-source-external-postgres/index.md): Connect an existing PostgreSQL database.
- [External MySQL](./data-source-external-mysql/index.md): Connect an existing MySQL database.
- [External MariaDB](./data-source-external-mariadb/index.md): Connect an existing MariaDB database.
- [External MSSQL](./data-source-external-mssql/index.md): Connect an existing SQL Server database.
- [External KingbaseES](./data-source-kingbase/index.md): Connect an existing KingbaseES database.
- [External OceanBase](./external/oceanbase.md): Connect an existing OceanBase database.
- [External Oracle](./data-source-external-oracle/index.md): Connect an existing Oracle database.
- [External ClickHouse](./external/clickhouse.md): Connect an existing ClickHouse database.
- [External Doris](./external/doris.md): Connect an existing Doris database.
- [REST API data source](./data-source-rest-api/index.md): Map a third-party system's REST API to a data source.
- [External NocoBase data source](./data-source-external-nocobase/index.md): Connect collections from another NocoBase application.

![Data source management](https://static-docs.nocobase.com/20240512083651.png)

## Data-modeling tools

**A simple collection management interface** lets you create different data models (collections) or connect existing ones.

![Collection management](https://static-docs.nocobase.com/20240512090751.png)

**An ER-diagram-like visual interface** helps extract entities and their relationships from user and business requirements. It gives you a direct way to describe the data model and understand the main data entities in a system and how they are connected.

![Visual data modeling](https://static-docs.nocobase.com/20240410075906.png)

## Create different collection types

| Collection | Description |
| --- | --- |
| [General collection](./data-source-main/general-collection.md) | Includes commonly used system fields. |
| [Calendar collection](./calendar/calendar-collection.md) | Creates event collections for calendars. |
| [Comment collection](./collection-comment/index.md) | Stores comments or feedback on data. |
| [Tree collection](./collection-tree/index.md) | Stores hierarchical data. Currently it supports the adjacency-list design. |
| [File collection](./file-manager/file-collection.md) | Manages file storage. |
| [Connect a database view](./collection-view/index.md) | Connects an existing database view. |
| [SQL collection](./collection-sql/index.md) | Presents an SQL query result in a structured form; it is not a real database table. |
| [Connect external data](./collection-fdw/index.md) | Connects remote data tables through database FDW technology. |

![Collection types](https://static-docs.nocobase.com/20240512102212.png)

For more information, see [Collections](./data-modeling/collection.md).

## Rich field types

NocoBase provides a range of field types for different business data and interface requirements.

![Field types](https://static-docs.nocobase.com/20240512110352.png)

For more information, see [Collection fields](./data-modeling/collection-fields/index.md).
