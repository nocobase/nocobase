# Installation Guide

> **Backup files and SQL files are being prepared and will be available soon. Stay tuned!**

> **Note**: The current CRM solution runs on NocoBase 2.0 beta, but the business logic still follows version 1.x. It is for preview only. Future versions will be completely rebuilt.

> The current version uses **backup restoration** for deployment. In future versions, we may switch to **incremental migration** to make it easier to integrate the solution into your existing system.

To help you quickly experience the CRM solution, we provide two restoration methods. Please choose the one that best suits your user version and technical background.

Before you begin, please ensure:

- You already have a basic NocoBase running environment. For main system installation, please refer to the detailed [official installation documentation](https://docs-cn.nocobase.com/welcome/getting-started/installation).
- NocoBase version **2.0.0 or above**
- You have downloaded the corresponding CRM files:
  - **Backup file**: nocobase_crm.nbdata - For Method 1 (Coming soon)
  - **SQL file**: nocobase_crm.zip - For Method 2 (Coming soon)

**Important Notes**:
- This solution is built on **PostgreSQL 16** database. Please ensure your environment uses PostgreSQL 16.
- **DB_UNDERSCORED must not be true**: Please check your `docker-compose.yml` file and ensure the `DB_UNDERSCORED` environment variable is not set to `true`, otherwise it will conflict with the solution backup and cause restoration failure.

---

## Method 1: Restore Using Backup Manager (Recommended for Pro/Enterprise Users)

This method uses NocoBase's built-in "[Backup Manager](https://docs-cn.nocobase.com/handbook/backups)" (Pro/Enterprise) plugin for one-click restoration, which is the simplest operation.

### Steps

**Step 1: Enable the "Backup Manager" plugin**

1. Log in to your NocoBase system.
2. Go to **`Plugin Management`**.
3. Find and enable the **`Backup Manager`** plugin.

**Step 2: Restore from local backup file**

1. After enabling the plugin, refresh the page.
2. Go to **`System Management`** -> **`Backup Manager`** in the left menu.
3. Click the **`Restore from Local Backup`** button in the upper right corner.
4. Drag the downloaded backup file to the upload area.
5. Click **`Submit`** and wait patiently for the system to complete the restoration.

### Notes

* **Pro/Enterprise Only**: "Backup Manager" is an enterprise plugin, available only to Pro/Enterprise users.
* **Commercial Plugin Matching**: Please ensure you have and have enabled the commercial plugins required by the solution.

---

## Method 2: Direct SQL File Import (Universal)

This method restores data by directly operating the database, applicable to all NocoBase users.

### Steps

**Step 1: Prepare a clean database**

Prepare a brand new, empty database for the data you're about to import.

**Step 2: Import the `.sql` file into the database**

* **Via command line (Docker example)**:

  ```bash
  # Copy the sql file into the container
  docker cp crm_demo.sql my-nocobase-db:/tmp/
  # Enter the container and execute the import command
  docker exec -it my-nocobase-db psql -U your_username -d your_database_name -f /tmp/crm_demo.sql
  ```

* **Via database client**: Use tools like DBeaver, Navicat, pgAdmin to connect to the database and execute the SQL file.

**Step 3: Connect to the database and start the application**

Configure NocoBase startup parameters to point to the database with imported data, then start the service.

---

## More Help

For detailed restoration tutorial, please refer to: [NocoBase CRM Demo Deployment Guide](https://www.nocobase.com/cn/tutorials/nocobase-crm-demo-deployment-guide)
