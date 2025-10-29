# Connect Foreign Data Tables(FDW)

<PluginInfo name="collection-fdw"></PluginInfo>

## Introduction

This is a plugin that connects to remote data tables based on the foreign data wrapper of the database. Currently, it supports MySQL and PostgreSQL databases.

:::info{title="Connecting Data Sources vs Connecting External Data Tables"}
- **Connecting data sources** refers to establishing a connection with a specific database or API service, and you can fully use the features of the database or the services provided by the API;
- **Connecting external data tables** refers to obtaining data from the outside and mapping it for local use. In the database, it is called FDW (Foreign Data Wrapper), which is a database technology that focuses on using remote tables as local tables and can only connect one by one. Because it is remote access, there will be various constraints and limitations when using it.
- 
The two can also be used in combination. The former is used to establish a connection with the data source, and the latter is used for cross data-source access. For example, a certain PostgreSQL data source is connected, and a certain table in this data source is an external data table created based on FDW.
:::

### MySQL

MySQL uses the `federated` engine, which needs to be activated, and supports connecting to remote MySQL and protocol-compatible databases, such as MariaDB. For more details, refer to the [Federated Storage Engine](https://dev.mysql.com/doc/refman/8.0/en/federated-storage-engine.html) documentation.

### PostgreSQL

In PostgreSQL, different types of `fdw` extensions can be used to support different types of remote data. The currently supported extensions include:

- [postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html): Connect to a remote PostgreSQL database in PostgreSQL.
- [mysql_fdw(under development)](https://github.com/EnterpriseDB/mysql_fdw): Connect to a remote MySQL database in PostgreSQL.
- For other types of fdw extensions, refer to [PostgreSQL Foreign Data Wrappers](https://wiki.postgresql.org/wiki/Foreign_data_wrappers). You need to implement the corresponding adaptation interface in the code.

## Installation

Prerequisites

- If the Main database of NocoBase is MySQL, it needs to activate `federated`. Refer to [How to enable the federated engine in MySQL](./enable-federated.md)

Then install and activate the plugin through the plugin manager

![Install and activate the plugin](https://static-docs.nocobase.com/f84276c5712851fb3ff33af3f1ff0f59.png)

## User Manual

Under "Collection manager > Create collection", select "Connect to foreign data"

![Connect External Data](https://static-docs.nocobase.com/029d946a6d067d1c35a39755219d623c.png)

In the "Database Server" dropdown, select an existing database service, or "Create Database Server"

![Database Service](https://static-docs.nocobase.com/766271708a911950a5599d60d6be4a4d.png)

Create a database server

![Create Database Service](https://static-docs.nocobase.com/1e357216e04cc4f200bd6212827281c8.png)

After selecting the database server, in the "Remote table" dropdown, select the data table you need to connect.

![Select the data table you need to connect](https://static-docs.nocobase.com/e91fd6152b52b4fc01b3808053cc8dc4.png)

Configure field information

![Configure field information](https://static-docs.nocobase.com/e618fecc5fe327f6a495e61405e5f040.png)

If the remote table has structural changes, you can also "Sync from remote table"

![Sync from Remote Table](https://static-docs.nocobase.com/3751a9a39f933889fb3fcc4d85a6f4ad.png)

Remote table sync

![Remote table sync](https://static-docs.nocobase.com/13f18200e31ea223fdd8dadaff1e9d28.png)

Finally, display it on the interface

![Display on the interface](https://static-docs.nocobase.com/368fca27a99277d9360ca81350949357.png)
