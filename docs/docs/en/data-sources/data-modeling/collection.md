# Collection Overview

NocoBase provides a unique DSL to describe the structure of data, known as Collection, which unifies the data structure from various sources, providing a reliable foundation for data management, analysis, and application.


![20240512161522](https://static-docs.nocobase.com/20240512161522.png)


To conveniently use various data models, it supports various types of collections:

- [General collection](/data-sources/data-source-main/general-collection): Built-in common system fields;
- [Inheritance collection](/data-sources/data-source-main/inheritance-collection): You can create a parent collection and then derive a child collection from the parent collection. The child collection will inherit the structure of the parent collection and can also define its own columns.
- [Tree collection](/data-sources/collection-tree): Tree structure collection, currently only supports adjacency list design;
- [Calendar collection](/data-sources/calendar/calendar-collection): Used to create calendar-related event collections;
- [File collection](/data-sources/file-manager/file-collection): Used for file storage management;
- : Used for dynamic expression scenarios in workflows;
- [SQL collection](/data-sources/collection-sql): Not an actual database collection, but quickly presents SQL queries in a structured manner;
- [View collection](/data-sources/collection-view): Connects to existing database views;
- [External collection](/data-sources/collection-fdw): Allows the database system to directly access and query data in external data sources, based on FDW technology.