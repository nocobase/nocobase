---
pkg: "@nocobase/plugin-data-source-manager"
---

# Data Source Manager

## Introduction

NocoBase provides a data source management plugin for managing data sources and their collections. The data source management plugin only provides a management interface for all data sources and does not provide the ability to access data sources. It needs to be used in conjunction with various data source plugins. The data sources currently supported for access include:

- [Main Database](/data-sources/data-source-main): NocoBase's main database, supporting relational databases such as MySQL, PostgreSQL, and MariaDB.
- [External MySQL](/data-sources/data-source-external-mysql): Use an external MySQL database as a data source.
- [External MariaDB](/data-sources/data-source-external-mariadb): Use an external MariaDB database as a data source.
- [External PostgreSQL](/data-sources/data-source-external-postgres): Use an external PostgreSQL database as a data source.
- [External MSSQL](/data-sources/data-source-external-mssql): Use an external MSSQL (SQL Server) database as a data source.
- [External Oracle](/data-sources/data-source-external-oracle): Use an external Oracle database as a data source.

In addition, more types can be extended through plugins, which can be common types of databases or platforms that provide APIs (SDKs).

## Installation

Built-in plugin, no separate installation required.

## Usage Instructions

When the application is initialized and installed, a data source is provided by default to store NocoBase data, known as the main database. For more information, see the [Main Database](/data-sources/data-source-main/) documentation.

### External Data Sources

External databases are supported as data sources. For more information, see the [External Database / Introduction](/data-sources/data-source-manager/external-database) documentation.


![nocobase_doc-2025-10-29-19-45-33](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-45-33.png)


### Support for Syncing Custom Database Tables


![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)


You can also access data from HTTP API sources. For more information, see the [REST API Data Source](/data-sources/data-source-rest-api/) documentation.