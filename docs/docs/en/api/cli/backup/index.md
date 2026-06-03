---
title: 'nb backup'
description: 'nb backup command reference: create a NocoBase backup and download it locally, or restore a local backup file to the target env.'
keywords: 'nb backup,NocoBase CLI,backup,restore,nbdata'
---

# nb backup

Create or restore a NocoBase backup. `nb backup create` creates a remote backup in the target env and then downloads the backup file locally; `nb backup restore` uploads a local backup file to the target env and waits for the application to become ready again.

## Usage

```bash
nb backup <command>
```

## Subcommands

| Command                             | Description                                   |
| ----------------------------------- | --------------------------------------------- |
| [`nb backup create`](./create.md)   | Create a backup and download it locally       |
| [`nb backup restore`](./restore.md) | Restore a local backup file to the target env |

## Examples

```bash
nb backup create
nb backup create --env app1 --output ./backups
nb backup create --env app1 --output ./backups/result.nbdata
nb backup restore --env app1 --file ./backups/backup_20260520_190408_8397.nbdata --yes --force
```

## Notes

Before execution, the CLI first checks whether the target env exposes runtime commands related to backup. If commands are missing, it automatically refreshes the runtime cache once; if the `nb api backup ...` capability is still missing after the refresh, it means the target env has not yet enabled or synchronized backup/restore capabilities, and you need to handle the target application itself first.

Specifically:

- `nb backup create` depends on `nb api backup create`, `nb api backup status`, and `nb api backup download`
- `nb backup restore` depends on `nb api backup restore-upload`

## Related commands

- [`nb env update`](../env/update.md)
- [`nb app restart`](../app/restart.md)
- [`nb api`](../api/index.md)
