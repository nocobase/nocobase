# Backup and restore

If you have saved a NocoBase application as a CLI env, daily backup and recovery are basically completed in the `nb backup` group of commands. `nb backup create` is used to create a backup in the target env and download it to the local. `nb backup restore` is used to restore the local backup file to the target env.

Most of the time, it's enough to remember the default advice: backup before upgrading, migrating, or batch changing data; perform recovery only when you clearly know that you want to overwrite the current data.

## Quick index

| I want... | Which command to use |
| --- | --- |
| First backup the current env to local | [`nb backup create`](../../api/cli/backup/create.md) |
| Save the backup to the specified directory | [`nb backup create --output ./backups`](../../api/cli/backup/create.md) |
| Let the script continue to consume the backup results | [`nb backup create --json-output`](../../api/cli/backup/create.md) |
| Restore local backup to current env | [`nb backup restore --file ./backups/xxx.nbdata --force`](../../api/cli/backup/restore.md) |
| Restore local backup to another env | [`nb backup restore --env app1 --file ./backups/xxx.nbdata --yes --force`](../../api/cli/backup/restore.md) |

:::tip first confirm the current env

The `nb backup` command acts on the current env by default. If you maintain multiple environments at the same time, the default recommendation is to take a look at the current env before performing a backup or restore.

```bash
nb env current
nb env use app1
```

If you explicitly pass in a different `--env`, the CLI will usually ask for confirmation. In scripts or non-interactive scenarios, you can add `--yes` to skip this step.

:::

## Create a backup

The simplest usage is to create a backup directly:

```bash
nb backup create
```

After the command returns successfully, the backup file has been downloaded locally. When `--output` is omitted, the CLI saves the file to the current working directory and uses the file name returned by the remote end—usually `backup_*.nbdata`.

If you want to put the backups into one directory, you can use this:

```bash
nb backup create --output ./backups
```

If `./backups` already exists and it is a directory, the CLI will automatically append the remote backup file name to the directory. Only if the path does not exist, the CLI will treat it as the target file path.

If you want to continue consuming backup results in scripts, CI or agent links, you can add `--json-output`:

```bash
nb backup create --env app1 --yes --json-output
```

In this mode, the CLI no longer outputs progress text, but directly returns the final JSON, which usually contains three fields: `env`, `name` and `output`.

## Restore backup

The restore command will upload the local backup file to the target env and overwrite the current application data:

```bash
nb backup restore --file ./backups/backup_20260520_190408_8397.nbdata --force
```

If you want to restore to something other than the current env, it is usually safer to write like this:

```bash
nb backup restore --env app1 --file ./backups/backup_20260520_190408_8397.nbdata --yes --force
```

:::warning note

Recovery is a full coverage operation. By default, it is recommended to make another backup of the current target env before restoring.

```bash
nb backup create --env app1 --yes --output ./backups
nb backup restore --env app1 --file ./backups/backup_20260520_190408_8397.nbdata --yes --force
```

:::

`nb backup restore` will first check whether the path pointed to by `--file` exists and confirm that it is a normal file. After the upload is successful, the CLI will continue to wait for the application to pass the health check again, so when the command returns successfully, the application has usually been restored to an accessible state.

If `--force` is not passed in, the interactive terminal will ask you for confirmation again. In non-interactive terminals, scripts, and AI agent sessions, `--force` is required.

## Common situations

If you are more accustomed to operating in the interface, or need capabilities such as scheduled backup and cloud storage synchronization, you can directly see [Backup Management](../../ops-management/backup-manager/index.mdx). In such scenarios, Web UI is often more suitable.

## Related links

- [`nb backup` Command Reference](../../api/cli/backup/index.md)
- [`nb env` Command Reference](../../api/cli/env/index.md)
- [Multiple environment management](./multi-environment.md)
- [Backup Management](../../ops-management/backup-manager/index.mdx)
