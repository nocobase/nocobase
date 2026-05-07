---
title: "nb license plugins sync"
description: "nb license plugins sync command reference: synchronize commercial plugins allowed by the current license for a selected env."
keywords: "nb license plugins sync,NocoBase CLI,commercial plugins"
---

# nb license plugins sync

Synchronize commercial plugins allowed by the current license.

## Usage

```bash
nb license plugins sync [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env name; when omitted, the current env is used |
| `--dry-run` | boolean | Preview changes without installing, upgrading, or removing plugins |
| `--version` | string | Registry version or dist-tag to synchronize; defaults to the current workspace version |
| `--verbose`, `-V` | boolean | Show detailed per-plugin sync logs |
| `--json` | boolean | Output JSON |

## Examples

```bash
nb license plugins sync
nb license plugins sync --env app1
nb license plugins sync --env app1 --dry-run
nb license plugins sync --env app1 --json
```

## Notes

When `--version` is omitted, the CLI detects the current app version automatically and uses that to decide which registry version of commercial plugins should be downloaded.

## Related Commands

- [`nb license plugins list`](./list.md)
- [`nb license plugins clean`](./clean.md)
