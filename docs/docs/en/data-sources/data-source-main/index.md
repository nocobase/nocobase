# Main DataBase

<PluginInfo name="data-source-main"></PluginInfo>

## Introduction

NocoBase's main database can be used to store both business data and the metadata of the application, including system table data and custom table data. The main database supports relational databases such as MySQL, PostgreSQL, etc. During the installation of the NocoBase application, the main database must be installed synchronously and cannot be deleted.

## Installation

This is a built-in plugin, no separate installation is required.

## Data Table Management

The main data source provides comprehensive data table management capabilities. You can both create new tables through NocoBase and synchronize existing table structures from the database.

![20240322230134](https://static-docs.nocobase.com/20240322230134.png)

### Synchronizing Existing Tables from Database

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

One important feature of the main data source is the ability to synchronize existing tables from the database into NocoBase for management. This means:

- **Protecting Existing Investments**: If your database already has numerous business tables, no need to recreate them - you can directly synchronize and use them
- **Flexible Integration**: Tables created through other tools (such as SQL scripts, database management tools, etc.) can be brought under NocoBase management
- **Progressive Migration**: Support gradual migration of existing systems to NocoBase, rather than complete restructuring

Through the "Load from database" feature, you can:
1. Browse all tables in the database
2. Select tables to synchronize
3. Automatically recognize table structures and field types
4. Import into NocoBase with one click for management

### Supporting Multiple Table Structure Types

![nocobase_doc-2025-10-29-19-47-14](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-47-14.png)

NocoBase supports creating and managing various types of data tables:
- [General collection](/handbook/data-source-main/general-collection): built-in commonly used system fields;
- [Inheritance collection](/handbook/data-source-main/inheritance-collection): allows the creation of a parent table, from which child tables can be derived. Child tables will inherit the structure of the parent table, and can also define their own columns.
- [Tree collection](/handbook/collection-tree): tree-structured table, currently only supports adjacent table design;
- [Calendar collection](/handbook/calendar/calendar-collection): for creating calendar-related event tables;
- [File collection](/handbook/file-manager/file-collection): for managing file storage;
- [Expression Collection](/handbook/workflow-dynamic-calculation/expression): for dynamic expression scenarios in workflows;
- [SQL Collection](/handbook/collection-sql): Not an actual database table, but quickly presenting the SQL query in a structured manner;
- [Database View collection](/handbook/collection-view): connects to an existing database view;
- [FDW collection](/handbook/collection-fdw): allows the database system to directly access and query data in external data sources, based on FDW technology;

### Supporting Classification Management of Collections

![20240322231520](https://static-docs.nocobase.com/20240322231520.png)

### Offering a Wide Range of Field Types

![nocobase_doc-2025-10-29-19-48-51](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-48-51.png)

#### Flexible Field Type Conversion

NocoBase supports flexible field type conversion based on the same database type.

**Example: String Type Field Conversion Options**

When a field in the database is of String type, it can be converted to any of the following forms in NocoBase:

- **Basic Types**: Single line text, Long text, Phone, Email, URL, Password, Color, Icon
- **Choice Types**: Single select, Radio group
- **Media Types**: Markdown, Markdown (Vditor), Rich Text, Attachment (URL)
- **Date & Time Types**: Datetime (with time zone), Datetime (without time zone)
- **Advanced Types**: Sequence, Collection selector, Encryption

This flexible conversion mechanism means:
- **No Database Structure Modification Required**: The underlying storage type of the field remains unchanged, only its representation in NocoBase changes
- **Adapts to Business Changes**: As business requirements evolve, you can quickly adjust how fields are displayed and interacted with
- **Data Safety**: The conversion process does not affect the integrity of existing data

### Flexible Field-Level Synchronization

NocoBase not only can synchronize entire tables, but also supports fine-grained field-level synchronization management:

![nocobase_doc-2025-10-29-19-49-56](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-49-56.png)

#### Field Synchronization Features:

1. **Real-time Synchronization**: When database table structures change, you can synchronize newly added fields at any time
2. **Selective Synchronization**: Choose to synchronize only the fields you need, not all fields
3. **Automatic Type Recognition**: Automatically recognizes database field types and maps them to NocoBase field types
4. **Data Integrity Preservation**: The synchronization process does not affect existing data

#### Use Cases:

- **Database Structure Evolution**: When business requirements change and new fields need to be added to the database, they can be quickly synchronized to NocoBase
- **Team Collaboration**: When other team members or DBAs add fields to the database, they can be synchronized in time
- **Hybrid Management Mode**: Some fields are managed through NocoBase, some through traditional methods, flexibly combined

This flexible synchronization mechanism allows NocoBase to integrate seamlessly into existing technical architectures. There's no need to change existing database management practices, while still enjoying the convenience of low-code development that NocoBase provides.

See more in the [Data Table Fields / Overview](/handbook/data-modeling/collection-fields) section.