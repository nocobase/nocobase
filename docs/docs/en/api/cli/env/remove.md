---
title: "nb env remove"
description: "nb env remove command reference: stop managed runtime resources before removing env config, or purge CLI-managed local resources when needed."
keywords: "nb env remove,NocoBase CLI,delete environment,remove config,purge"
---

# nb env remove

Remove a configured env. For local and Docker envs, this command stops the CLI-managed app runtime and built-in database runtime on this machine first, then removes the saved CLI env config. For HTTP and SSH envs, it only removes the saved CLI env config.

If the removed env is also the current env, the CLI automatically selects a new current env from the remaining envs. If no envs remain, the current env is cleared.

By default, the command asks for confirmation. In non-interactive mode, `--force` is required before the command can run.

Pass `--purge` to clean up CLI-managed resources on this machine as well. For local and Docker envs, `--purge` performs the same cleanup as [`nb app destroy`](../app/destroy.md). For HTTP and SSH envs, `--purge` does not touch external services and only removes the saved CLI env config.

## Usage

```bash
nb env remove <name> [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `<name>` | string | Configured environment name to remove |
| `--force`, `-f` | boolean | Skip confirmation for the selected remove mode; required in non-interactive mode |
| `--purge` | boolean | Also remove CLI-managed local runtime resources, storage data, and downloaded local app files when applicable. For remote API envs, only the saved env config is removed |
| `--verbose` | boolean | Show detailed progress |

## Examples

```bash
nb env remove staging
nb env remove staging --force
nb env remove staging --purge --force
```

## Related Commands

- [`nb app stop`](../app/stop.md)
- [`nb app destroy`](../app/destroy.md)
- [`nb env current`](./current.md)
- [`nb env list`](./list.md)
