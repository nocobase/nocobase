---
title: "nb env update"
description: "nb env update command reference: refresh OpenAPI Schema and runtime command cache for a selected env."
keywords: "nb env update,NocoBase CLI,OpenAPI,runtime commands,swagger"
---

# nb env update

Refresh OpenAPI Schema from the NocoBase app and update local runtime command cache. Cache is stored in `.nocobase/versions/<hash>/commands.json`.

## Usage

```bash
nb env update [name] [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `[name]` | string | Env name; uses the current env if omitted |
| `--verbose` | boolean | Show detailed progress |
| `--api-base-url` | string | Override the NocoBase API URL and persist it to the target env |
| `--role` | string | Role override sent as the `X-Role` request header |
| `--token`, `-t` | string | API key override persisted to the target env |

## Examples

```bash
nb env update
nb env update prod
nb env update prod --api-base-url http://localhost:13000/api
nb env update prod --token <token>
```

## Related Commands

- [`nb api`](../api/)
- [`nb env info`](./info.md)
- [`nb env add`](./add.md)
