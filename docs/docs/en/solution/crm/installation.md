# Installation

> The current version is deployed via **backup and restore**. In future versions, we may switch to **incremental migration** to make it easier to integrate the solution into your existing systems.

To help you deploy the CRM 2.0 solution smoothly to your own NocoBase environment, we provide two restoration methods. Please choose the one that best suits your edition and technical background.

Before you begin, please ensure:

- You have a basic NocoBase running environment. For main system installation, please refer to the [official installation documentation](https://docs-cn.nocobase.com/welcome/getting-started/installation).
- NocoBase version **v2.1.0-beta.2 or above**.
- You have downloaded the corresponding CRM system files:
  - **Backup file**: [nocobase_crm_v2_backup_260223.nbdata](https://static-docs.nocobase.com/nocobase_crm_v2_backup_260223.nbdata) - For Method 1
  - **SQL file**: [nocobase_crm_v2_sql_260223.zip](https://static-docs.nocobase.com/nocobase_crm_v2_sql_260223.zip) - For Method 2

**Important Notes**:
- This solution is built on **PostgreSQL 16**. Please ensure your environment uses PostgreSQL 16.
- **DB_UNDERSCORED must not be true**: Please check your `docker-compose.yml` file and ensure the `DB_UNDERSCORED` environment variable is not set to `true`, otherwise it will conflict with the solution backup and cause restoration failure.

---

## Method 1: Restore Using Backup Manager (Recommended for Pro/Enterprise Users)

This method uses NocoBase's built-in "[Backup Manager](https://docs-cn.nocobase.com/handbook/backups)" (Pro/Enterprise Edition) plugin for one-click restoration. It is the simplest operation but has certain requirements for the environment and edition.

### Key Characteristics

* **Advantages**:
  1. **Convenient operation**: Completed within the UI, allowing for full restoration of all configurations including plugins.
  2. **Complete restoration**: **Able to restore all system files**, including print template files and files uploaded via file fields in collections, ensuring full functional integrity.
* **Limitations**:
  1. **Pro/Enterprise Edition only**: "Backup Manager" is an enterprise-level plugin available only to Pro/Enterprise users.
  2. **Strict environment requirements**: Requires your database environment (version, case sensitivity settings, etc.) to be highly compatible with the environment where the backup was created.
  3. **Plugin dependency**: If the solution includes commercial plugins not present in your local environment, the restoration will fail.

### Steps

**Step 1: [Strongly Recommended] Start the application using the `full` image**

To avoid restoration failures caused by a missing database client, we strongly recommend using the `full` version of the Docker image. It includes all necessary supporting programs, so no additional configuration is required.

Example command to pull the image:

```bash
docker pull nocobase/nocobase:beta-full
```

Then use this image to start your NocoBase service.

> **Note**: If you do not use the `full` image, you may need to manually install the `pg_dump` database client inside the container, which is a tedious and unstable process.

**Step 2: Enable the "Backup Manager" plugin**

1. Log in to your NocoBase system.
2. Go to **`Plugin Manager`**.
3. Find and enable the **`Backup Manager`** plugin.

**Step 3: Restore from local backup file**

1. After enabling the plugin, refresh the page.
2. Go to **`System Management`** -> **`Backup Manager`** in the left menu.
3. Click the **`Restore from local backup`** button in the upper right corner.
4. Drag the downloaded backup file into the upload area.
5. Click **`Submit`** and wait for the system to complete the restoration. This process may take anywhere from a few dozen seconds to several minutes.

### Notes

* **Database compatibility**: This is the most critical point. Your PostgreSQL database **version, character set, and case sensitivity settings** must match the backup source file. Specifically, the `schema` name must be consistent.
* **Commercial plugin matching**: Please ensure you have and have enabled all commercial plugins required by the solution; otherwise, the restoration will be interrupted.

---

## Method 2: Direct SQL File Import (Universal, Better for Community Edition)

This method restores data by directly operating on the database, bypassing the "Backup Manager" plugin, and therefore has no Pro/Enterprise Edition restrictions.

### Key Characteristics

* **Advantages**:
  1. **No edition restrictions**: Suitable for all NocoBase users, including Community Edition.
  2. **High compatibility**: Does not rely on the `dump` tool within the application; as long as you can connect to the database, you can operate.
  3. **High fault tolerance**: If the solution includes commercial plugins you do not have, the related features will not be enabled, but it will not affect the normal use of other features, and the application can start successfully.
* **Limitations**:
  1. **Requires database operation skills**: Users need basic database operation skills, such as how to execute a `.sql` file.
  2. **System file loss**: **This method will lose all system files**, including print template files and files uploaded via file fields in collections.

### Steps

**Step 1: Prepare a clean database**

Prepare a brand new, empty database for the data you are about to import.

**Step 2: Import the `.sql` file into the database**

Obtain the downloaded database file (usually in `.sql` format) and import its content into the database you prepared in the previous step. There are several ways to execute this, depending on your environment:

* **Option A: Via server command line (using Docker as an example)**
  If you use Docker to install NocoBase and the database, you can upload the `.sql` file to the server and then use the `docker exec` command to perform the import. Assuming your PostgreSQL container is named `my-nocobase-db` and the filename is `nocobase_crm_v2_sql_260223.sql`:

  ```bash
  # Copy the sql file into the container
  docker cp nocobase_crm_v2_sql_260223.sql my-nocobase-db:/tmp/
  # Enter the container and execute the import command
  docker exec -it my-nocobase-db psql -U nocobase -d nocobase -f /tmp/nocobase_crm_v2_sql_260223.sql
  ```
* **Option B: Via a remote database client (Navicat, etc.)**
  If your database port is exposed, you can use any graphical database client (such as Navicat, DBeaver, pgAdmin, etc.) to connect to the database, then:
  1. Right-click the target database.
  2. Select "Run SQL File" or "Execute SQL Script".
  3. Select the downloaded `.sql` file and execute.

**Step 3: Connect to the database and start the application**

Configure your NocoBase startup parameters (such as environment variables `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, etc.) to point to the database where you just imported the data. Then, start the NocoBase service normally.

### Notes

* **Database permissions**: This method requires you to have an account and password that can directly operate on the database.
* **Plugin status**: After a successful import, although the data for commercial plugins included in the system exists, if you have not installed and enabled the corresponding plugins locally, the related features will not be displayed or usable, but this will not cause the application to crash.

---

## Summary and Comparison

| Feature | Method 1: Backup Manager | Method 2: Direct SQL Import |
| :-------------- | :--------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **Applicable Users** | **Pro/Enterprise Edition** users | **All users** (including Community Edition) |
| **Ease of Use** | ⭐⭐⭐⭐⭐ (Very simple, UI operation) | ⭐⭐⭐ (Requires basic database knowledge) |
| **Environment Requirements** | **Strict**, database and system versions must be highly compatible | **General**, requires database compatibility |
| **Plugin Dependency** | **Strong dependency**, plugins are validated during restoration; missing any plugin will cause **restoration failure**. | **Features strongly depend on plugins**. Data can be imported independently, and the system will have basic functionality. However, if corresponding plugins are missing, related features will be **completely unusable**. |
| **System Files** | **Fully preserved** (print templates, uploaded files, etc.) | **Will be lost** (print templates, uploaded files, etc.) |
| **Recommended Scenarios** | Enterprise users with controlled, consistent environments needing full functionality | Missing some plugins, seeking high compatibility and flexibility, non-Pro/Enterprise users, or those who can accept the loss of file features |

We hope this tutorial helps you successfully deploy the CRM 2.0 system. If you encounter any problems during the process, please feel free to contact us!