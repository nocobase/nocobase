---
title: "nb license status"
description: "nb license status command reference: show commercial license status for a selected env."
keywords: "nb license status,NocoBase CLI,license status"
---

# nb license status

Show commercial license status for the selected env.

## Usage

```bash
nb license status [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env name; when omitted, the current env is used |
| `--doctor` | boolean | Run extra diagnostic checks and suggestions |
| `--json` | boolean | Output JSON |

## Examples

```bash
nb license status
nb license status --env app1
nb license status --env app1 --doctor
nb license status --env app1 --json
```

## Notes

The new CLI does not fully implement backend license status checks yet. The command can still return basic context and diagnostic placeholders, but not a complete license verdict.

## Related Commands

- [`nb license activate`](./activate.md)
- [`nb license id`](./id.md)
