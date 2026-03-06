---
pkg: '@nocobase/plugin-migration-manager'
---

# Migration Manager

## Introduction

The Migration Manager helps you transfer application configurations from one environment (e.g., Staging) to another (e.g., PROD). Its main focus is on migrating "application configurations." 

**Key Difference:**
- **Migration Manager:** Best for moving specific configurations or table structures between environments.
- **[Backup Manager](../backup-manager/index.mdx):** Best for a complete data migration or full system backup/restore.

## Installation

The Migration Manager depends on the [Backup Manager](../backup-manager/index.mdx). Make sure that the Backup Manager plugin is already installed and activated.

## Process and Principles

The Migration Manager transfers tables and data from the primary database based on specified migration rules. Note that it does not migrate data from external databases or sub-applications.

![20250102202546](https://static-docs.nocobase.com/20250102202546.png)

## Migration Rules

### Built-in Rules

Migration Manager supports five built-in rules:

1.  **Schema-only:** Only migrates the structure—no data is moved.
2.  **Overwrite:** Deletes target table records, then inserts new data.
3.  **Upsert:** Updates existing records (by primary key) or inserts new ones.
4.  **Insert-ignore:** Inserts new records; skips existing ones.
5.  **Skip:** No changes to the table.

**Additional notes:**
- "Overwrite," "Upsert," and "Insert-ignore" all synchronize table structure changes.
- Tables with auto-increment IDs or no primary keys do not support "Upsert" or "Insert-ignore."

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

#### Environment Variable Check

Application environment variable check (learn more about [Environment Variables](../variables-and-secrets/index.md))

![20250102212311](https://static-docs.nocobase.com/20250102212311.png)

If the values of `DB_UNDERSCORED`, `USE_DB_SCHEMA_IN_SUBAPP`, `DB_TABLE_PREFIX`, `DB_SCHEMA`, or `COLLECTION_MANAGER_SCHEMA` in the .env file are inconsistent, a pop-up dialog will appear indicating that the migration cannot continue.

![918b8d56037681b29db8396ccad63364](https://static-docs.nocobase.com/918b8d56037681b29db8396ccad63364.png)

If any dynamically configured environment variables or secrets are missing, a pop-up will prompt the user to enter the required environment variables or secrets here, and then continue.

![93a4fcb44f92c43d827d57b7874f6ae6](https://static-docs.nocobase.com/93a4fcb44f92c43d827d57b7874f6ae6.png)

#### Plugin Check

Application plugin check. If required plugins are missing in the current environment, a pop-up notification will appear. You can also choose to continue the migration anyway.

![bb5690a1e95660e1a5e0fd7440b6425c](https://static-docs.nocobase.com/bb5690a1e95660e1a5e0fd7440b6425c.png)

## Migration Logs & Storage

After the migration is completed, migration log files are saved on the server. You can view them online or download them.

![20251225184721](https://static-docs.nocobase.com/20251225184721.png)

When viewing the migration logs online, you can also download the SQL statements executed during the migration of the data schema.

![20251227164116](https://static-docs.nocobase.com/20251227164116.png)

Click the `Process` button to view the completed migration execution process.

![c065716cfbb7655f5826bf0aeae4b156](https://static-docs.nocobase.com/c065716cfbb7655f5826bf0aeae4b156.png)

![f4abe566de1186a9432174ce70b2f960](https://static-docs.nocobase.com/f4abe566de1186a9432174ce70b2f960.png)

### Handling the `storage` Folder

The Migration Manager primarily handles database records. Some data in the `storage` folder (like `logs`, `backup history`, or `request logs`) are not automatically moved.
- If you need these files in a new environment, you must **manually copy** the relevant folders within the `storage` directory.

## Rollback

Before any migration runs, the system creates an automatic backup. 

### Rollback Principles

1.  **Stop Service:** Prevent further data writes before starting a rollback.
2.  **Version Alignment:** The NocoBase core version (Docker image) MUST match the version that generated the backup file.
3.  **Clean State Recovery:** If the current database or storage is corrupted, simply reverting the version is insufficient. You must **restore the backup into a fresh application instance** (new database and storage) using the correct core version.

### Rollback Workflow

#### Scenario A: Migration Task Failure
If the migration fails but the core version remains the same, use the [Backup Manager](../backup-manager/index.mdx) to restore the automatic backup created right before the migration.

#### Scenario B: System Corruption or Core Upgrade Failure
If you need to revert to a stable state after an upgrade or corruption:
1.  **Stop Application:** Stop the current containers.
2.  **Prepare New Environment:** Set up a fresh instance with an empty database and storage.
3.  **Deploy Target Version:** Use the Docker image tag used *at the time of the backup*.
4.  **Restore Backup:** Execute the restoration via the [Backup Manager](../backup-manager/index.mdx) into this clean environment.
5.  **Switch Traffic:** Update your gateway/load balancer to point to the new, restored environment.

![20251227164004](https://static-docs.nocobase.com/20251227164004.png)

## Best Practices

### Recommended Deployment Workflow (Blue-Green Switch)

To ensure zero or minimal downtime and the highest safety, use a two-environment approach:

1.  **Preparation (Staging):** Create a migration file in your staging environment.
2.  **Safety Backup (PROD-A):** Create a full backup of your current production environment.
3.  **Parallel Deployment (PROD-B):** Deploy a *new, empty* application instance (PROD-B) using the target core version and the same environment variables.
4.  **Restore & Migrate:**
    *   Restore the backup from PROD-A into PROD-B.
    *   Execute the migration file from Staging into PROD-B.
5.  **Verification:** Test PROD-B thoroughly while PROD-A is still serving users.
6.  **Traffic Switch:** Update your Nginx/Gateway to point traffic from PROD-A to PROD-B. 
    *   *If issues occur, you can instantly switch traffic back to PROD-A.*

### Data Consistency & Downtime

NocoBase currently does not support zero-downtime migrations. To avoid data modification during the backup and migration process:
- **Shut down the Gateway/App:** It is highly recommended to stop user access before starting. You should configure your gateway (e.g., Nginx) to return a **503 Maintenance Page** during this period to inform users and prevent any incoming data writes.
- **Manual Data Sync:** If users continue to generate data in the old version during migration, that data must be migrated manually.
