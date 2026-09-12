---
title: "nb app autostart disable"
description: "nb app autostart disable command reference: disable application autostart for one env."
keywords: "nb app autostart disable,NocoBase CLI,autostart,env"
---

# nb app autostart disable

Disable the application autostart flag for one env.

After disabling it, the env no longer participates in `nb app autostart run`. This command does not stop an already running app by itself. If you also want to stop the current runtime, use `nb app stop` separately.

## Usage

```bash
nb app autostart disable [flags]
```

## Flags

| Flag | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env name to remove from app autostart. Uses the current env when omitted |
| `--yes`, `-y` | boolean | Skip the interactive confirmation when explicit `--env` points to a different env than the current env |

## Examples

```bash
nb app autostart disable
nb app autostart disable --env app1
nb app autostart disable --env app1 --yes
```

## Notes

This command only changes the saved autostart flag. It does not stop the app directly. If an env was not enabled for autostart before, running this command keeps it in the disabled state.

Just like `enable`, the CLI only checks for a cross-env confirmation when you explicitly pass `--env`. In non-interactive terminals or AI agent flows, add `--yes` yourself when needed.

## Related commands

- [`nb app autostart enable`](./enable.md)
- [`nb app autostart list`](./list.md)
- [`nb app stop`](../stop.md)
