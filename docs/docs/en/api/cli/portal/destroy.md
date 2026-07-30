---
title: "nb portal destroy"
description: "nb portal destroy command reference: delete a portal record and its local workspace."
keywords: "nb portal destroy,NocoBase CLI,Portal"
---

# nb portal destroy

Delete the portal record and local workspace

## Usage

```bash
nb portal destroy <portal> [flags]
```

## Flag

| Flag | Type | Description |
| --- | --- | --- |
| `--dir` | string | Portal workspace directory. Default: the current directory. |
| `<portal>` | string | Portal name or slug. |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip confirmation prompts. |
| `--force` | boolean | Ignore missing portal records or workspace directories. |

## Examples

```bash
nb portal destroy customer --yes
nb portal destroy customer --env dev --yes
nb portal destroy customer --force --yes
```

## Notes

This command affects both the remote portal record and the local workspace. In non-interactive mode, pass `--yes`. Use `--force` to ignore missing records or local files.

## Related Commands

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
