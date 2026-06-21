# Installation

> The current version is deployed via **backup and restore**. In future versions, we may switch to **incremental migration** to make it easier to integrate the solution into your existing systems.

> **The Backup Manager plugin is now open-source**: The "[Backup Manager](https://docs-cn.nocobase.com/handbook/backups)" plugin needed to restore the solution is now open-source and available to all editions (including the Community Edition). We recommend restoring directly via this plugin.

Before you begin, please ensure:

- You have a basic NocoBase running environment. For main system installation, please refer to the [official installation documentation](https://docs-cn.nocobase.com/welcome/getting-started/installation).
- NocoBase version **v2.1.0-beta.2 or above**.
- You have downloaded the CRM system backup file: [nocobase_crm_v2_backup_260523.nbdata](https://static-docs.nocobase.com/nocobase_crm_v2_backup_260523.nbdata)

**Important Notes**:
- This solution is built on **PostgreSQL 16**. Please ensure your environment uses PostgreSQL 16.
- **DB_UNDERSCORED must not be true**: Please check your `docker-compose.yml` file and ensure the `DB_UNDERSCORED` environment variable is not set to `true`, otherwise it will conflict with the solution backup and cause restoration failure.

---

## Restore Using Backup Manager

This method uses NocoBase's built-in "[Backup Manager](https://docs-cn.nocobase.com/handbook/backups)" plugin for one-click restoration. It is the simplest operation. This plugin is now open-source and available to all editions (including the Community Edition).

### Key Characteristics

* **Advantages**:
  1. **Convenient operation**: Completed within the UI, allowing for full restoration of all configurations including plugins.
  2. **Complete restoration**: **Able to restore all system files**, including print template files and files uploaded via file fields in collections, ensuring full functional integrity.
* **Limitations**:
  1. **Strict environment requirements**: Requires your database environment (version, case sensitivity settings, etc.) to be highly compatible with the environment where the backup was created.
  2. **Plugin dependency**: If the solution includes commercial plugins not present in your local environment, the restoration will fail.

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

## FAQ

### Can Pro Edition users install this? Will it cause errors?

Yes, it works directly without errors. The demo uses some Enterprise Edition plugins (e.g., email management, audit logs). When Pro Edition lacks these plugins, the corresponding menu entries simply won't appear — **other features are not affected**. For example, the email entry disappears, but leads, opportunities, orders, and all other core modules work normally.

### Which version should I use?

We recommend the latest `beta-full` image (e.g., `nocobase/nocobase:beta-full`). The `full` image includes database client tools and other dependencies, preventing restoration failures caused by missing tools.

### Logo not showing after restoration?

The demo's logo is configured with a domain restriction and cannot load on local domains. Go to **System Settings** and re-upload your own logo.

### What about incremental upgrades?

Currently, version upgrades are full replacements — your custom modifications will be overwritten. Always back up before upgrading. An incremental migration solution is being planned and will prioritize Pro/Enterprise editions. Community edition support is more difficult due to the lack of the migration management plugin.

We hope this tutorial helps you successfully deploy the CRM 2.0 system. If you encounter any problems during the process, please feel free to contact us!
---

*Last updated: 2026-04-02*
