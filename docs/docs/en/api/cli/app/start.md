---
title: "nb app start"
description: "nb app start command reference: start the NocoBase app for a selected env; local envs automatically complete install or upgrade preparation before startup, and Docker envs recreate the app container from saved env config."
keywords: "nb app start,NocoBase CLI,start app,Docker,pm2"
---

# nb app start

Start the NocoBase app for a selected env. npm/Git installations automatically complete install or upgrade preparation before running local app commands; Docker installations recreate the saved app container from saved env config.

## Usage

```bash
nb app start [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env name to start; uses the current env if omitted |
| `--yes`, `-y` | boolean | When an explicitly passed `--env` targets a different env than the current env, skip the interactive confirmation prompt |
| `--daemon`, `-d` / `--no-daemon` | boolean | Whether to run in daemon mode; enabled by default |
| `--verbose` | boolean | Show underlying local or Docker command output |

## Examples

```bash
nb app start
nb app start --env local
nb app start --env local --daemon
nb app start --env local --no-daemon
nb app start --env local --verbose
nb app start --env local-docker
```

If you explicitly pass `--env` and it differs from the current env, the CLI asks for confirmation first. In non-interactive terminals or AI agent sessions, add `--yes` yourself or run `nb env use <name>` first and try again.

By default, local envs automatically complete any required install or upgrade preparation before starting in daemon mode, and Docker envs recreate the app container from saved env config. Whenever the CLI needs to wait for readiness, it checks `__health_check`: it prints one waiting line first, then one progress line every 10 seconds until the app becomes available or times out.

If you pass `--no-daemon` for a local env, the app runs in the foreground. In that case, the CLI does not keep waiting for the readiness check after startup.

## Related Commands

- [`nb app stop`](./stop.md)
- [`nb app restart`](./restart.md)
- [`nb app logs`](./logs.md)
