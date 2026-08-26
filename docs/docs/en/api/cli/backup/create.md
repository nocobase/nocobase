---
title: 'nb backup create'
description: 'nb backup create command reference: create a backup through the selected env and download the backup file locally.'
keywords: 'nb backup create,NocoBase CLI,create backup,download backup,nbdata'
---

# nb backup create

Create a backup through the selected env and download the backup file locally. When `--output` is omitted, the CLI saves the file to the current working directory and reuses the backup filename returned by the remote side—usually `backup_*.nbdata`.

## Usage

```bash
nb backup create [flags]
```

## Parameters

| Parameter             | Type    | Description                                                                                                                                                    |
| --------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--env`, `-e`         | string  | Name of the CLI env for which to create the backup; uses the current env when omitted                                                                          |
| `--yes`, `-y`         | boolean | Skip interactive confirmation when the env explicitly pointed to by `--env` differs from the current env                                                       |
| `--output`, `-o`      | string  | Download target path. Saves to the current directory when omitted; if it points to an existing directory, the remote backup filename is appended automatically |
| `--json-output`, `-j` | boolean | Output the final result as JSON, including the fields `env`, `name`, and `output`                                                                              |

## Examples

```bash
nb backup create
nb backup create --output ./backups
nb backup create --output ./backups/base.nbdata
nb backup create --env e2e --output ./backups --yes
nb backup create --env e2e --json-output
```

## Notes

The CLI checks whether `--env` matches the current env only when you explicitly pass `--env`. If a different env is explicitly specified, an interactive terminal asks for confirmation first; in a non-interactive terminal or AI agent scenario, you need to explicitly add `--yes` yourself, or run `nb env use <name>` first and then retry.

The creation flow is divided into two steps: first, it calls the backup API of the target env to create a remote backup, then it polls the status every 2 seconds; after the backup is complete, it downloads the file locally. If the remote side still returns `inProgress: true` after 600 seconds, the command exits with a timeout.

`--output` can be either a file path or an existing directory path. The CLI recognizes only an existing path as a directory; if the path does not exist, it is treated as a target file path.

After passing `--json-output`, the CLI no longer outputs progress text and instead prints the final JSON result directly. This mode is better suited for further consumption by scripts and agent workflows.

## Related commands

- [`nb backup restore`](./restore.md)
- [`nb env update`](../env/update.md)
