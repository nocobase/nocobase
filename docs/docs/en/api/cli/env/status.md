---
title: "nb env status"
description: "nb env status command reference: show status for the current env, one env, or all envs."
keywords: "nb env status,NocoBase CLI,environment status,API Base URL"
---

# nb env status

Show env status. By default it inspects the current env. You can also inspect one named env, or use `--all` to inspect all envs.

This command prints a simplified status table with `Env`, `Status`, and `API Base URL`.

## Usage

```bash
nb env status [name] [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `[name]` | string | Configured environment name to inspect; uses the current env if omitted; cannot be used with `--all` |
| `--all` | boolean | Show status for all configured envs |
| `--json-output` | boolean | Output the result as JSON |

`[name]` and `--all` cannot be used together.

## Status values

`Status` is the result returned after the CLI checks the target env. Typical values include:

- `ok`: the env is reachable and authenticated
- `auth failed`: the API is reachable but authentication failed
- `unreachable`: the target address could not be reached
- `unconfigured`: the env configuration is incomplete
- `missing`: the managed app for this env no longer exists

## Examples

```bash
nb env status
nb env status app1
nb env status --all
nb env status --all --json-output
```

## Related Commands

- [`nb env current`](./current.md)
- [`nb env list`](./list.md)
- [`nb env info`](./info.md)
