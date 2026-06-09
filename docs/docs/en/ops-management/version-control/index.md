---
title: "Version control"
description: "Version control plugin guide: create versions, restore versions, configure retention, set shortcuts, and include user collections in saved versions."
keywords: "Version control,ops management,create version,restore version,NocoBase"
---

# Version control

In NocoBase, **Version control** lets you save a restorable version of the current application. You can create versions manually, restore the application to a saved version when needed, and use the plugin settings to control how many versions to keep, which shortcut to use, and which user collections should be saved with the version.

It depends on [Backup manager](../backup-manager/index.mdx). If the Version control plugin is already enabled but the system still shows related errors, first make sure Backup manager is enabled.

## Open the plugin

You can open the plugin from 「System settings」 → 「Version control」. A Version control button also appears in the top bar. Click it to create a version directly or jump to the versions list. The default shortcut for creating a version is `Ctrl + K`, and you can change it in the settings tab.

![](https://static-docs.nocobase.com/20260526220402.png)

## Create a version

Click 「Create version」, enter a description, and save it. The description can be up to 2000 characters. It is useful for recording the background of the change, such as “Adjusted approval fields and permissions”.

![](https://static-docs.nocobase.com/20260526220510.png)

After you click save, the list first shows a temporary “Saving” entry. When the task finishes, the saved version appears in the list.

Key points:

- Version names are generated automatically
- Creating a version from the top bar, the shortcut, or the list page behaves the same
- The list shows the version name, description, file size, creation time, creator, and available actions

## Manage and restore versions

The versions list mainly provides these actions:

- 「Refresh」 reloads the current list
- 「Delete」 removes one version, or multiple selected versions in batch
- 「Restore」 restores the application to the state saved in that version

:::warning Notice

Restoring a version overwrites the current application configuration and the data included in that version. It is recommended to create a version of the current state before restoring, so you can roll back again if needed.

:::

After you click 「Restore」, the application enters maintenance mode for a short time while the restore is running. Do not submit another restore request during that time. If the restore fails, the UI shows an error notification.

## Configure version rules

Open the 「Settings」 tab to control retention and what each version includes.

![](https://static-docs.nocobase.com/20260526220720.png)

The settings include:

- `Versions to keep`: the maximum number of saved versions. Older versions are deleted automatically after the limit is exceeded
- `Shortcut: create version`: the shortcut for creating a version. Press `Ctrl + a letter key` to set it, or `Backspace` to clear it
- `User collections`: choose which user-created collections should have their data included in saved versions

:::tip

By default, saved versions do not include data from user-created collections. You only need to select collections here when you want some business data to be restored together with the application version.

:::

If you include a user collection, NocoBase also includes related collections automatically, so restores are usually more complete.

## Related links

- [Backup manager](../backup-manager/index.mdx) — the underlying capability required by Version control
- [Migration manager](../migration-manager/index.md) — move application configuration across environments
- [Release management](../release-management/index.md) — plan release workflows with backups, migrations, and variables
