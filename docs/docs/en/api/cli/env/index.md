---
title: "nb env"
description: "nb env command reference: manage NocoBase CLI envs, including add, inspect current env, check status, switch, authenticate, and remove."
keywords: "nb env,NocoBase CLI,environment management,env,current env,authentication,OpenAPI"
---

# nb env

Manage saved NocoBase CLI envs. An env stores API URL, authentication info, local app paths, database config, and runtime command cache.

In the current model, the CLI separates two concepts:

- `current env`: the env currently used by the active shell or agent runtime, isolated by `NB_SESSION_ID` when available
- `last env`: the globally last-used env, used as a fallback when session mode is not enabled

## Usage

```bash
nb env <command>
```

## Subcommands

| Command | Description |
| --- | --- |
| [`nb env add`](./add.md) | Save a NocoBase API endpoint and switch to that env |
| [`nb env current`](./current.md) | Show the currently effective env |
| [`nb env update`](./update.md) | Refresh OpenAPI Schema and runtime command cache from the app |
| [`nb env list`](./list.md) | List configured envs |
| [`nb env status`](./status.md) | Show status for the current env, one env, or all envs |
| [`nb env info`](./info.md) | Show details for a single env |
| [`nb env remove`](./remove.md) | Stop managed runtime if present, then remove env configuration |
| [`nb env auth`](./auth.md) | Run OAuth login for a saved env |
| [`nb env use`](./use.md) | Switch current env |

## Examples

```bash
nb env add app1 --api-base-url http://localhost:13000/api
nb env current
nb env list
nb env status
nb env info app1
nb env update app1
nb env use app1
nb env auth app1
```

## Session mode

Session mode is the default recommendation. It keeps `current env` isolated across different terminals, shells, and agent runtimes, so parallel work does not affect each other.

When session mode is not enabled, `nb env use` updates the global `last env`, and other sessions without isolation may also be affected.

See [`nb session setup`](../session/setup.md) to enable it.

## Related Commands

- [`nb init`](../init.md)
- [`nb api`](../api/index.md)
- [`nb app`](../app/index.md)
- [`nb session`](../session/index.md)
