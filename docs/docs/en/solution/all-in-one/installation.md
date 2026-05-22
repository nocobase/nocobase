---
title: "All-in-One Business Suite - Installation"
description: "Install the All-in-One Business Suite: restore via Backup Manager (Pro / Enterprise) or import the SQL file (Community). Requires PostgreSQL 16; DB_UNDERSCORED must not be true."
keywords: "all-in-one business suite installation, All-in-One, backup restore, Backup Manager, SQL import, PostgreSQL, NocoBase"
---

# Installation

> The current release is deployed via **backup restore**. Future releases may switch to **incremental migration** so the solution can be integrated into an existing NocoBase system.

The All-in-One Business Suite covers six modules: **CRM, sales management, help desk, project management, IT asset management, and HR**. To make deployment to your own NocoBase environment quick and smooth, we offer two restore methods — pick the one that fits your edition and technical background.

Before you start, make sure:

- You already have a working NocoBase environment. For the main installation, see the [official installation docs](https://docs.nocobase.com/welcome/getting-started/installation).
- NocoBase **v2.1.0-alpha.34 or above**
- You have downloaded the relevant All-in-One files:
  - **Backup file**: [nocobase_all_in_one_backup_260521.nbdata](https://static-docs.nocobase.com/nocobase_all_in_one_backup_260521.nbdata) — for Method 1
  - **SQL file**: [nocobase_all_in_one_sql_260521.zip](https://static-docs.nocobase.com/nocobase_all_in_one_sql_260521.zip) — for Method 2

**Important notes**:

- The solution is built on **PostgreSQL 16** — make sure your environment uses PostgreSQL 16.
- **DB_UNDERSCORED must not be true**: check your `docker-compose.yml` and make sure the `DB_UNDERSCORED` environment variable is not set to `true`, otherwise it will conflict with the backup and restore will fail.

---

## Method 1: Restore via Backup Manager (recommended for Pro / Enterprise users)

This method uses NocoBase's built-in "[Backup Manager](https://docs.nocobase.com/handbook/backups)" plugin (Pro / Enterprise) for one-click restore — the simplest path, with some environment and edition requirements.

### Characteristics

* **Pros**:
  1. **Easy to operate**: done entirely in the UI; restores all configuration including plugins.
  2. **Complete restore**: **all system files** are restored — template print files, files uploaded into attachment fields, AI employee avatars, and so on.
* **Limitations**:
  1. **Pro / Enterprise only**: Backup Manager is an enterprise-grade plugin available only to Pro / Enterprise users.
  2. **Strict environment requirements**: your database environment (version, case sensitivity, etc.) must be highly compatible with the backup environment.
  3. **Plugin dependency**: if the solution includes commercial plugins that are missing from your environment, the restore will fail.

### Steps

**Step 1: [Strongly recommended] start the app with the `full` image**

To avoid restore failures caused by missing database client tools, we strongly recommend using the `full` Docker image. It bundles all required companion programs, so no extra configuration is needed.

Example pull command:

```bash
docker pull nocobase/nocobase:alpha-full
```

Then start your NocoBase service from this image.

> **Note**: without the `full` image, you may need to install the `pg_dump` database client inside the container manually — a tedious and brittle process.

**Step 2: Enable the Backup Manager plugin**

1. Sign in to your NocoBase system.
2. Open **Plugin Manager**.
3. Find and enable the **Backup Manager** plugin.

**Step 3: Restore from the local backup file**

1. After enabling the plugin, refresh the page.
2. From the left menu, go to **System Management** → **Backup Manager**.
3. Click **Restore from local backup** in the top right.
4. Drag and drop the downloaded `nocobase_all_in_one_backup_260521.nbdata` file onto the upload area.
5. Click **Submit** and wait for the restore to complete — this can take from tens of seconds to a few minutes.

### Notes

* **Database compatibility**: this is the most critical point. Your PostgreSQL **version, character set, and case sensitivity** must match the source of the backup, and the `schema` name in particular must be identical.
* **Commercial plugins**: make sure you own and have enabled all commercial plugins required by the solution; otherwise restore will be interrupted. The All-in-One solution uses these commercial plugins: Backup Manager, Email Manager, Audit Log, AI Employees, and so on.

---

## Method 2: Import the SQL file directly (universal, better for Community Edition)

This method restores data by operating on the database directly. It bypasses the Backup Manager plugin, so it does not require the Pro / Enterprise edition.

### Characteristics

* **Pros**:
  1. **No edition limit**: works for all NocoBase users, including Community Edition.
  2. **Highly compatible**: does not rely on the in-app `dump` tool — anything that can connect to the database works.
  3. **Highly tolerant**: if the solution includes commercial plugins you do not have, the related features simply are not enabled, but the rest of the app still runs and starts successfully.
* **Limitations**:
  1. **Requires database skills**: you need basic ability to operate a database, for example running a `.sql` file.
  2. **System files lost**: **all system files are lost** with this method — template print files, files uploaded into attachment fields, AI employee avatars, and so on.

### Steps

**Step 1: Prepare a clean database**

Provision a fresh, empty database (PostgreSQL 16) for the import.

**Step 2: Import the `.sql` file into the database**

Unzip the downloaded `nocobase_all_in_one_sql_260521.zip` to obtain the `.sql` file, then import it into the database prepared in step 1. Several options depending on your environment:

* **Option A: Server command line (Docker example)**

  If you installed NocoBase and the database with Docker, upload the `.sql` file to the server and import it with `docker exec`. Assuming your PostgreSQL container is named `my-nocobase-db`:

  ```bash
  # Copy the SQL file into the container
  docker cp nocobase_all_in_one_sql_260521.sql my-nocobase-db:/tmp/
  # Run the import inside the container
  docker exec -it my-nocobase-db psql -U nocobase -d nocobase -f /tmp/nocobase_all_in_one_sql_260521.sql
  ```

* **Option B: Remote database client (Navicat etc.)**

  If your database port is exposed, you can use any GUI client (Navicat, DBeaver, pgAdmin, etc.) to connect to the database and:

  1. Right-click the target database
  2. Choose "Run SQL file" or "Execute SQL script"
  3. Select the downloaded `.sql` file and run it

**Step 3: Connect the database and start the app**

Configure your NocoBase startup parameters (environment variables `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, etc.) so they point at the database you just populated, then start NocoBase as usual.

### Notes

* **Database permissions**: this method requires a database account with permission to operate on the database directly.
* **Plugin state**: after a successful import, data for commercial plugins is present, but if the plugin itself is not installed and enabled locally, the related features will not appear and cannot be used — but the app will still run.

---

## Summary and comparison

| Feature | Method 1: Backup Manager | Method 2: SQL import |
| :--- | :--- | :--- |
| **Audience** | **Pro / Enterprise** users | **All users**, including Community Edition |
| **Ease of use** | ⭐⭐⭐⭐⭐ (very simple, UI driven) | ⭐⭐⭐ (basic database knowledge required) |
| **Environment requirements** | **Strict** — database, system version, etc. must match | **Moderate** — any compatible database works |
| **Plugin dependency** | **Strong** — restore validates plugins; missing plugins cause **restore failure** | **Feature-level dependency** — data imports cleanly and the system runs, but features tied to missing plugins are **completely unavailable** |
| **System files** | **Preserved** (print templates, uploaded files, avatars, etc.) | **Lost** (print templates, uploaded files, avatars, etc.) |
| **Recommended for** | Enterprise users with a controlled, consistent environment who need full functionality | Users missing some plugins; teams that value compatibility and flexibility; non-Pro / Enterprise users who can accept losing file-based features |

---

## FAQ

### Can the Pro Edition use this? Will it raise errors?

Yes, you can use it directly without errors. The demo uses some Enterprise plugins (Email Manager, Audit Log, AI Employees, etc.). On Pro, the entry points for those features simply do not appear, but **other modules are unaffected**. For example, the Audit Log entry disappears, while CRM, Sales, Help Desk, Project, Asset, HR, and other core modules work normally.

### Which version should I use after restore?

We recommend the latest `alpha-full` image (e.g. `nocobase/nocobase:alpha-full`). The `full` image bundles the database client and other dependencies, avoiding restore failures caused by missing tools.

### The logo does not display after restore?

The logo in the official online demo has a domain restriction and cannot load on a local domain. Open **System Settings** and upload your own logo.

### File upload fails (OSS key error)?

After SQL-based installation, file uploads may fail with an OSS-related error. Fix: go to **Plugin Manager → File Manager**, set **Local Storage** as the default storage, save, and uploads will work again.

### Switching languages?

The All-in-One solution ships with localization for 20+ languages (under the `nb_demo` namespace). After restore the default language is Chinese; to switch: **System Settings → enable the target language** (avoid enabling `ar-SA`, which currently causes a NocoBase rendering issue).

### What about incremental upgrades?

Today the upgrade path is a full replacement, which means custom changes are overwritten. Always back up before upgrading. An incremental migration plan is in the works and will be supported first on Pro / Enterprise. Community Edition is harder to support for now because the migration management plugin is unavailable there.

We hope this guide helps you deploy the All-in-One Business Suite smoothly. If you run into any issues, please get in touch.
