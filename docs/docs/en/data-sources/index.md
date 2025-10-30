# Overview

Data modeling is a key step in designing databases, involving a deep analysis and abstraction process of various data and their relationships in the real world. In this process, we try to reveal the intrinsic connections between data and formalize them into data models, laying the foundation for the database structure of the information system. NocoBase is a data model-driven platform with the following features:

## Supports Access to Data from Various Sources

The data source of NocoBase can be common databases, API (SDK) platforms, and files.

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

NocoBase provides a [data source manager](/data-sources/data-source-manager) for managing various data sources and their data tables. The data source manager plugin only provides a management interface for all data sources and does not provide the ability to access data sources. It needs to be used in conjunction with various data source plugins. The currently supported data sources include:

- [Main Database](/data-sources/data-source-main): NocoBase's main database, supporting relational databases such as MySQL, PostgreSQL, SQLite, etc.
- [External MySQL](/data-sources/data-source-external-mysql): Use an external MySQL database as a data source.
- [External MariaDB](/data-sources/data-source-external-mariadb): Use an external MariaDB database as a data source.
- [External PostgreSQL](/data-sources/data-source-external-postgres): Use an external PostgreSQL database as a data source.

![20240512083651](https://static-docs.nocobase.com/20240512083651.png)

## Provides a Variety of Data Modeling Tools

**Simple data table management interface**: Used to create various models (data tables) or connect to existing models (data tables).

![20240512090751](https://static-docs.nocobase.com/20240512090751.png)

**Visual interface similar to ER diagrams**: Used to extract entities and their relationships from user and business requirements. It provides an intuitive and easy-to-understand way to describe data models. Through ER diagrams, you can more clearly understand the main data entities in the system and their relationships.

![20240512091042](https://static-docs.nocobase.com/20240410075906.png)

## Supports Various Types of  Data Tables

- [General collection](/data-sources/data-source-main/general-collection): Built-in common system fields;
- [Inheritance collection](/data-sources/data-source-main/inheritance-collection): You can create a parent collection and then derive a child collection from the parent collection. The child collection will inherit the structure of the parent collection and can also define its own columns.
- [Tree collection](/data-sources/collection-tree): Tree structure collection, currently only supports adjacency collection design;
- [Calendar Tabcollectionle](/data-sources/calendar/calendar-collection): Used to create calendar-related event collections;
- [File collection](/data-sources/file-manager/file-collection): Used for file storage management;
- : Used for dynamic expression scenarios in workflows;
- [SQL collection](/data-sources/collection-sql): Not an actual database collection, but quickly presents SQL queries in a structured manner;
- [Connect to database view](/data-sources/collection-view): Connects to existing database views;
- [Connect to foreign data](/data-sources/collection-fdw): Allows the database system to directly access and query data in external data sources, based on FDW technology.

![20240512102212](https://static-docs.nocobase.com/20240512102212.png)

For more content, see the "[Collection / Overview](/data-sources/data-modeling/collection)" section.

## Provides a Rich Variety of Field Types

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

For more content, see the "[Collection Fields / Overview](/data-sources/data-modeling/collection-fields)" section.