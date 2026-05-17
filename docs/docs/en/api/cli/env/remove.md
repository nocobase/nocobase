---
title: "nb env remove"
description: "nb env remove command reference: remove a selected NocoBase CLI env config."
keywords: "nb env remove,NocoBase CLI,delete environment,remove config"
---

# nb env remove

Remove a configured env. This command only removes the saved CLI env config and does not clean local app directories, containers, or storage data; use [`nb app down`](../app/down.md) when you need to clean local runtime resources.

If the removed env is also the current env, the CLI automatically selects a new current env from the remaining envs. If no envs remain, the current env is cleared.

By default, the command asks for confirmation. To skip confirmation, pass `--yes`. In non-interactive mode, `--yes` is required before the env can be removed.

## Usage

```bash
nb env remove <name> [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `<name>` | string | Configured environment name to remove |
| `--yes`, `-y` | boolean | Skip confirmation and remove the saved CLI env config |
| `--verbose` | boolean | Show detailed progress |

## Examples

```bash
nb env remove staging
nb env remove staging --yes
```

## Related Commands

- [`nb app down`](../app/down.md)
- [`nb env current`](./current.md)
- [`nb env list`](./list.md)
