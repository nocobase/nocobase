---
title: "nb app autostart run"
description: "nb app autostart run command reference: start every env that has application autostart enabled."
keywords: "nb app autostart run,NocoBase CLI,autostart,batch start"
---

# nb app autostart run

Start every env that has application autostart enabled.

This command is typically called after the host system boots, through your own startup mechanism. The CLI reads all saved envs, filters the ones that have autostart enabled, and then tries to start them one by one.

## Usage

```bash
nb app autostart run [flags]
```

## Flags

| Flag | Type | Description |
| --- | --- | --- |
| `--verbose` | boolean | Show raw startup output from the underlying local or Docker command |

## Examples

```bash
nb app autostart run
nb app autostart run --verbose
```

## Notes

If no env has autostart enabled, the command prints `No environments have app autostart enabled.`.

During execution, the CLI processes each enabled env one by one:

- startable envs show up as `started`
- envs that should not be started automatically on the current machine show up as `skipped`
- envs that fail during startup show up as `failed`

Internally, this command calls `nb app start --env <name> --yes`. If you pass `--verbose`, that flag is forwarded to the underlying startup flow as well.

If any result is `failed`, the command exits with an error and prints `Some app autostart envs failed to start.`. This makes failures visible in `systemd`, CI, or other host startup mechanisms.

## Related commands

- [`nb app autostart enable`](./enable.md)
- [`nb app start`](../start.md)
- [`nb app logs`](../logs.md)
