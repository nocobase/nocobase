---
title: "Data modeling overview"
description: "Data modeling covers designing data models, connecting data sources, visualizing ER diagrams, and creating collections for main and external databases."
keywords: "data modeling,Collection,data model,ER diagram,main database,external database,NocoBase"
---

# Overview

Data modeling is a key step in database design. It involves analyzing and abstracting real-world data and the relationships between it. This process reveals the internal connections between data and formalizes them as a data model, providing the foundation for an information system's database structure. NocoBase is a data-model-driven platform with the following capabilities.

## Connect data from many sources

NocoBase data sources can be common databases, API (SDK) platforms, and files.

![Data sources](https://static-docs.nocobase.com/20240512085558.png)

NocoBase provides the [Data source management plugin](../data-source-manager/index.md) to manage data sources and their collections. It provides the management interface for all data sources, but does not connect a data source by itself; use it with the corresponding data-source plugins. Supported data sources include:

- [Main data source](../main/index.md): The NocoBase main database. It supports relational databases such as MySQL, PostgreSQL, and MariaDB
- [KingbaseES](../main/kingbase.md): Uses KingbaseES as a data source. It can be used as a main or external database
- [External MySQL](../external/mysql.md): Uses an external MySQL database as a data source
- [External MariaDB](../external/mariadb.md): Uses an external MariaDB database as a data source
- [External PostgreSQL](../external/postgresql.md): Uses an external PostgreSQL database as a data source
- [External MSSQL](../external/mssql.md): Uses an external MSSQL (SQL Server) database as a data source
- [External Oracle](../external/oracle.md): Uses an external Oracle database as a data source

![Data source management](https://static-docs.nocobase.com/20240512083651.png)

## Data-modeling tools

**A simple collection management interface**: Create different models (collections) or connect existing models (collections).

![Collection management](https://static-docs.nocobase.com/20240512090751.png)

**An ER-diagram-like visual interface**: Extract entities and their relationships from user and business needs. It provides an intuitive way to describe data models so that you can understand the main data entities in the system and their connections more clearly.

![ER diagram](https://static-docs.nocobase.com/20240410075906.png)

## Create different collection types

| Collection | Description |
| --- | --- |
| [General collection](../data-source-main/general-collection.md) | Includes common system fields. |
| [Calendar collection](../calendar/calendar-collection.md) | Creates event collections for calendar-related data. |
| Comment collection | Stores comments or feedback about data. |
| [Tree collection](../collection-tree/index.md) | A hierarchical collection that currently supports the adjacency-list model only. |
| [File collection](../file-manager/file-collection.md) | Manages file storage. |
| [SQL collection](../collection-sql/index.md) | Does not create an actual database table. It presents SQL query results in a structured way. |
| [Connect a database view](../collection-view/index.md) | Connects an existing database view. |
| Expression collection | Used for dynamic expression scenarios in workflows. |
| Connect external data | Connects remote data tables through database FDW technology. |

![Collection types](https://static-docs.nocobase.com/20240512102212.png)

For more information, see [Collections](./collection.md).

## Rich field types

![Field interface types](https://static-docs.nocobase.com/20240512110352.png)

For more information, see [Fields](./collection-fields/index.md).
