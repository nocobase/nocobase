---
title: "nb license plugins list"
description: "nb license plugins list command reference: show commercial plugins associated with the current license for a selected env."
keywords: "nb license plugins list,NocoBase CLI,commercial plugins"
---

# nb license plugins list

Show commercial plugins associated with the saved license key for the selected env.

## Usage

```bash
nb license plugins list [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env name; when omitted, the current env is used |
| `--yes`, `-y` | boolean | When an explicitly passed `--env` targets a different env than the current env, skip the interactive confirmation prompt |
| `--json` | boolean | Output JSON |

## Examples

```bash
nb license plugins list
nb license plugins list --env app1
nb license plugins list --env app1 --yes
nb license plugins list --env app1 --json
```

If you explicitly pass `--env` and it differs from the current env, the CLI asks for confirmation first. In non-interactive terminals or AI agent sessions, add `--yes` yourself or run `nb env use <name>` first and try again.

## Related Commands

- [`nb license plugins sync`](./sync.md)
- [`nb license activate`](../activate.md)
