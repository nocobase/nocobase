---
title: "nb portal destroy"
description: "nb portal destroy command reference: delete a portal record and its deployed files."
keywords: "nb portal destroy,NocoBase CLI,Portal"
---

# nb portal destroy

Delete the portal record and deployed files.

## Usage

```bash
nb portal destroy <portal> [flags]
```

## Flag

| Flag | Type | Description |
| --- | --- | --- |
| `<portal>` | string | Portal name or slug. |
| `--env`, `-e` | string | CLI env name. If omitted, the current env is used. |
| `--yes`, `-y` | boolean | Skip confirmation prompts. |
| `--force` | boolean | Ignore missing portal records or deployment directories. |
| `--delete-dev-path`, `-D` | boolean | Delete the portal development directory in addition to the deployed portal. |

## Examples

```bash
nb portal destroy customer --yes
nb portal destroy customer --delete-dev-path --yes
nb portal destroy customer --env dev --yes
nb portal destroy customer --force --yes
```

## Notes

This command deletes the remote portal record and deployed files. The development directory is retained by default; pass `--delete-dev-path` to delete it as well. In non-interactive mode, pass `--yes`. Use `--force` to ignore missing records or deployment files.

## Related Commands

- [`nb portal`](./index.md)
- [`nb env`](../env/index.md)
