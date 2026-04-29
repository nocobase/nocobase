---
title: "nb app logs"
description: "nb app logs command reference: view NocoBase app logs for a selected env."
keywords: "nb app logs,NocoBase CLI,app logs,Docker logs,pm2 logs"
---

# nb app logs

View app logs. npm/Git installations read pm2 logs; Docker installations read Docker container logs.

## Usage

```bash
nb app logs [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env name to view logs for; uses the current env if omitted |
| `--tail` | integer | Number of recent log lines to show before following, default `100` |
| `--follow`, `-f` / `--no-follow` | boolean | Whether to keep following new log output |

## Examples

```bash
nb app logs
nb app logs --env app1
nb app logs --env app1 --tail 200
nb app logs --env app1 --no-follow
```

## Related Commands

- [`nb app start`](./start.md)
- [`nb app restart`](./restart.md)
- [`nb db logs`](../db/logs.md)
