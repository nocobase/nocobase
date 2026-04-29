---
title: "nb app restart"
description: "nb app restart command reference: restart the NocoBase app or Docker container for a selected env."
keywords: "nb app restart,NocoBase CLI,restart app,Docker"
---

# nb app restart

Stop and then start the NocoBase app for a selected env.

## Usage

```bash
nb app restart [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env name to restart; uses the current env if omitted |
| `--quickstart` | boolean | Start the app in quickstart mode after stopping |
| `--port`, `-p` | string | Override the `appPort` saved in env config |
| `--daemon`, `-d` / `--no-daemon` | boolean | Whether to run in daemon mode after stopping; enabled by default |
| `--instances`, `-i` | integer | Number of instances to run after stopping |
| `--launch-mode` | string | Launch mode: `pm2` or `node` |
| `--verbose` | boolean | Show underlying stop and start command output |

## Examples

```bash
nb app restart
nb app restart --env local
nb app restart --env local --quickstart
nb app restart --env local --port 12000
nb app restart --env local --no-daemon
nb app restart --env local --instances 2
nb app restart --env local --launch-mode pm2
nb app restart --env local-docker
```

## Related Commands

- [`nb app start`](./start.md)
- [`nb app stop`](./stop.md)
- [`nb app logs`](./logs.md)
