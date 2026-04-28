---
title: "nb app down"
description: "nb app down command reference: stop and clean up local runtime resources for a selected env."
keywords: "nb app down,NocoBase CLI,cleanup,remove containers,storage"
---

# nb app down

Stop and clean up local runtime resources for a selected env. Storage data and env configuration are kept by default; pass `--all --yes` explicitly to delete everything.

## Usage

```bash
nb app down [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env name to clean up; uses the current env if omitted |
| `--all` | boolean | Delete all content for the env, including storage data and saved env configuration |
| `--yes`, `-y` | boolean | Skip destructive-operation confirmation; usually used with `--all` |
| `--verbose` | boolean | Show underlying stop and cleanup command output |

## Examples

```bash
nb app down --env app1
nb app down --env app1 --all --yes
```

## Related Commands

- [`nb app stop`](./stop.md)
- [`nb env remove`](../env/remove.md)
- [`nb db stop`](../db/stop.md)
