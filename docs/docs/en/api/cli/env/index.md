---
title: "nb env"
description: "nb env command reference: manage NocoBase CLI envs, including add, refresh, inspect, switch, authenticate, and remove."
keywords: "nb env,NocoBase CLI,environment management,env,authentication,OpenAPI"
---

# nb env

Manage saved NocoBase CLI envs. An env stores API URL, authentication info, local app paths, database config, and runtime command cache.

## Usage

```bash
nb env <command>
```

## Subcommands

| Command | Description |
| --- | --- |
| [`nb env add`](./add.md) | Save a NocoBase API endpoint and switch to it as the current env |
| [`nb env update`](./update.md) | Refresh OpenAPI Schema and runtime command cache from the app |
| [`nb env list`](./list.md) | List configured envs and API authentication status |
| [`nb env info`](./info.md) | Show details for a single env |
| [`nb env remove`](./remove.md) | Remove env configuration |
| [`nb env auth`](./auth.md) | Run OAuth login for a saved env |
| [`nb env use`](./use.md) | Switch current env |

## Examples

```bash
nb env add app1 --api-base-url http://localhost:13000/api
nb env list
nb env info app1
nb env update app1
nb env use app1
nb env auth app1
```

## Related Commands

- [`nb init`](../init.md)
- [`nb api`](../api/index.md)
- [`nb app`](../app/index.md)
