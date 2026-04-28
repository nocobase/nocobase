---
title: "nb app stop"
description: "nb app stop command reference: stop the NocoBase app or Docker container for a selected env."
keywords: "nb app stop,NocoBase CLI,stop app,Docker"
---

# nb app stop

Stop the NocoBase app for a selected env. npm/Git installations stop local app processes; Docker installations stop the saved app container.

## Usage

```bash
nb app stop [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env name to stop; uses the current env if omitted |
| `--verbose` | boolean | Show underlying local or Docker command output |

## Examples

```bash
nb app stop
nb app stop --env local
nb app stop --env local --verbose
nb app stop --env local-docker
```

## Related Commands

- [`nb app start`](./start.md)
- [`nb app restart`](./restart.md)
- [`nb app down`](./down.md)
