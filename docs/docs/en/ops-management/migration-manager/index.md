---
pkg: '@nocobase/plugin-migration-manager'
---

# Migration Manager

## Introduction

The Migration Manager helps you transfer application configurations from one environment to another. Its main focus is on migrating “application configurations.” If you need a complete data migration, we recommend using the “[Backup Manager](../backup-manager/index.mdx)” to back up and restore your entire application.

## Installation

The Migration Manager depends on the [Backup Manager](../backup-manager/index.mdx). Make sure that the Backup Manager plugin is already installed and activated.

## Process and Principles

The Migration Manager transfers tables and data from the primary database based on specified migration rules, moving them from one application instance to another. Note that it does not migrate data from external databases or sub-applications.


![20250102202546](https://static-docs.nocobase.com/20250102202546.png)


## Migration Rules

### Built-in Rules

Migration Manager can migrate all tables in the primary database and supports five built-in rules:

1.  **Schema-only**  
    Only migrates the structure (schema) of tables—no data is inserted or updated.

2.  **Overwrite (clear and re-insert)**  
    Deletes all existing records from the target database table, then inserts the new data.

3.  **Upsert (Insert or update)**  
    Checks whether each record exists (by primary key). If it does, it updates that record; if not, it inserts it.

4.  **Insert-ignore**  
    Inserts new records, but if a record already exists (by primary key), the insertion is ignored (no updates occur).

5.  **Skip**  
    Skips processing for the table entirely (no structure changes, no data migration).

**Additional notes:**

- "Overwrite," "Upsert," and "Insert-ignore" all synchronize table structure changes as well.
- If a table uses an auto-increment ID as its primary key, or if it has no primary key, neither "Upsert" nor "Insert-ignore" can be applied.
- "Upsert" and "Insert-ignore" rely on the primary key to determine whether the record already exists.

### Detailed Design


![20250102204909](https://static-docs.nocobase.com/20250102204909.png)


### Configuration Interface

Configure migration rules


![20250102205450](https://static-docs.nocobase.com/20250102205450.png)


Enable independent rules


![20250107105005](https://static-docs.nocobase.com/20250107105005.png)


Select independent rules and the tables to be processed by the current independent rules


![20250107104644](https://static-docs.nocobase.com/20250107104644.png)


## Migration Files


![20250102205844](https://static-docs.nocobase.com/20250102205844.png)


### Creating a New Migration


![20250102205857](https://static-docs.nocobase.com/20250102205857.png)


### Executing a Migration


![20250102205915](https://static-docs.nocobase.com/20250102205915.png)

Application environment variable check (learn more about [Environment Variables](../variables-and-secrets/index.md))

![20250102212311](https://static-docs.nocobase.com/20250102212311.png)

If the values of `DB_UNDERSCORED`, `USE_DB_SCHEMA_IN_SUBAPP`, `DB_TABLE_PREFIX`, `DB_SCHEMA`, or `COLLECTION_MANAGER_SCHEMA` in the .env file are inconsistent, a pop-up dialog will appear indicating that the migration cannot continue.

![918b8d56037681b29db8396ccad63364](https://static-docs.nocobase.com/918b8d56037681b29db8396ccad63364.png)

If any dynamically configured environment variables or secrets are missing, a pop-up will prompt the user to enter the required environment variables or secrets here, and then continue.

![93a4fcb44f92c43d827d57b7874f6ae6](https://static-docs.nocobase.com/93a4fcb44f92c43d827d57b7874f6ae6.png)

Application plugin check. If required plugins are missing in the current environment, a pop-up notification will appear. You can also choose to continue the migration anyway.

![bb5690a1e95660e1a5e0fd7440b6425c](https://static-docs.nocobase.com/bb5690a1e95660e1a5e0fd7440b6425c.png)

## Migration Logs

After the migration is completed, migration log files are saved on the server. You can view them online or download them.

![20251225184721](https://static-docs.nocobase.com/20251225184721.png)

When viewing the migration logs online, you can also download the SQL statements executed during the migration of the data schema.

![162cc81c3d47da0783018a61676584ae](https://static-docs.nocobase.com/162cc81c3d47da0783018a61676584ae.png)

Click the `Process` button to view the completed migration execution process.

![c065716cfbb7655f5826bf0ceae4b156](https://static-docs.nocobase.com/c065716cfbb7655f5826bf0ceae4b156.png)

![f4abe566de1186a9432174ce70b2f960](https://static-docs.nocobase.com/f4abe566de1186a9432174ce70b2f960.png)

## Rollback

Before any migration runs, the current application is automatically backed up. If the migration fails or the results are not as expected, you can roll back using the [Backup Manager](../backup-manager/index.mdx).


![5a55ed5f3dd072d74e51dcdc5ebea518](https://static-docs.nocobase.com/5a55ed5f3dd072d74e51dcdc5ebea518.png)
