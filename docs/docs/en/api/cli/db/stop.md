---
title: "nb db stop"
description: "nb db stop command reference: stop the built-in database container for a selected env."
keywords: "nb db stop,NocoBase CLI,stop database,Docker"
---

# nb db stop

Stop the built-in database container for a selected env. This command only applies to envs created with a CLI-managed built-in database.

## Usage

```bash
nb db stop [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env name whose built-in database should stop; uses the current env if omitted |
| `--verbose` | boolean | Show underlying Docker command output |

## Examples

```bash
nb db stop
nb db stop --env app1
nb db stop --env app1 --verbose
```

## Related Commands

- [`nb db start`](./start.md)
- [`nb app stop`](../app/stop.md)
- [`nb app down`](../app/down.md)
