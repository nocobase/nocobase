# Installation Guide

> The current version is deployed via **backup restoration**. In future versions, we may switch to **incremental migration** to make it easier to integrate the solution into your existing system.

To help you deploy the CRM 2.0 solution smoothly to your own NocoBase environment, we provide two restoration methods. Choose the one that best suits your edition and technical background.

Before you begin, please ensure:

- You have a basic NocoBase running environment. See the [official installation guide](https://docs-cn.nocobase.com/welcome/getting-started/installation) for details.
- NocoBase version **v2.1.0-beta.2 or above**
- You have downloaded the CRM system files:
  - **Backup file**: [nocobase_crm_v2_backup_260223.nbdata](https://static-docs.nocobase.com/nocobase_crm_v2_backup_260223.nbdata) — for Method 1
  - **SQL file**: [nocobase_crm_v2_sql_260223.zip](https://static-docs.nocobase.com/nocobase_crm_v2_sql_260223.zip) — for Method 2

**Important notes**:
- This solution is built on **PostgreSQL 16**. Ensure your environment uses PostgreSQL 16.
- **DB_UNDERSCORED must not be true**: Check your `docker-compose.yml` and ensure `DB_UNDERSCORED` is not set to `true`, otherwise the restoration will fail.

---

## Method 1: Restore Using Backup Manager (Recommended for Pro/Enterprise Users)

This method uses NocoBase's built-in "[Backup Manager](https://docs-cn.nocobase.com/handbook/backups)" (Pro/Enterprise) plugin for one-click restoration. It is the simplest option but has some environment and edition requirements.

### Key Characteristics

* **Advantages**:
  1. **Easy to operate**: Fully UI-based, restores all configuration including plugins.
  2. **Complete restoration**: **Restores all system files**, including print template files and files uploaded to file fields in tables.
* **Limitations**:
  1. **Pro/Enterprise only**: "Backup Manager" is an enterprise plugin, available only to Pro/Enterprise users.
  2. **Strict environment requirements**: Your database environment (version, case sensitivity settings, etc.) must be highly compatible with the environment used to create the backup.
  3. **Plugin dependency**: If the solution includes commercial plugins not available in your environment, the restoration will fail.

### Steps

**Step 1: (Strongly recommended) Start the application with the `full` image**

To avoid restoration failures due to a missing database client, we strongly recommend using the `full` Docker image, which bundles all required tools.

```bash
docker pull nocobase/nocobase:beta-full
```

Then start your NocoBase service using this image.

> **Note**: Without the `full` image, you may need to manually install the `pg_dump` client inside the container, which is error-prone.

**Step 2: Enable the "Backup Manager" plugin**

1. Log in to your NocoBase system.
2. Go to **`Plugin Management`**.
3. Find and enable the **`Backup Manager`** plugin.

**Step 3: Restore from local backup file**

1. After enabling the plugin, refresh the page.
2. Go to **`System Management`** -> **`Backup Manager`** in the left menu.
3. Click the **`Restore from Local Backup`** button in the upper right corner.
4. Drag the downloaded backup file to the upload area.
5. Click **`Submit`** and wait for the restoration to complete. This may take anywhere from a few seconds to a few minutes.

### Notes

* **Database compatibility**: This is the most critical point. Your PostgreSQL database **version, character set, and case sensitivity settings** must match those of the backup source. In particular, the `schema` name must be consistent.
* **Commercial plugin matching**: Ensure you have enabled all commercial plugins required by the solution, otherwise the restoration will be interrupted.

---

## Method 2: Direct SQL File Import (Universal, Better for Community Edition)

This method restores data by directly operating the database, bypassing the Backup Manager plugin — no Pro/Enterprise edition required.

### Key Characteristics

* **Advantages**:
  1. **No edition restriction**: Works for all NocoBase users, including Community Edition.
  2. **High compatibility**: Does not depend on the in-app `dump` tool — as long as you can connect to the database, you can operate.
  3. **Fault-tolerant**: If the solution includes commercial plugins you don't have, related features won't be enabled but won't prevent the app from starting.
* **Limitations**:
  1. **Requires basic database knowledge**: You need to know how to execute a `.sql` file against a database.
  2. **System files are lost**: **All system files will be missing**, including print templates and files uploaded to file fields.

### Steps

**Step 1: Prepare a clean database**

Create a brand new, empty database for the data you're about to import.

**Step 2: Import the `.sql` file into the database**

* **Option A: Via server command line (Docker example)**

  ```bash
  # Copy the sql file into the container
  docker cp nocobase_crm_v2_sql_260223.sql my-nocobase-db:/tmp/
  # Enter the container and execute the import
  docker exec -it my-nocobase-db psql -U nocobase -d nocobase -f /tmp/nocobase_crm_v2_sql_260223.sql
  ```

* **Option B: Via a remote database client (Navicat, etc.)**

  Connect to the database using any GUI client (Navicat, DBeaver, pgAdmin, etc.), then:
  1. Right-click the target database
  2. Select "Run SQL File" or "Execute SQL Script"
  3. Select the downloaded `.sql` file and execute

**Step 3: Connect to the database and start the application**

Configure your NocoBase startup parameters (e.g., `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`) to point to the database you just imported. Then start the NocoBase service normally.

### Notes

* **Database permissions**: This method requires credentials with direct database access.
* **Plugin status**: After a successful import, data for commercial plugins exists in the system, but if the corresponding plugin is not installed and enabled locally, related features will not be visible or usable — this will not cause the application to crash.

---

## Summary & Comparison

| Feature | Method 1: Backup Manager | Method 2: Direct SQL Import |
| :------ | :----------------------- | :--------------------------- |
| **Applicable users** | **Pro/Enterprise** users | **All users** (including Community Edition) |
| **Ease of use** | ⭐⭐⭐⭐⭐ (very simple, UI-based) | ⭐⭐⭐ (requires basic database knowledge) |
| **Environment requirements** | **Strict** — database and system versions must be highly compatible | **Moderate** — requires database compatibility |
| **Plugin dependency** | **Strong** — any missing plugin causes restoration failure | **Feature-dependent** — data imports independently; missing plugins disable related features but won't crash the app |
| **System files** | **Fully preserved** (print templates, uploaded files, etc.) | **Lost** (print templates, uploaded files, etc.) |
| **Recommended for** | Enterprise users with a controlled, consistent environment needing full functionality | Missing some plugins, prioritizing compatibility and flexibility, or Community Edition users who can accept missing file features |

We hope this guide helps you deploy CRM 2.0 successfully. If you run into any issues, feel free to reach out!
