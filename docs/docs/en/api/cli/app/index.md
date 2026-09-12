---
title: 'nb app'
description: 'nb app command reference: manage the NocoBase application runtime, including start, stop, restart, logs, and upgrade.'
keywords: 'nb app,NocoBase CLI,start,stop,restart,logs,upgrade'
---

# nb app

Manage the NocoBase application runtime. In npm/Git env, application commands run in the local source directory; in Docker env, application containers are managed based on the saved configuration.

## Usage

```bash
nb app <command>
```

## Subcommands

| Command                          | Description                                                                 |
| -------------------------------- | --------------------------------------------------------------------------- |
| [`nb app start`](./start.md)     | Start the application or recreate the Docker container                      |
| [`nb app stop`](./stop.md)       | Stop the application or clean up the Docker container                       |
| [`nb app restart`](./restart.md) | Stop the application first, then start it                                   |
| [`nb app autostart`](./autostart/index.md) | Manage app autostart flags and start all enabled envs |
| [`nb app logs`](./logs.md)       | View application logs                                                       |
| [`nb app upgrade`](./upgrade.md) | Stop the application, replace the source code or image, then start it again |

## Examples

```bash
nb app start --env app1
nb app restart --env app1
nb app autostart enable --env app1 --yes
nb app autostart run
nb app logs --env app1
nb app upgrade --env app1 --skip-download
nb app stop --env app1 --with-db
```

## Related commands

- [`nb env info`](../env/info.md)
- [`nb env remove`](../env/remove.md)
- [`nb db ps`](../db/ps.md)
- [`nb source download`](../source/download.md)
