---
title: "nb source dev"
description: "nb source dev command reference: start NocoBase development mode for npm or Git source envs."
keywords: "nb source dev,NocoBase CLI,development mode,hot reload"
---

# nb source dev

Start development mode for npm or Git source envs. For Docker envs, use [`nb app logs`](../app/logs.md) to inspect runtime logs.

## Usage

```bash
nb source dev [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env name to enter development mode; uses the current env if omitted |
| `--db-sync` | boolean | Sync the database before starting development mode |
| `--port`, `-p` | string | Development server port |
| `--client`, `-c` | boolean | Start client only |
| `--server`, `-s` | boolean | Start server only |
| `--inspect`, `-i` | string | Node.js inspect debug port for the server |

## Examples

```bash
nb source dev
nb source dev --env app1
nb source dev --env app1 --db-sync
nb source dev --env app1 --port 12000
nb source dev --env app1 --client
nb source dev --env app1 --server
nb source dev --env app1 --inspect 9229
```

## Related Commands

- [`nb source download`](./download.md)
- [`nb app start`](../app/start.md)
- [`nb app logs`](../app/logs.md)
