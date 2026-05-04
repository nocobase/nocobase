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
| `--json` | boolean | Output JSON |

## Examples

```bash
nb license plugins list
nb license plugins list --env app1
nb license plugins list --env app1 --json
```

## Related Commands

- [`nb license plugins sync`](./sync.md)
- [`nb license activate`](../activate.md)
