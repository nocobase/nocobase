# Installation Guide

> The current version uses **backup restoration** for deployment. In future versions, we may switch to **incremental migration** to make it easier to integrate the solution into your existing system.

To help you quickly and smoothly deploy the Ticketing Solution to your own NocoBase environment, we provide two restoration methods. Please choose the one that best suits your user version and technical background.

Before you begin, please ensure:

- You already have a basic NocoBase running environment. For main system installation, please refer to the detailed [official installation documentation](https://docs-cn.nocobase.com/welcome/getting-started/installation).
- NocoBase version **2.0.0-beta.5 or above**
- You have downloaded the corresponding files for the Ticketing System:
  - **Backup file**: [nocobase_tts_alpha_backup_260107_01.nbdata](https://static-docs.nocobase.com/nocobase_tts_alpha_backup_260107_01.nbdata) - For Method 1
  - **SQL file**: [nocobase_tts_alpha_sql_inserts_260107_01.zip](https://static-docs.nocobase.com/nocobase_tts_alpha_sql_inserts_260107_01.zip) - For Method 2

**Important Notes**:
- This solution is built on **PostgreSQL 16** database. Please ensure your environment uses PostgreSQL 16.
- **DB_UNDERSCORED must not be true**: Please check your `docker-compose.yml` file and ensure the `DB_UNDERSCORED` environment variable is not set to `true`, otherwise it will conflict with the solution backup and cause restoration failure.

---

## Method 1: Restore Using Backup Manager (Recommended for Pro/Enterprise Users)

This method uses NocoBase's built-in "[Backup Manager](https://docs-cn.nocobase.com/handbook/backups)" (Pro/Enterprise) plugin for one-click restoration, which is the simplest operation. However, it has certain requirements for environment and user version.

### Key Features

* **Advantages**:
  1. **Easy Operation**: Can be completed through the UI interface, with complete restoration of all configurations including plugins.
  2. **Complete Restoration**: **Can restore all system files**, including print template files, files uploaded to file fields in tables, ensuring complete functionality.
* **Limitations**:
  1. **Pro/Enterprise Only**: "Backup Manager" is an enterprise plugin, available only to Pro/Enterprise users.
  2. **Strict Environment Requirements**: Requires your database environment (version, case sensitivity settings, etc.) to be highly compatible with our backup creation environment.
  3. **Plugin Dependencies**: If the solution contains commercial plugins not present in your local environment, restoration will fail.

### Steps

**Step 1: [Strongly Recommended] Start the application using the `full` image**

To avoid restoration failures due to missing database clients, we strongly recommend using the `full` version of the Docker image. It includes all necessary supporting programs, eliminating the need for additional configuration.

Example command to pull the image:

```bash
docker pull nocobase/nocobase:beta-full
```

Then use this image to start your NocoBase service.

> **Note**: If you don't use the `full` image, you may need to manually install the `pg_dump` database client inside the container, which is cumbersome and unstable.

**Step 2: Enable the "Backup Manager" plugin**

1. Log in to your NocoBase system.
2. Go to **`Plugin Management`**.
3. Find and enable the **`Backup Manager`** plugin.

**Step 3: Restore from local backup file**

1. After enabling the plugin, refresh the page.
2. Go to **`System Management`** -> **`Backup Manager`** in the left menu.
3. Click the **`Restore from Local Backup`** button in the upper right corner.
4. Drag the downloaded backup file to the upload area.
5. Click **`Submit`** and wait patiently for the system to complete the restoration, which may take from a few seconds to a few minutes.

### Notes

* **Database Compatibility**: This is the most critical point for this method. Your PostgreSQL database **version, character set, and case sensitivity settings** must match the backup source file. In particular, the `schema` name must be consistent.
* **Commercial Plugin Matching**: Please ensure you have and have enabled all commercial plugins required by the solution, otherwise restoration will be interrupted.

---

## Method 2: Direct SQL File Import (Universal, More Suitable for Community Edition)

This method restores data by directly operating the database, bypassing the "Backup Manager" plugin, thus having no Pro/Enterprise plugin restrictions.

### Key Features

* **Advantages**:
  1. **No Version Restrictions**: Applicable to all NocoBase users, including Community Edition.
  2. **High Compatibility**: Does not depend on the application's `dump` tool, can operate as long as you can connect to the database.
  3. **High Fault Tolerance**: If the solution contains commercial plugins you don't have, related features won't be enabled but won't affect other features, and the application can start successfully.
* **Limitations**:
  1. **Requires Database Operation Skills**: Users need basic database operation skills, such as how to execute a `.sql` file.
  2. **System Files Lost**: **This method will lose all system files**, including print template files, files uploaded to file fields in tables.

### Steps

**Step 1: Prepare a clean database**

Prepare a brand new, empty database for the data you're about to import.

**Step 2: Import the `.sql` file into the database**

Get the downloaded database file (usually in `.sql` format) and import its contents into the database you prepared in the previous step. There are multiple ways to do this, depending on your environment:

* **Option A: Via server command line (Docker example)**
  If you use Docker to install NocoBase and the database, you can upload the `.sql` file to the server and then use the `docker exec` command to execute the import. Assuming your PostgreSQL container is named `my-nocobase-db` and the file is named `ticket_system.sql`:

  ```bash
  # Copy the sql file into the container
  docker cp ticket_system.sql my-nocobase-db:/tmp/
  # Enter the container and execute the import command
  docker exec -it my-nocobase-db psql -U your_username -d your_database_name -f /tmp/ticket_system.sql
  ```
* **Option B: Via remote database client**
  If your database exposes a port, you can use any graphical database client (such as DBeaver, Navicat, pgAdmin, etc.) to connect to the database, create a new query window, paste all the contents of the `.sql` file, and execute.

**Step 3: Connect to the database and start the application**

Configure your NocoBase startup parameters (such as environment variables `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, etc.) to point to the database you just imported data into. Then, start the NocoBase service normally.

### Notes

* **Database Permissions**: This method requires you to have an account and password that can directly operate the database.
* **Plugin Status**: After successful import, although the commercial plugin data exists in the system, if you haven't installed and enabled the corresponding plugins locally, related features (such as Echarts charts, specific fields, etc.) won't be displayed and usable, but this won't cause the application to crash.

---

## Summary and Comparison

| Feature | Method 1: Backup Manager | Method 2: Direct SQL Import |
| :-------------- | :--------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **Target Users** | **Pro/Enterprise** users | **All users** (including Community Edition) |
| **Ease of Use** | Very easy (UI operation) | Moderate (requires basic database knowledge) |
| **Environment Requirements** | **Strict**, database and system versions must be highly compatible | **General**, database compatibility required |
| **Plugin Dependencies** | **Strong dependency**, plugins are verified during restoration, missing any plugin will cause **restoration failure**. | **Features depend on plugins**. Data can be imported independently, system has basic functionality. But without corresponding plugins, related features will be **completely unusable**. |
| **System Files** | **Fully preserved** (print templates, uploaded files, etc.) | **Will be lost** (print templates, uploaded files, etc.) |
| **Recommended Scenarios** | Enterprise users with controlled, consistent environment, need complete functionality | Missing some plugins, seeking high compatibility and flexibility, non-Pro/Enterprise users, can accept missing file functionality |

We hope this tutorial helps you successfully deploy the Ticketing System. If you encounter any problems during the process, please feel free to contact us!
