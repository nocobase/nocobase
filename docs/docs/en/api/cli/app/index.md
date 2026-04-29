---
title: "nb app"
description: "nb app command reference: manage NocoBase app runtime, including start, stop, restart, logs, cleanup, and upgrades."
keywords: "nb app,NocoBase CLI,app runtime,start,stop,logs,upgrade"
---

# nb app

Manage the runtime of a selected NocoBase env. npm/Git envs run local app commands; Docker envs manage saved app containers.

## Usage

```bash
nb app <command>
```

## Subcommands

| Command | Description |
| --- | --- |
| [`nb app start`](./start.md) | Start the app or Docker container |
| [`nb app stop`](./stop.md) | Stop the app or Docker container |
| [`nb app restart`](./restart.md) | Stop and then start the app |
| [`nb app logs`](./logs.md) | View app logs |
| [`nb app down`](./down.md) | Stop and clean up local runtime resources |
| [`nb app upgrade`](./upgrade.md) | Update source or image and restart the app |

## Examples

```bash
nb app start --env app1
nb app restart --env app1
nb app logs --env app1
nb app stop --env app1
nb app down --env app1 --all --yes
```

## Related Commands

- [`nb env info`](../env/info.md)
- [`nb db ps`](../db/ps.md)
- [`nb source download`](../source/download.md)
