---
pkg: "@nocobase/plugin-data-source-manager"
title: "Data source management"
description: "Use the Data Source Manager to manage the main database, external databases, REST API data sources, and external NocoBase data sources from one interface."
keywords: "data source management,main database,external database,table synchronization,REST API data source,NocoBase"
---

# Data source management

## Introduction

NocoBase provides the **Data Source Manager** plugin to manage data sources and their collections. It provides the management interface for all data sources; it does not connect to a data source by itself. Use it together with the applicable data-source plugin.

Supported data sources include:

- [Main database](../data-source-main/index.md): The NocoBase main database. It supports MySQL, PostgreSQL, MariaDB, KingbaseES, and OceanBase.
- [External PostgreSQL](../data-source-external-postgres/index.md): Uses an external PostgreSQL database as a data source.
- [External MySQL](../data-source-external-mysql/index.md): Uses an external MySQL database as a data source.
- [External MariaDB](../data-source-external-mariadb/index.md): Uses an external MariaDB database as a data source.
- [External MSSQL](../data-source-external-mssql/index.md): Uses an external MSSQL (SQL Server) database as a data source.
- [External KingbaseES](../data-source-kingbase/index.md): Uses an external KingbaseES database as a data source.
- [External OceanBase](../external/oceanbase.md): Uses an external OceanBase database as a data source.
- [External Oracle](../data-source-external-oracle/index.md): Uses an external Oracle database as a data source.
- [External ClickHouse](../external/clickhouse.md): Uses an external ClickHouse database, typically for queries, statistics, and reports.
- [External Doris](../external/doris.md): Uses an external Doris database, typically for queries, statistics, and reports.
- [REST API data source](../data-source-rest-api/index.md): Connects data supplied by a REST API to NocoBase.
- [External NocoBase](../data-source-external-nocobase/index.md): Uses the remote NocoBase API to connect another NocoBase application as an external data source.

Plugins can extend this list with other database types and platforms that provide APIs or SDKs.

## Installation

This plugin is built in and does not require a separate installation.

## Usage

During application initialization, NocoBase provides a data source for storing NocoBase data. This source is called the **main database**. See [Main database](../data-source-main/index.md) for details.

### External data sources

NocoBase supports external databases as data sources. See [External databases](./external-database.md) for details.

![External data sources](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-45-33.png)

### Synchronize custom database tables

You can synchronize tables that were created in the database outside NocoBase.

![Synchronize custom database tables](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

You can also connect data supplied by an HTTP API. See [REST API data source](../data-source-rest-api/index.md) for details.

### External NocoBase data source

Use the remote NocoBase API to connect another NocoBase application as an external data source. See [External NocoBase](../data-source-external-nocobase/index.md) for details.
