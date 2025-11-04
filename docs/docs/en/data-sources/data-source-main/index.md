---
pkg: "@nocobase/plugin-data-source-main"
---

# Main Database

## Introduction

NocoBase's main database can be used to store both business data and the application's metadata, including system table data and custom table data. The main database supports relational databases such as MySQL and PostgreSQL. During the installation of the NocoBase application, the main database must be installed synchronously and cannot be deleted.

## Installation

This is a built-in plugin, so no separate installation is required.

## Collection Management

The main data source provides full collection management capabilities. You can create new tables through NocoBase or synchronize existing table structures from your database.

![20240322230134](https://static-docs.nocobase.com/20240322230134.png)

### Syncing Existing Tables from Database

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

An important feature of the main data source is the ability to sync existing tables from the database into NocoBase for management. This means:

- **Protect Existing Investments**: If your database already contains many business tables, there’s no need to recreate them — simply sync and use them directly.
- **Flexible Integration**: Tables created through other tools (such as SQL scripts or database management tools) can also be managed in NocoBase.
- **Progressive Migration**: Supports gradually migrating existing systems to NocoBase, rather than refactoring all at once.

Through the "Load from Database" feature, you can:
1. Browse all tables in the database
2. Select the tables you need to sync
3. Automatically identify table structures and field types
4. Import them into NocoBase for management with one click

### Support for Multiple Collection Types

![nocobase_doc-2025-10-29-19-47-14](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-47-14.png)

NocoBase supports creating and managing various types of collections:
- **General collection**: built-in commonly used system fields
- **Inheritance collection**: allows creation of a parent table from which child tables can be derived. Child tables inherit the parent table's structure and can define their own columns
- **Tree collection**: tree-structured table, currently only supports adjacency list design
- **Calendar collection**: for creating calendar-related event tables
- **File collection**: for managing file storage
- **Expression collection**: for dynamic expression scenarios in workflows
- **SQL Collection**: not an actual database table, but quickly presents SQL queries in a structured manner
- **Database View collection**: connects to existing database views
- **FDW collection**: allows the database system to directly access and query data in external data sources, based on FDW technology

### Supporting Classification Management of Collections

![20240322231520](https://static-docs.nocobase.com/20240322231520.png)

### Provides a Rich Variety of Field Types

![nocobase_doc-2025-10-29-19-48-51](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-48-51.png)

#### Flexible Field Type Conversion

NocoBase supports flexible field type conversion within the same database type.

**Example: String Field Conversion Options**

When a field in the database is of String type, it can be converted in NocoBase to any of the following:

- **Basic**: Single line text, Long text, Phone, Email, URL, Password, Color, Icon  
- **Choice**: Dropdown (single select), Radio group  
- **Media**: Markdown, Markdown (Vditor), Rich Text, Attachment (URL)  
- **Date & Time**: Datetime (with timezone), Datetime (without timezone)  
- **Advanced**: Auto sequence, Collection selector, Encryption  

This flexible conversion mechanism means:  
- **No database structure modification required**: The field’s underlying storage type remains unchanged — only its presentation in NocoBase changes.  
- **Adaptable to business changes**: As business needs evolve, you can quickly adjust how fields are displayed or interacted with.  
- **Data integrity ensured**: The conversion process does not affect existing data integrity.  

### Flexible Field-Level Synchronization

NocoBase supports not only full table synchronization but also fine-grained field-level synchronization management.

![nocobase_doc-2025-10-29-19-49-56](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-49-56.png)

#### Field Synchronization Features

1. **Real-time synchronization**: When database structures change, newly added fields can be synced anytime.  
2. **Selective synchronization**: Sync only the fields you need instead of all fields.  
3. **Automatic type recognition**: Automatically identifies field types and maps them to NocoBase types.  
4. **Data integrity preservation**: Syncing does not affect existing data.  

#### Use Cases

- **Database schema evolution**: When business requirements change, newly added fields can be synced quickly into NocoBase.  
- **Team collaboration**: If DBAs or team members add fields directly in the database, they can be synced promptly.  
- **Hybrid management model**: Combine management through NocoBase and traditional methods as needed.  

This flexible synchronization mechanism allows NocoBase to integrate smoothly into existing technical architectures without altering existing database management workflows, while still benefiting from NocoBase’s low-code convenience.

For more details, see [Collection Fields / Overview](/data-sources/data-modeling/collection-fields).