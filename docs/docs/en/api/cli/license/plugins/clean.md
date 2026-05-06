---
title: "nb license plugins clean"
description: "nb license plugins clean command reference: remove downloaded commercial plugins for a selected env."
keywords: "nb license plugins clean,NocoBase CLI,commercial plugins"
---

# nb license plugins clean

Remove downloaded commercial plugins for the selected env without changing license activation.

## Usage

```bash
nb license plugins clean [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env name; when omitted, the current env is used |
| `--dry-run` | boolean | Preview which plugins would be removed without deleting anything |
| `--verbose`, `-V` | boolean | Show detailed per-plugin clean logs |
| `--json` | boolean | Output JSON |

## Examples

```bash
nb license plugins clean
nb license plugins clean --env app1
nb license plugins clean --env app1 --dry-run
nb license plugins clean --env app1 --verbose
nb license plugins clean --env app1 --json
```

## Related Commands

- [`nb license plugins sync`](./sync.md)
- [`nb plugin disable`](../../plugin/disable.md)
