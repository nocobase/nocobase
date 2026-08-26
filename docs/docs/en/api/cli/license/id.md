---
title: "nb license id"
description: "nb license id command reference: show or regenerate the commercial license instance ID for a selected env."
keywords: "nb license id,NocoBase CLI,instance ID"
---

# nb license id

Show the commercial license instance ID for the selected env. If no saved instance ID exists yet, the CLI generates and saves one automatically.

## Usage

```bash
nb license id [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env name; when omitted, the current env is used |
| `--yes`, `-y` | boolean | When an explicitly passed `--env` targets a different env than the current env, skip the interactive confirmation prompt |
| `--force` | boolean | Regenerate the instance ID even when one is already saved |
| `--json` | boolean | Output JSON |

## Examples

```bash
nb license id
nb license id --env app1
nb license id --env app1 --yes
nb license id --env app1 --force
nb license id --env app1 --json
```

`--force` only forces regeneration of the instance ID. It does not replace cross-env confirmation; if an explicitly passed `--env` targets a non-current env, you still need confirmation or `--yes`.

## Related Commands

- [`nb license activate`](./activate.md)
- [`nb license status`](./status.md)
