---
title: "nb app start"
description: "nb app start command reference: start the NocoBase app or Docker container for a selected env."
keywords: "nb app start,NocoBase CLI,start app,Docker,pm2"
---

# nb app start

Start the NocoBase app for a selected env. npm/Git installations run local app commands; Docker installations start the saved app container.

## Usage

```bash
nb app start [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env name to start; uses the current env if omitted |
| `--quickstart` | boolean | Start the app in quickstart mode |
| `--port`, `-p` | string | Override the `appPort` saved in env config |
| `--daemon`, `-d` / `--no-daemon` | boolean | Whether to run in daemon mode; enabled by default |
| `--instances`, `-i` | integer | Number of instances to run |
| `--launch-mode` | string | Launch mode: `pm2` or `node` |
| `--verbose` | boolean | Show underlying local or Docker command output |

## Examples

```bash
nb app start
nb app start --env local
nb app start --env local --quickstart
nb app start --env local --port 12000
nb app start --env local --daemon
nb app start --env local --no-daemon
nb app start --env local --instances 2
nb app start --env local --launch-mode pm2
nb app start --env local-docker
```

## Related Commands

- [`nb app stop`](./stop.md)
- [`nb app restart`](./restart.md)
- [`nb app logs`](./logs.md)
