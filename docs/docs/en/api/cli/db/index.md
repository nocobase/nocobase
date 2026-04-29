---
title: "nb db"
description: "nb db command reference: inspect or manage built-in database runtime status for a selected env."
keywords: "nb db,NocoBase CLI,built-in database,Docker,database status"
---

# nb db

Inspect or manage CLI-managed built-in databases. For envs without a CLI-managed database container, `nb db ps` can also show `external` or `remote` status.

## Usage

```bash
nb db <command>
```

## Subcommands

| Command | Description |
| --- | --- |
| [`nb db ps`](./ps.md) | View built-in database runtime status |
| [`nb db start`](./start.md) | Start the built-in database container |
| [`nb db stop`](./stop.md) | Stop the built-in database container |
| [`nb db logs`](./logs.md) | View built-in database container logs |

## Examples

```bash
nb db ps
nb db ps --env app1
nb db start --env app1
nb db stop --env app1
nb db logs --env app1
```

## Related Commands

- [`nb env info`](../env/info.md)
- [`nb app logs`](../app/logs.md)
