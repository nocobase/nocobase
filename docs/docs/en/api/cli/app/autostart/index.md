---
title: "nb app autostart"
description: "nb app autostart command group reference: enable or disable autostart for local or Docker envs, and start all enabled envs in one run."
keywords: "nb app autostart,NocoBase CLI,autostart,local,docker"
---

# nb app autostart

Manage application autostart settings.

This command group covers two kinds of work:

- enable or disable the autostart flag for one env
- start every env that already has autostart enabled

`nb app autostart` only applies to envs with a CLI-managed runtime on the current machine, namely `local` and `docker`. If an env is only a remote API connection, or is not a CLI-managed app runtime that can be started on this machine, it cannot be part of this autostart flow.

## Usage

```bash
nb app autostart <command>
```

## Subcommands

| Command | Description |
| --- | --- |
| [`nb app autostart enable`](./enable.md) | Enable the autostart flag for one env |
| [`nb app autostart disable`](./disable.md) | Disable the autostart flag for one env |
| [`nb app autostart list`](./list.md) | Show autostart status for all envs |
| [`nb app autostart run`](./run.md) | Start every env that has autostart enabled |

## Notes

`nb app autostart enable` only marks an env as allowed to start automatically. It does not wire the env into your operating system startup flow by itself. In a real production setup, you usually still need to call `nb app autostart run` from your own host startup mechanism, such as `systemd`, a container platform startup script, or another boot process you already use.

Also, `nb app autostart run` checks each enabled env one by one. Startable envs continue through `nb app start --env <name> --yes`. Envs that should not be started automatically on the current machine show up as `skipped` or `failed` in the result table.

## Examples

```bash
# Enable autostart for the current env
nb app autostart enable

# Enable autostart for a specific env
nb app autostart enable --env app1 --yes

# Show autostart status
nb app autostart list

# Start every enabled env
nb app autostart run

# Show underlying startup output
nb app autostart run --verbose
```

## Related commands

- [`nb app start`](../start.md)
- [`nb app stop`](../stop.md)
- [`nb env list`](../../env/list.md)
- [`nb env use`](../../env/use.md)
