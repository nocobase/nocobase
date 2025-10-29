# Data Source Manager

<PluginInfo name="data-source-manager"></PluginInfo>

## Introduction

NocoBase provides a data source management plugin for managing data sources and their data tables. The data source management plugin only provides a management interface for all data sources and does not provide the ability to access data sources. It needs to be used in conjunction with various data source plugins. The data sources currently supported for access include:

- [Main Database](/handbook/data-source-main): NocoBase's main database, supporting relational databases such as MySQL, PostgreSQL, SQLite, etc.
- [External MySQL](/handbook/data-source-external-mysql): Use an external MySQL database as a data source.
- [External MariaDB](/handbook/data-source-external-mariadb): Use an external MariaDB database as a data source.
- [External PostgreSQL](/handbook/data-source-external-postgres): Use an external PostgreSQL database as a data source.

In addition, more types can be extended through plugins, which can be common types of databases or platforms that provide APIs (SDKs).

## Installation

Built-in plugin, no separate installation required.

## Usage Instructions

When the application is initialized and installed, a data source will be provided by default to store NocoBase data, known as the main database. For more information, see the [Main Database](/handbook/data-source-main).

![20240322220423](https://static-docs.nocobase.com/20240322220423.png)

At the same time, it also supports external databases as data sources. For more information, see the [External Database / Introduction](/handbook/data-source-manager/external-database).

![20240507204316](https://static-docs.nocobase.com/20240507204316.png)

You can also access data from HTTP API sources. For more information, see the [HTTP API Data Source](/handbook/data-source-http-api).
