# CRM Demo Deployment Guide

To help you quickly and smoothly deploy this Demo to your own NocoBase environment, we provide two restoration methods. Please choose the most suitable one based on your user version and technical background.

Before starting, please ensure:

- You already have a basic NocoBase running environment. For main system installation, please refer to the more detailed [official installation documentation](https://docs.nocobase.com/welcome/getting-started/installation).
- You have downloaded our CRM Demo files:
  - **Backup File** (approx. 21.2MB): [crm_demo_20250711.nbdata](https://static-docs.nocobase.com/crm_demo_20250711.nbdata) - For Method 1
  - **SQL File** (approx. 9MB compressed): [crm_demo_20250711_sql.zip](https://static-docs.nocobase.com/crm_demo_20250711_sql.zip) - For Method 2

**Important Note**: This Demo is built on **PostgreSQL** database. Please ensure your environment uses PostgreSQL database.

---

### Method 1: Restore Using Backup Manager (Recommended for Pro/Enterprise Users)

This method performs one-click restoration through NocoBase's built-in "[Backup Manager](https://docs.nocobase.com/handbook/backups)" (Pro/Enterprise Edition) plugin, with the simplest operation. However, it has certain requirements for environment and user version.

#### Key Features

* **Advantages**:
  1. **Convenient Operation**: Can be completed in the UI interface, capable of completely restoring all configurations including plugins.
  2. **Complete Restoration**: **Can restore all system files**, including template print files, uploaded files in table file fields, etc., ensuring Demo functionality integrity.
* **Limitations**:
  1. **Pro/Enterprise Edition Only**: "Backup Manager" is an enterprise-level plugin, only available to Pro/Enterprise users.
  2. **Strict Environment Requirements**: Requires your database environment (version, case sensitivity settings, etc.) to be highly compatible with our backup creation environment.
  3. **Plugin Dependencies**: If the Demo contains commercial plugins that you don't have in your local environment, restoration will fail.

#### Operation Steps

**Step 1: [Strongly Recommended] Start Application Using `full` Image**

To avoid restoration failures due to missing database clients, we strongly recommend using the `full` version of the Docker image. It has all necessary supporting programs built-in, requiring no additional configuration. (Note: The image is built on 1.9.0-alpha.1, please pay attention to version compatibility)

Example command to pull the image:

```bash
docker pull nocobase/nocobase:1.9.0-alpha.3-full
```

Then use this image to start your NocoBase service.

> **Note**: If you don't use the `full` image, you may need to manually install the `pg_dump` database client inside the container, which is cumbersome and unstable.

**Step 2: Enable the "Backup Manager" Plugin**

1. Log into your NocoBase system.
2. Go to **`Plugin Management`** .
3. Find and enable the **`Backup Manager`** plugin.

![20250711014113](https://static-docs.nocobase.com/20250711014113.png)

**Step 3: Restore from Local Backup File**

1. After enabling the plugin, refresh the page.
2. Go to **`System Management`** -> **`Backup Manager`** in the left menu.
3. Click the **`Restore from Local Backup`** button in the top right corner.
   ![20250711014216](https://static-docs.nocobase.com/20250711014216.png)
4. Drag the Demo backup file we provided (usually in `.zip` format) to the upload area.
5. Click **`Submit`** and wait patiently for the system to complete restoration, which may take anywhere from tens of seconds to several minutes.
   ![20250711014250](https://static-docs.nocobase.com/20250711014250.png)

#### ⚠️ Important Notes

* **Database Compatibility**: This is the most critical point of this method. Your PostgreSQL database **version, character set, case sensitivity settings** must match the Demo backup source file. Particularly, `schema` names must be consistent.
* **Commercial Plugin Matching**: Please ensure you have and have enabled all commercial plugins required by the Demo, otherwise restoration will be interrupted.

---

### Method 2: Direct SQL File Import (Universal, More Suitable for Community Edition)

This method restores data by directly operating the database, bypassing the "Backup Manager" plugin, thus having no Pro/Enterprise plugin limitations.

#### Key Features

* **Advantages**:
  1. **No Version Restrictions**: Suitable for all NocoBase users, including community edition.
  2. **High Compatibility**: Does not depend on in-app `dump` tools, only requires database connection capability.
  3. **High Fault Tolerance**: If the Demo contains commercial plugins you don't have (such as ECharts charts), related functions will not be enabled, but won't affect normal use of other functions, and the application can start successfully.
* **Limitations**:
  1. **Database Operation Skills Required**: Requires users to have basic database operation capabilities, such as how to execute a `.sql` file.
  2. **⚠️ System File Loss**: **This method will lose all system files**, including template print files, uploaded files in table file fields, etc. This means:
     - Print template functions may not work properly
     - Uploaded images, documents, and other files will be lost
     - Functions involving file fields will be affected

#### Operation Steps

**Step 1: Prepare a Clean Database**

Prepare a brand new, empty database for the Demo data you're about to import.

**Step 2: Import the `.sql` File into the Database**

Get the Demo database file we provided (usually in `.sql` format) and import its contents into the database you prepared in the previous step. There are multiple execution methods, depending on your environment:

* **Option A: Through Server Command Line (Docker Example)**
  If you installed NocoBase and database using Docker, you can upload the `.sql` file to the server, then use `docker exec` command to perform the import. Assuming your PostgreSQL container name is `my-nocobase-db` and the file name is `crm_demo.sql`:

  ```bash
  # Copy sql file into the container
  docker cp crm_demo.sql my-nocobase-db:/tmp/
  # Enter container to execute import command
  docker exec -it my-nocobase-db psql -U your_username -d your_database_name -f /tmp/crm_demo.sql
  ```
* **Option B: Through Remote Database Client**
  If your database exposes a port, you can use any graphical database client (such as DBeaver, Navicat, pgAdmin, etc.) to connect to the database, create a new query window, paste the entire contents of the `.sql` file, and execute it.

**Step 3: Connect Database and Start Application**

Configure your NocoBase startup parameters (such as environment variables `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, etc.) to point to the database you just imported data into. Then, start the NocoBase service normally.

![img_v3_02o3_eb637bd2-88c3-400b-8421-1ac2057d1aag](https://static-docs.nocobase.com/img_v3_02o3_eb637bd2-88c3-400b-8421-1ac2057d1aag.png)

#### ⚠️ Important Notes

* **Database Permissions**: This method requires you to have an account and password that can directly operate the database.
* **Plugin Status**: After successful import, commercial plugin data in the system exists, but if you haven't installed and enabled corresponding plugins locally, related functions (such as Echarts charts, specific fields, etc.) will not display and work, but this won't cause application crashes.

---

### Summary and Comparison


| Feature                   | Method 1: Backup Manager                                                                                        | Method 2: Direct SQL Import                                                                                                                                                                          |
| :------------------------ | :-------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Applicable Users**      | **Pro/Enterprise Edition** users                                                                                | **All users** (including Community Edition)                                                                                                                                                          |
| **Operation Simplicity**  | ⭐⭐⭐⭐⭐ (Very easy, UI-based operation)                                                                      | ⭐⭐⭐ (Requires basic database knowledge)                                                                                                                                                           |
| **Environment Needs**     | **Strict**: Database, system version, etc. must be highly compatible                                            | **General**: Only requires database compatibility                                                                                                                                                    |
| **Plugin Dependency**     | **Strong dependency**: Restoration will fail if any required plugin is missing                                  | **Depends on plugins**. Data can be imported independently, and the system has basic functionality. However, if the corresponding plugin is missing, related features will **not be usable at all**. |
| **System Files**          | **✅ Fully preserved** (print templates, uploaded files, etc.)                                                  | **❌ Will be lost** (print templates, uploaded files, etc.)                                                                                                                                          |
| **Recommended Scenarios** | Pro/Enterprise users with controllable, consistent environments, requiring complete functionality demonstration | Missing some plugins, pursuing high compatibility and flexibility, non-Pro/Enterprise users, acceptable file function loss                                                                           |

We hope this tutorial helps you successfully deploy the CRM Demo. If you encounter any problems during the operation, please feel free to contact us!
