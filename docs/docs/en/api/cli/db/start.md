---
title: "nb db start"
description: "nb db start command reference: start the built-in database container for a selected env."
keywords: "nb db start,NocoBase CLI,start database,Docker"
---

# nb db start

Start the built-in database container for a selected env. This command only applies to envs created with a CLI-managed built-in database.

## Usage

```bash
nb db start [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env name whose built-in database should start; uses the current env if omitted |
| `--verbose` | boolean | Show underlying Docker command output |

## Examples

```bash
nb db start
nb db start --env app1
nb db start --env app1 --verbose
```

## Related Commands

- [`nb db stop`](./stop.md)
- [`nb db logs`](./logs.md)
- [`nb app start`](../app/start.md)
