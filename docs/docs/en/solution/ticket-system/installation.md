# How to Install

> The current version uses **backup and restoration** for deployment. In future versions, we may switch to **incremental migration** to facilitate the integration of the solution into your existing systems.

To ensure you can deploy the ticketing solution to your own NocoBase environment quickly and smoothly, we provide two restoration methods. Please choose the one that best suits your user version and technical background.

Before you begin, please ensure:

- You already have a basic NocoBase running environment. For main system installation, please refer to the detailed [official installation documentation](https://docs.nocobase.com/welcome/getting-started/installation).
- NocoBase version **2.0.0-beta.5 and above**.
- You have downloaded the corresponding files for the ticketing system:
  - **Backup file**: [nocobase_tickets_v2_backup_260324.nbdata](https://static-docs.nocobase.com/nocobase_tickets_v2_backup_260324.nbdata) - For Method 1
  - **SQL file**: [nocobase_tickets_v2_sql_260324.zip](https://static-docs.nocobase.com/nocobase_tickets_v2_sql_260324.zip) - For Method 2

**Important Notes**:
- This solution is built on **PostgreSQL 16**. Please ensure your environment uses PostgreSQL 16.
- **DB_UNDERSCORED cannot be true**: Please check your `docker-compose.yml` file and ensure the `DB_UNDERSCORED` environment variable is not set to `true`, otherwise it will conflict with the solution backup and cause restoration failure.

---

## Method 1: Restore Using Backup Manager (Recommended for Pro/Enterprise Users)

This method uses the built-in "[Backup Manager](https://docs.nocobase.com/handbook/backups)" (Pro/Enterprise) plugin for one-click restoration, which is the simplest operation. However, it has certain requirements for the environment and user version.

### Core Features

* **Advantages**:
  1. **Convenient Operation**: Can be completed via the UI, allowing for full restoration of all configurations, including plugins.
  2. **Complete Restoration**: **Able to restore all system files**, including print templates, files uploaded to attachment fields, etc., ensuring full functionality.
* **Limitations**:
  1. **Pro/Enterprise Only**: "Backup Manager" is an enterprise-level plugin, available only to Pro/Enterprise users.
  2. **Strict Environment Requirements**: Requires your database environment (version, case sensitivity, etc.) to be highly compatible with the environment where the backup was created.
  3. **Plugin Dependencies**: If the solution includes commercial plugins not present in your local environment, the restoration will fail.

### Steps

**Step 1: [Strongly Recommended] Start the application using the `full` image**

To avoid restoration failures due to missing database clients, we strongly recommend using the `full` version of the Docker image. It includes all necessary supporting programs, eliminating the need for additional configuration.

Example command to pull the image:

```bash
docker pull nocobase/nocobase:beta-full
```

Then use this image to start your NocoBase service.

> **Note**: If you do not use the `full` image, you may need to manually install the `pg_dump` database client inside the container, which is cumbersome and unstable.

**Step 2: Enable the "Backup Manager" plugin**

1. Log in to your NocoBase system.
2. Go to **`Plugin Management`**.
3. Find and enable the **`Backup Manager`** plugin.

**Step 3: Restore from local backup file**

1. After enabling the plugin, refresh the page.
2. Go to **`System Management`** -> **`Backup Manager`** in the left menu.
3. Click the **`Restore from local backup`** button in the upper right corner.
4. Drag the downloaded backup file to the upload area.
5. Click **`Submit`** and wait for the system to complete the restoration. This process may take from several seconds to a few minutes.

### Notes

* **Database Compatibility**: This is the most critical point for this method. Your PostgreSQL database **version, character set, and case sensitivity settings** must match the backup source file. In particular, the `schema` name must be consistent.
* **Commercial Plugin Matching**: Please ensure you have and have enabled all commercial plugins required by the solution, otherwise the restoration will be interrupted.

---

## Method 2: Direct SQL File Import (Universal, More Suitable for Community Edition)

This method restores data by directly operating the database, bypassing the "Backup Manager" plugin, and therefore has no Pro/Enterprise plugin restrictions.

### Core Features

* **Advantages**:
  1. **No Version Restrictions**: Applicable to all NocoBase users, including the Community Edition.
  2. **High Compatibility**: Does not depend on the application's `dump` tool; it works as long as you can connect to the database.
  3. **High Fault Tolerance**: If the solution contains commercial plugins you do not have, the related features will not be enabled, but this will not affect other functions, and the application can start successfully.
* **Limitations**:
  1. **Requires Database Operation Skills**: Users need basic database operation skills, such as how to execute a `.sql` file.
  2. **System Files Lost**: **This method will lose all system files**, including print templates, files uploaded to attachment fields, etc.

### Steps

**Step 1: Prepare a clean database**

Prepare a brand new, empty database for the data you are about to import.

**Step 2: Import the `.sql` file into the database**

Get the downloaded database file (usually in `.sql` format) and import its contents into the database prepared in the previous step. There are several ways to do this, depending on your environment:

* **Option A: Via server command line (Docker example)**
  If you use Docker to install NocoBase and the database, you can upload the `.sql` file to the server and use the `docker exec` command to perform the import. Assuming your PostgreSQL container is named `my-nocobase-db` and the file is named `ticket_system.sql`:

  ```bash
  # Copy the sql file into the container
  docker cp ticket_system.sql my-nocobase-db:/tmp/
  # Enter the container and execute the import command
  docker exec -it my-nocobase-db psql -U your_username -d your_database_name -f /tmp/ticket_system.sql
  ```
* **Option B: Via remote database client**
  If your database port is exposed, you can use any graphical database client (such as DBeaver, Navicat, pgAdmin, etc.) to connect to the database, open a new query window, paste the entire contents of the `.sql` file, and execute it.

**Step 3: Connect to the database and start the application**

Configure your NocoBase startup parameters (such as environment variables `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, etc.) to point to the database where you just imported the data. Then, start the NocoBase service normally.

### Notes

* **Database Permissions**: This method requires an account and password with permissions to directly operate the database.
* **Plugin Status**: After a successful import, although the commercial plugin data exists in the system, if you have not installed and enabled the corresponding plugins locally, the related features will not be displayed or usable, but this will not cause the application to crash.

---

## Summary and Comparison

| Feature | Method 1: Backup Manager | Method 2: Direct SQL Import |
| :-------------- | :--------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **Target Users** | **Pro/Enterprise** users | **All users** (including Community Edition) |
| **Ease of Use** | ⭐⭐⭐⭐⭐ (Very simple, UI operation) | ⭐⭐⭐ (Requires basic database knowledge) |
| **Environment Requirements** | **Strict**, database and system versions must be highly compatible | **General**, requires database compatibility |
| **Plugin Dependencies** | **Strong dependency**, plugins are verified during restoration; missing any plugin will cause **restoration failure**. | **Features depend on plugins**. Data can be imported independently, and the system will have basic functionality. However, if corresponding plugins are missing, related features will be **completely unusable**. |
| **System Files** | **Fully preserved** (print templates, uploaded files, etc.) | **Will be lost** (print templates, uploaded files, etc.) |
| **Recommended Scenarios** | Enterprise users with a controlled, consistent environment who need complete functionality | Missing some plugins, seeking high compatibility and flexibility, non-Pro/Enterprise users, can accept the loss of file-related functions |

We hope this tutorial helps you successfully deploy the ticketing system. If you encounter any issues during the process, please feel free to contact us!
---

*Last updated: 2026-03-24*
