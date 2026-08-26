# How to Install

> The current version uses **backup and restoration** for deployment. In future versions, we may switch to **incremental migration** to facilitate the integration of the solution into your existing systems.

> **The Backup Manager plugin is now open-source**: The "[Backup Manager](https://docs.nocobase.com/handbook/backups)" plugin needed to restore the solution is now open-source and available to all editions (including the Community Edition). We recommend restoring directly via this plugin.

Before you begin, please ensure:

- You already have a basic NocoBase running environment. For main system installation, please refer to the detailed [official installation documentation](https://docs.nocobase.com/welcome/getting-started/installation).
- NocoBase version **2.0.0-beta.5 and above**.
- You have downloaded the ticketing system backup file: [nocobase_tickets_v2_backup_260324.nbdata](https://static-docs.nocobase.com/nocobase_tickets_v2_backup_260324.nbdata)

**Important Notes**:
- This solution is built on **PostgreSQL 16**. Please ensure your environment uses PostgreSQL 16.
- **DB_UNDERSCORED cannot be true**: Please check your `docker-compose.yml` file and ensure the `DB_UNDERSCORED` environment variable is not set to `true`, otherwise it will conflict with the solution backup and cause restoration failure.

---

## Restore Using Backup Manager

This method uses the built-in "[Backup Manager](https://docs.nocobase.com/handbook/backups)" plugin for one-click restoration, which is the simplest operation. This plugin is now open-source and available to all editions (including the Community Edition).

### Core Features

* **Advantages**:
  1. **Convenient Operation**: Can be completed via the UI, allowing for full restoration of all configurations, including plugins.
  2. **Complete Restoration**: **Able to restore all system files**, including print templates, files uploaded to attachment fields, etc., ensuring full functionality.
* **Limitations**:
  1. **Strict Environment Requirements**: Requires your database environment (version, case sensitivity, etc.) to be highly compatible with the environment where the backup was created.
  2. **Plugin Dependencies**: If the solution includes commercial plugins not present in your local environment, the restoration will fail.

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

We hope this tutorial helps you successfully deploy the ticketing system. If you encounter any issues during the process, please feel free to contact us!
---

*Last updated: 2026-03-24*
