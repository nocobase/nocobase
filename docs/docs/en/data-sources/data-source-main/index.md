# Main DataBase

<PluginInfo name="data-source-main"></PluginInfo>

## Introduction

NocoBase's main database can be used to store both business data and the metadata of the application, including system table data and custom table data. The main database supports relational databases such as MySQL, PostgreSQL, etc. During the installation of the NocoBase application, the main database must be installed synchronously and cannot be deleted.

## Installation

This is a built-in plugin, no separate installation is required.

## User Manual

![20240322230134](https://static-docs.nocobase.com/20240322230134.png)

### Supporting the creation of various data tables

- [General collection](/data-sources/data-source-main/general-collection): built-in commonly used system fields;
- [Inheritance collection](/data-sources/data-source-main/inheritance-collection): allows the creation of a parent table, from which child tables can be derived. Child tables will inherit the structure of the parent table, and can also define their own columns.
- [Tree collection](/data-sources/collection-tree): tree-structured table, currently only supports adjacent table design;
- [Calendar collection](/data-sources/calendar/calendar-collection): for creating calendar-related event tables;
- [File collection](/data-sources/file-manager/file-collection): for managing file storage;
- : for dynamic expression scenarios in workflows;
- [SQL Collection](/data-sources/collection-sql): Not an actual database table, but quickly presenting the SQL query in a structured manner;
- [Database View collection](/data-sources/collection-view): connects to an existing database view;
- [FDW collection](/data-sources/collection-fdw): allows the database system to directly access and query data in external data sources, based on FDW technology;

### Supporting classification management of collections

![20240322231520](https://static-docs.nocobase.com/20240322231520.png)

### Offering a wide range of field types

![20240322230950](https://static-docs.nocobase.com/20240322230950.png)

See more in the [Data Table Fields / Overview](/data-sources/data-modeling/collection-fields) section.