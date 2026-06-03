---
title: 'nb env remove'
description: 'nb env remove command reference: stop managed runtimes before removing env configuration, or fully clean up locally managed resources when needed.'
keywords: 'nb env remove,NocoBase CLI,delete environment,remove configuration,purge'
---

# nb env remove

Remove a configured env. For local/docker envs, this command first stops the CLI-managed application runtime and built-in database runtime on the current machine, then removes the saved CLI env configuration. For http/ssh envs, this command only removes the saved CLI env configuration.

If the removed env is the current env, the CLI automatically selects a new current env from the remaining envs; if no envs are available, the current env is cleared.

By default, the command requires confirmation. In non-interactive mode, you must explicitly pass `--force` to execute it.

To clean up CLI-managed resources on the current machine as thoroughly as possible, pass `--purge`. For local/docker envs, `--purge` also cleans up managed runtime resources, storage data, and downloaded local app files when applicable; for http/ssh envs, `--purge` does not affect external services and only removes the saved CLI env configuration.

## Usage

```bash
nb env remove <name> [flags]
```

## Parameters

| Parameter       | Type    | Description                                                                                                                                                                                        |
| --------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<name>`        | string  | Name of the configured environment to remove                                                                                                                                                       |
| `--force`, `-f` | boolean | Skip confirmation for the current remove mode; required in non-interactive mode                                                                                                                    |
| `--purge`       | boolean | Additionally clean up CLI-managed resources, storage data, and downloaded local app files on the current machine when applicable; for remote API envs, only the saved env configuration is removed |
| `--verbose`     | boolean | Show detailed progress                                                                                                                                                                             |

## Examples

```bash
nb env remove staging
nb env remove staging --force
nb env remove staging --purge --force
```

## Related commands

- [`nb app stop`](../app/stop.md)
- [`nb env current`](./current.md)
- [`nb env list`](./list.md)
