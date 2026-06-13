---
title: "nb app restart"
description: "nb app restart command reference: restart the NocoBase app for a selected env; when applicable, the CLI first synchronizes the commercial plugins allowed by the current license, then local envs automatically complete install or upgrade preparation during restart, and Docker envs recreate the app container from saved env config when needed."
keywords: "nb app restart,NocoBase CLI,restart app,Docker"
---

# nb app restart

Stop and then start the NocoBase app for a selected env. When applicable, the CLI first synchronizes the commercial plugins allowed by the current license. Then local envs reuse the `nb app stop` and `nb app start` flow and, by default, automatically complete install or upgrade preparation before starting again; Docker envs remove the current container first, then recreate the app container from saved env config.

## Usage

```bash
nb app restart [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env name to restart; uses the current env if omitted |
| `--yes`, `-y` | boolean | When an explicitly passed `--env` targets a different env than the current env, skip the interactive confirmation prompt |
| `--verbose` | boolean | Show underlying stop and start command output |

## Examples

```bash
nb app restart
nb app restart --env local
nb app restart --env local --verbose
nb app restart --env local-docker
```

If you explicitly pass `--env` and it differs from the current env, the CLI asks for confirmation first. In non-interactive terminals or AI agent sessions, add `--yes` yourself or run `nb env use <name>` first and try again.

By default, when applicable, the CLI first runs `nb license plugins sync --skip-if-no-license` to synchronize the commercial plugins allowed by the current license. Then local envs automatically complete any required install or upgrade preparation before starting again, and Docker envs complete that step before recreating the container. Whenever the CLI needs to wait for readiness, it checks `__health_check`: it prints one waiting line first, then one progress line every 10 seconds until the app becomes available or times out.

## Related Commands

- [`nb app start`](./start.md)
- [`nb app stop`](./stop.md)
- [`nb app logs`](./logs.md)
