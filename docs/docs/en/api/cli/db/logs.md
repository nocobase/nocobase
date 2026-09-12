---
title: "nb db logs"
description: "nb db logs command reference: view built-in database container logs for a selected env."
keywords: "nb db logs,NocoBase CLI,database logs,Docker logs"
---

# nb db logs

View built-in database container logs for a selected env. This command only applies to envs created with a CLI-managed built-in database.

## Usage

```bash
nb db logs [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env name whose built-in database logs should be shown; uses the current env if omitted |
| `--tail` | integer | Number of recent log lines to show before following, default `100` |
| `--follow`, `-f` / `--no-follow` | boolean | Whether to keep following new log output |

## Examples

```bash
nb db logs
nb db logs --env app1
nb db logs --env app1 --tail 200
nb db logs --env app1 --no-follow
```

## Related Commands

- [`nb db ps`](./ps.md)
- [`nb app logs`](../app/logs.md)
