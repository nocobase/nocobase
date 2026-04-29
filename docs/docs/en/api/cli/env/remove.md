---
title: "nb env remove"
description: "nb env remove command reference: remove a selected NocoBase CLI env config."
keywords: "nb env remove,NocoBase CLI,delete environment,remove config"
---

# nb env remove

Remove a configured env. This command only deletes CLI env configuration; use [`nb app down`](../app/down.md) to clean up local apps, containers, and storage.

## Usage

```bash
nb env remove <name> [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `<name>` | string | Env name to remove |
| `--force`, `-f` | boolean | Skip confirmation and delete directly |
| `--verbose` | boolean | Show detailed progress |

## Examples

```bash
nb env remove staging
nb env remove staging -f
```

## Related Commands

- [`nb app down`](../app/down.md)
- [`nb env list`](./list.md)
