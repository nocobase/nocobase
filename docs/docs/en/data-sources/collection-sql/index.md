---
pkg: "@nocobase/plugin-collection-sql"
---

# SQL Collection

## Introduction

The SQL collection provides a powerful method for retrieving data using SQL queries. By extracting data fields through SQL queries and configuring the associated field metadata, users can utilize these fields as though they were working with a standard collection. This feature is particularly useful for scenarios involving complex join queries, statistical analysis, and more.

## User Manual

### Creating a New SQL Collection

<img src="https://static-docs.nocobase.com/202405191452918.png"/>

1. Enter your SQL query in the input box and click **Execute**. The system will analyze the query to identify the tables and fields involved, automatically extracting the corresponding field metadata from the source tables.

<img src="https://static-docs.nocobase.com/202405191453556.png"/>

2. If the system’s analysis of the source tables and fields is incorrect, you can manually select the correct tables and fields to use the proper metadata. You must first select the source table before selecting its fields in the “Field Source” section.

<img src="https://static-docs.nocobase.com/202405191453579.png"/>

3. For fields that do not have corresponding source fields, the system will infer their types based on data type. If the inferred type is incorrect, you can manually adjust the field type.

<img src="https://static-docs.nocobase.com/202405191454703.png"/>

4. As you configure the fields, you can preview their display results in the preview area.

<img src="https://static-docs.nocobase.com/202405191455439.png"/>

5. Once configuration is complete and verified, click the **Confirm** button below the SQL input box to submit your setup.

<img src="https://static-docs.nocobase.com/202405191455302.png"/>

### Editing

1. When the SQL query changes, click **Edit** to modify the SQL statement and reconfigure the fields.
2. To modify field metadata, select **Configure Fields** and adjust settings just like a regular collection.

### Synchronization

If the SQL query remains the same but the underlying database table structure has changed, you can synchronize and update field configurations by selecting **Configure Fields → Sync from Database**.

<img src="https://static-docs.nocobase.com/202405191456216.png"/>

### SQL Collection vs. Linked Database Views

| Template Type | Best Suited For | Implementation Method | Support for CRUD Operations |
| :--- | :--- | :--- | :--- |
| SQL | Simple models, lightweight use cases<br />Limited interaction with the database<br />Avoiding maintenance of views<br />Prefer UI-driven operations | SQL subquery | Not Supported |
| Connect to Database View | Complex models<br />Requires database interaction<br />Data modification needed<br />Requires stronger and more stable database support | Database view | Partially Supported |

:::warning
When using an SQL collection, ensure that the tables you query are managed within NocoBase. If you query other tables in the same database that are not connected to NocoBase, SQL parsing errors may occur. If necessary, consider creating and linking to a database view instead.
:::