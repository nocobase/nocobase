---
title: "Main database"
description: "The NocoBase main database stores system and business data. It supports MySQL, PostgreSQL, MariaDB, KingbaseES, and OceanBase, table synchronization, and collection creation."
keywords: "main database,MySQL,PostgreSQL,MariaDB,KingbaseES,OceanBase,table synchronization,NocoBase"
---

# Main database

## Introduction

The database configured when [deploying NocoBase](/ai/install-nocobase-app) stores NocoBase system tables and can also store application business tables.

| Database | Supported version | Community | Standard | Professional | Enterprise |
| --- | --- | --- | --- | --- | --- |
| MySQL | >= 8.0.17 | Yes | Yes | Yes | Yes |
| PostgreSQL | >= 10 | Yes | Yes | Yes | Yes |
| MariaDB | >= 10.9 | Yes | Yes | Yes | Yes |
| KingbaseES | >= V9 | No | No | Yes | Yes |
| OceanBase | >= 4.3 | No | No | No | Yes |

:::tip Tip

KingbaseES supports only PostgreSQL compatibility mode. OceanBase supports only MySQL compatibility mode.

:::

## Plugin installation

| Database | Plugin | Installation |
| --- | --- | --- |
| MySQL | None | Built in; no separate installation is required. |
| PostgreSQL | None | Built in; no separate installation is required. |
| MariaDB | None | Built in; no separate installation is required. |
| KingbaseES | `@nocobase/plugin-data-source-kingbase` | Requires a commercial license and is enabled after installation. |
| OceanBase | `@nocobase/plugin-data-source-oceanbase` | Requires a commercial license and is enabled after installation. |

## Access the main data source

1. Open the **Data sources** menu.
2. Select **Main** in the data-source list and click **Configure** to manage the main database.

![Configure the main data source](https://static-docs.nocobase.com/configure_main_datasource.png)

## Main data-source management

The main database manages collections and fields. You can:

- **Filter**: search collections managed by the NocoBase main database.
- **Create collection**: add a business collection.
- **Edit**: change business collection metadata.
- **Delete**: delete a business collection.
- **Sync from database**: synchronize the structure of an existing database table.
- **Configure fields**: create, change, and delete collection fields.
- **+**: create, edit, and delete collection categories from the collection tabs.

![Main data source management](https://static-docs.nocobase.com/main_datasource_management.png)

### Synchronize existing tables from the database

![Synchronize existing tables](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

Synchronizing existing database tables lets you manage them in NocoBase without recreating them.

- **Protect existing investment**: use existing business tables directly.
- **Flexible integration**: bring in tables created by SQL scripts or database-management tools.
- **Gradual migration**: migrate an existing system to NocoBase step by step rather than refactoring everything at once.

With **Load from database**, you can:

1. Browse all tables in the database.
2. Select the tables to synchronize.
3. Identify table structures and field types automatically.
4. Import them into NocoBase for management.

### Supported collection types

![Collection types](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-47-14.png)

NocoBase supports creating and managing these collection types:

- **General collection**: includes commonly used system fields.
- **Inheritance collection**: derives child collections from a parent collection. Child collections inherit the parent structure and can define their own fields.
- **Tree collection**: a hierarchical collection that currently supports the adjacency-list design.
- **Calendar collection**: stores calendar-related event records.
- **File collection**: manages file storage.
- **SQL collection**: presents an SQL query result in a structured form; it is not a real database table.
- **Database view collection**: connects an existing database view.

### Collection categories

![Collection categories](https://static-docs.nocobase.com/20240322231520.png)

### Rich field types

![Field types](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-48-51.png)

#### Flexible field type conversion

NocoBase supports flexible Field interface conversion when the underlying database type is compatible.

For example, a database string field can be presented as:

- **Basic types**: Single line text, Multiline text, Phone, Email, URL, Password, Color, or Icon.
- **Choice types**: Select or Radio group.
- **Media types**: Markdown, Markdown (Vditor), Rich text, or Attachment URL.
- **Date and time types**: Date time with timezone or Date time without timezone.
- **Advanced types**: Sequence, Collection selector, or Encryption.

This conversion does not change the underlying database storage type. It lets you adjust presentation and interaction as business requirements change while preserving existing data.

### Field-level synchronization

NocoBase can synchronize fields individually as well as synchronize an entire collection.

![Field-level synchronization](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-49-56.png)

#### Field synchronization behavior

1. Synchronize newly added fields after the database schema changes.
2. Select only the fields you need rather than synchronizing every field.
3. Identify database field types and map them to NocoBase Field types automatically.
4. Preserve existing data during synchronization.

#### Use cases

- **Database schema evolution**: synchronize fields added for new business requirements.
- **Team collaboration**: synchronize fields added by another team member or DBA.
- **Hybrid management**: combine fields managed in NocoBase with fields managed by traditional database tools.

See [Collection fields](../data-modeling/collection-fields/index.md) for details.
