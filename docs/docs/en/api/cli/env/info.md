---
title: "nb env info"
description: "nb env info command reference: inspect app, database, API, and authentication config for a NocoBase CLI env."
keywords: "nb env info,NocoBase CLI,environment details,configuration"
---

# nb env info

Show details for a single env, including app, database, API, and authentication configuration.

## Usage

```bash
nb env info [name] [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `[name]` | string | CLI env name to inspect; uses the current env if omitted |
| `--env`, `-e` | string | CLI env name to inspect; alternative to the positional argument |
| `--json` | boolean | Output JSON |
| `--show-secrets` | boolean | Show tokens, passwords, and other secrets in plain text |

If both `[name]` and `--env` are passed, they must match.

## Examples

```bash
nb env info app1
nb env info app1 --json
nb env info app1 --show-secrets
nb env info --env app1
```

## Related Commands

- [`nb env list`](./list.md)
- [`nb app start`](../app/start.md)
- [`nb db ps`](../db/ps.md)
