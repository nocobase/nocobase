---
title: "nb db ps"
description: "nb db ps command reference: view built-in database runtime status for configured envs."
keywords: "nb db ps,NocoBase CLI,database status"
---

# nb db ps

View built-in database runtime status without starting or stopping any resources. When `--env` is omitted, it shows database status for all configured envs.

## Usage

```bash
nb db ps [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env name to inspect; shows all envs if omitted |

## Examples

```bash
nb db ps
nb db ps --env app1
```

## Related Commands

- [`nb db start`](./start.md)
- [`nb db stop`](./stop.md)
- [`nb env info`](../env/info.md)
